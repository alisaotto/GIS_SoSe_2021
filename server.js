"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const Http = require("http");
const Url = require("url");
const Mongo = require("mongodb");
var Server;
(function (Server) {
    let connectionString = "mongodb+srv://Admin:Test@cluster0.oazcj.mongodb.net/schmackofatz?retryWrites=true&w=majority";
    let collection;
    startServer();
    connectDB();
    // Server starten
    async function startServer() {
        console.log("Starting server");
        let port = Number(process.env.PORT);
        if (!port)
            port = 8100;
        let server = Http.createServer();
        server.addListener("request", handleRequest);
        server.listen(port);
    }
    // Datenbank verbinden
    async function connectDB() {
        console.log("Starting DB");
        let options = { useNewUrlParser: true, useUnifiedTopology: true };
        let mongoClient = new Mongo.MongoClient(connectionString, options);
        await mongoClient.connect();
        collection = mongoClient.db("schmackofatz").collection("User");
    }
    // Serveranforderungen behandeln:
    //    "registration"    Benutzer registrieren
    //    "login"           Benutzer einloggen
    //    "saveRecipe"      Rezept speichern
    //    "deleteRecipe"    Rezept löschen
    //    "toggleFavorite"  Favorit hinzufügen/entfernen
    //    "readUser"        Benutzer lesen
    //    "readAllRecipes"  Alle Rezepte lesen
    async function handleRequest(_request, _response) {
        _response.setHeader("content-type", "text/html; charset=utf-8");
        _response.setHeader("Access-Control-Allow-Origin", "*");
        let q = Url.parse(_request.url, true); // URL wird untersucht, parse untersucht _request.url! & übergibt q den Wert mit Typ UrlWithParsedQuery
        let qdata = q.query; // q wird mit query(=Abfrage) abgefragt, was drinnen steht -- dynamische Auswertung von q (qdata kann auf das, was in URL übergeben wurde, zugreifen (function, username, password))
        let response = "";
        switch (qdata.function) {
            case "registration":
                if (await checkRegistration(qdata.username, qdata.password)) {
                    response = JSON.stringify(qdata.username);
                }
                break;
            case "login":
                if (await checkLogin(qdata.username, qdata.password)) {
                    response = JSON.stringify(qdata.username);
                }
                break;
            case "saveRecipe":
                if (await checkSaveRecipe(_request, qdata.mode, qdata.username, qdata.recipeID, qdata.recipename, qdata.ingredient, qdata.preparation)) {
                    response = JSON.stringify(qdata.username);
                }
                break;
            case "deleteRecipe":
                if (await checkDeleteRecipe(qdata.username, qdata.recipeID)) {
                    response = JSON.stringify(qdata.username);
                }
                break;
            case "toggleFavorite":
                if (await checkFavorite(qdata.username, qdata.recipeID)) {
                    response = JSON.stringify(qdata.username);
                }
                break;
            case "readUser":
                let user = await collection.findOne({ _id: qdata.username });
                if (user != null) {
                    response = JSON.stringify(user);
                }
                break;
            case "readAllRecipes":
                let allRecipes = await readAllRecipes();
                if (allRecipes != null && allRecipes.length != 0) {
                    response = JSON.stringify(allRecipes);
                }
                break;
            default:
                break;
        }
        _response.write(response); // write übergibt die response
        _response.end();
    }
    Server.handleRequest = handleRequest;
    // Neuen Benutzer auf der Datenbank speichern
    // Rückgabe false, wenn der Benutzer oder das Passwort leer ist oder schon schon auf der Datenbank existiert
    // Rückgabe true, wenn der Benutzer erfolgreich auf der Datenbank gespeichert wurde
    async function checkRegistration(_username, _password) {
        if (_username == null || _username == "" || _password == null || _password == "") {
            return false;
        }
        let user = await collection.findOne({ _id: _username });
        if (user != null) {
            return false;
        }
        let newUser = { _id: _username, password: _password, recipes: Array(), favorites: Array() };
        collection.insertOne(newUser);
        return true;
    }
    // Benutzer einloggen
    // Rückgabe false, wenn der Benutzer oder das Passwort nicht auf der Datenbank existiert
    // Rückgabe true, wenn der Benutzer erfolgreich auf der Datenbank gelesen wurde
    async function checkLogin(_username, _password) {
        let user = await collection.findOne({ _id: _username });
        if (user == null || user.password != _password) {
            return false;
        }
        return true;
    }
    // Rezept des Benutzers speichern oder ändern
    // Rückgabe false, wenn der Benutzer oder das Rezept beim Ändern auf der Datenbank nicht existiert
    // Rückgabe true, wenn das Rezept erfolgreich auf der Datenbank gespeichert wurde
    async function checkSaveRecipe(_request, _mode, _username, _recipeID, _recipename, _ingredients, _preparation) {
        let user = await collection.findOne({ _id: _username });
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
    // Rezept des Benutzers löschen
    // Rückgabe false, wenn der Benutzer oder das Rezept auf der Datenbank nicht existiert
    // Rückgabe true, wenn das Rezept erfolgreich aus der Datenbank gelöscht wurde
    async function checkDeleteRecipe(_username, _recipeID) {
        let user = await collection.findOne({ _id: _username });
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
    // Favorit des Benutzers hinzufügen oder entfernen
    // Rückgabe false, wenn der Benutzer oder der Favorit auf der Datenbank nicht existiert
    // Rückgabe true, wenn dar Favorit erfolgreich auf der Datenbank gespeichert wurde
    async function checkFavorite(_username, _recipeID) {
        let user = await collection.findOne({ _id: _username });
        if (user == null) {
            return false;
        }
        let allRecipes = await readAllRecipes();
        let index = user.favorites.findIndex(objectID => String(objectID) == _recipeID);
        if (index < 0) {
            let index = allRecipes.findIndex(objectID => String(objectID.recipe.recipeID) == _recipeID);
            if (index < 0) {
                return false;
            }
            let newFavorite = allRecipes[index].recipe.recipeID;
            user.favorites.push(newFavorite);
        }
        else {
            user.favorites.splice(index, 1);
        }
        collection.updateOne({ _id: user._id }, { $set: { favorites: user.favorites } });
        return true;
    }
    // Alle Rezepte aus der Datenbank lesen
    async function readAllRecipes() {
        let allRecipes = new Array();
        await collection.find({}).forEach(user => {
            for (let i = 0; i < user.recipes.length; i++) {
                let recipe = { author: user.recipes[i].recipeID, recipe: user.recipes[i] };
                recipe.author = user._id;
                recipe.recipe = user.recipes[i];
                allRecipes.push(recipe);
            }
        });
        return allRecipes;
    }
    // Index des Rezepts über die Rezept ID ermitteln
    // Parameter:
    //    _recipes:  Array mit Rezepten
    //    _recipeID: Die Rezept ID, die gesucht werden soll
    function getRecipeByID(_recipes, _recipeID) {
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        return _recipes.findIndex(recipe => String(recipe.recipeID) == _recipeID);
    }
})(Server = exports.Server || (exports.Server = {}));
//# sourceMappingURL=server.js.map