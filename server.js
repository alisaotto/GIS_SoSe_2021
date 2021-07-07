"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const Http = require("http");
const Url = require("url");
const Mongo = require("mongodb");
var Server;
(function (Server) {
    let connectionString = "mongodb+srv://Admin:Test@cluster0.oazcj.mongodb.net/schmackofatz?retryWrites=true&w=majority";
    // let connectionString: string = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
    let collection;
    let user;
    let allRecipes;
    startServer();
    connectDB();
    async function startServer() {
        console.log("Starting server");
        let port = Number(process.env.PORT);
        if (!port)
            port = 8100;
        let server = Http.createServer();
        server.addListener("request", handleRequest);
        server.listen(port);
    }
    async function connectDB() {
        console.log("Starting DB");
        let options = { useNewUrlParser: true, useUnifiedTopology: true };
        let mongoClient = new Mongo.MongoClient(connectionString, options);
        await mongoClient.connect();
        collection = mongoClient.db("schmackofatz").collection("User");
    }
    async function handleRequest(_request, _response) {
        _response.setHeader("content-type", "text/html; charset=utf-8");
        _response.setHeader("Access-Control-Allow-Origin", "*");
        let q = Url.parse(_request.url, true); // URL wird untersucht, parse untersucht _request.url! & übergibt q den Wert mit Typ UrlWithParsedQuery
        let qdata = q.query; // q wird mit query(=Abfrage) abgefragt, was drinnen steht -- dynamische Auswertung von q (qdata kann auf das, was in URL übergeben wurde, zugreifen (function, username, password))
        let response = "";
        switch (qdata.function) {
            case "registration":
                if (await checkRegistration(qdata.username, qdata.password)) {
                    response = JSON.stringify(user);
                }
                break;
            case "login":
                if (await checkLogin(qdata.username, qdata.password)) {
                    response = JSON.stringify(user);
                }
                break;
            case "save":
                if (await checkSave(qdata.mode, qdata.recipeID, qdata.recipename, qdata.ingredient, qdata.preparation)) {
                    response = JSON.stringify(user);
                }
                break;
            case "delete":
                if (await checkDelete(qdata.recipeID)) {
                    response = JSON.stringify(user);
                }
                break;
            case "readAllRecipes":
                if (await checkReadAllRecipes()) {
                    response = JSON.stringify(allRecipes);
                }
                break;
            case "toggleFavorite":
                if (await checkFavorite(qdata.recipeID)) {
                    response = JSON.stringify(user);
                }
                break;
            default:
                break;
        }
        _response.write(response); // write übergibt die response
        _response.end();
    }
    Server.handleRequest = handleRequest;
    async function checkRegistration(_username, _password) {
        if (_username == null || _username == "" || _password == null || _password == "") {
            return false;
        }
        user = await collection.findOne({ _id: _username });
        if (user != null) {
            return false;
        }
        let newUser = { _id: _username, password: _password, recipes: Array(), favorites: Array() };
        collection.insertOne(newUser);
        return true;
    }
    async function checkLogin(_username, _password) {
        user = await collection.findOne({ _id: _username });
        if (user == null || user.password != _password) {
            return false;
        }
        return true;
    }
    async function checkSave(_mode, _recipeID, _recipename, _ingredients, _preparation) {
        if (user == null) {
            return false;
        }
        let newIngredients = new Array;
        for (let i = 0; i < _ingredients.length; i++) {
            if (_ingredients[i] == "") {
                continue;
            }
            newIngredients.push(_ingredients[i]);
        }
        if (_mode == "add") {
            let newRecipeID = new Mongo.ObjectID();
            let newRecipe = { recipeID: newRecipeID, recipename: _recipename, ingredients: newIngredients, preparation: _preparation };
            user.recipes.push(newRecipe);
        }
        else if (_mode == "edit") {
            let index = getRecipeByID(user.recipes, _recipeID);
            if (index < 0) {
                return false;
            }
            let recipe = { recipeID: user.recipes[index].recipeID, recipename: _recipename, ingredients: newIngredients, preparation: _preparation };
            user.recipes[index] = recipe;
        }
        collection.updateOne({ _id: user._id }, { $set: { recipes: user.recipes } });
        return true;
    }
    async function checkDelete(_recipeID) {
        if (user == null) {
            return false;
        }
        let index = getRecipeByID(user.recipes, _recipeID);
        if (index < 0) {
            return false;
        }
        user.recipes.splice(index, 1);
        collection.updateOne({ _id: user._id }, { $set: { recipes: user.recipes } });
        return true;
    }
    async function checkReadAllRecipes() {
        allRecipes = new Array();
        // https://dba.stackexchange.com/questions/188441/how-to-views-all-documents-in-a-particular-collection-of-database-in-mongodb-thr
        await collection.find({}).forEach(user => {
            for (let i = 0; i < user.recipes.length; i++) {
                let recipe = { author: user.recipes[i].recipeID, recipe: user.recipes[i] };
                recipe.author = user._id;
                recipe.recipe = user.recipes[i];
                allRecipes.push(recipe);
            }
        });
        if (allRecipes.length == 0) {
            return false;
        }
        return true;
    }
    async function checkFavorite(_recipeID) {
        if (user == null) {
            return false;
        }
        if (allRecipes == null) {
            return false;
        }
        let index = user.favorites.findIndex(objectID => String(objectID) == _recipeID);
        if (index < 0) {
            let index = allRecipes.findIndex(objectID => String(objectID.recipe.recipeID) == _recipeID);
            let newFavorite = allRecipes[index].recipe.recipeID;
            user.favorites.push(newFavorite);
        }
        else {
            user.favorites.splice(index, 1);
        }
        collection.updateOne({ _id: user._id }, { $set: { favorites: user.favorites } });
        return true;
    }
    function getRecipeByID(_recipes, _recipeID) {
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        return _recipes.findIndex(recipe => String(recipe.recipeID) == _recipeID);
    }
})(Server = exports.Server || (exports.Server = {}));
//# sourceMappingURL=server.js.map