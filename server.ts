import * as Http from "http";
import * as Url from "url";
import * as Mongo from "mongodb";

declare global { // https://stackoverflow.com/questions/42025767/how-to-declare-a-type-globally-in-a-project-typescript
  interface Recipe {
    recipeID: Mongo.ObjectID;
    recipename: string;
    preparation: string;
    ingredients: Array<string>;
  }

  interface AllRecipes {
    author: string;
    recipe: Recipe;
  }

  interface User {
    _id: string;
    password: string;
    recipes: Array<Recipe>;
    favorites: Array<Mongo.ObjectID>;
  }
}

export namespace Server {
  let connectionString: string = "mongodb+srv://Admin:Test@cluster0.oazcj.mongodb.net/schmackofatz?retryWrites=true&w=majority";
  // let connectionString: string = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&ssl=false";
  let collection: Mongo.Collection;
  let user: User;
  let allRecipes: Array<AllRecipes>;

  startServer();
  connectDB();

  async function startServer(): Promise<void> {
    console.log("Starting server");
    let port: number = Number(process.env.PORT);
    if (!port)
      port = 8100;

    let server: Http.Server = Http.createServer();
    server.addListener("request", handleRequest);
    server.listen(port);
  }

  async function connectDB(): Promise<void> {
    console.log("Starting DB");
    let options: Mongo.MongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };
    let mongoClient: Mongo.MongoClient = new Mongo.MongoClient(connectionString, options);
    await mongoClient.connect();
    collection = mongoClient.db("schmackofatz").collection("User");
  }

  export async function handleRequest(_request: Http.IncomingMessage, _response: Http.ServerResponse): Promise<void> {

    _response.setHeader("content-type", "text/html; charset=utf-8");
    _response.setHeader("Access-Control-Allow-Origin", "*");

    let q: Url.UrlWithParsedQuery = Url.parse(_request.url!, true); // URL wird untersucht, parse untersucht _request.url! & übergibt q den Wert mit Typ UrlWithParsedQuery
    let qdata: any = q.query; // q wird mit query(=Abfrage) abgefragt, was drinnen steht -- dynamische Auswertung von q (qdata kann auf das, was in URL übergeben wurde, zugreifen (function, username, password))
    let response: string = "";

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

  async function checkRegistration(_username: string, _password: string): Promise<Boolean> {
    if (_username == null || _username == "" || _password == null || _password == "") {
      return false;
    }
    user = await collection.findOne({ _id: _username });
    if (user != null) {
      return false;
    }
    let newUser: User = { _id: _username, password: _password, recipes: Array<Recipe>(), favorites: Array<Mongo.ObjectID>() };
    collection.insertOne(newUser);
    return true;
  }

  async function checkLogin(_username: string, _password: string): Promise<Boolean> {
    user = await collection.findOne({ _id: _username });
    if (user == null || user.password != _password) {
      return false;
    }
    return true;
  }

  async function checkSave(_mode: string, _recipeID: string, _recipename: string, _ingredients: Array<string>, _preparation: string): Promise<Boolean> {
    if (user == null) {
      return false;
    }
    let newIngredients: Array<string> = new Array;
    for (let i: number = 0; i < _ingredients.length; i++) {
      if (_ingredients[i] == "") {
        continue;
      }
      newIngredients.push(_ingredients[i]);
    }
    if (_mode == "add") {
      let newRecipeID: Mongo.ObjectID = new Mongo.ObjectID();
      let newRecipe: Recipe = { recipeID: newRecipeID, recipename: _recipename, ingredients: newIngredients, preparation: _preparation };
      user.recipes.push(newRecipe);
    } else if (_mode == "edit") {
      let index: number = getRecipeByID(user.recipes, _recipeID);
      if (index < 0) {
        return false;
      }
      let recipe: Recipe = { recipeID: user.recipes[index].recipeID, recipename: _recipename, ingredients: newIngredients, preparation: _preparation };
      user.recipes[index] = recipe;
    }
    collection.updateOne({ _id: user._id }, { $set: { recipes: user.recipes } });
    return true;
  }

  async function checkDelete(_recipeID: string): Promise<Boolean> {
    if (user == null) {
      return false;
    }
    let index: number = getRecipeByID(user.recipes, _recipeID);
    if (index < 0) {
      return false;
    }
    user.recipes.splice(index, 1);
    collection.updateOne({ _id: user._id }, { $set: { recipes: user.recipes } });
    return true;
  }

  async function checkReadAllRecipes(): Promise<Boolean> {
    allRecipes = new Array<AllRecipes>();
    // https://dba.stackexchange.com/questions/188441/how-to-views-all-documents-in-a-particular-collection-of-database-in-mongodb-thr
    await collection.find({}).forEach(user => {
      for (let i: number = 0; i < user.recipes.length; i++) {
        let recipe: AllRecipes = { author: user.recipes[i].recipeID, recipe: user.recipes[i] };
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

  async function checkFavorite(_recipeID: string): Promise<Boolean> {
    if (user == null) {
      return false;
    }
    if (allRecipes == null) {
      return false;
    }
    let index: number = user.favorites.findIndex(objectID => String(objectID) == _recipeID);
    if (index < 0) {
      let index: number = allRecipes.findIndex(objectID => String(objectID.recipe.recipeID) == _recipeID);
      let newFavorite: Mongo.ObjectID = allRecipes[index].recipe.recipeID;
      user.favorites.push(newFavorite);
    } else {
      user.favorites.splice(index, 1);
    }
    collection.updateOne({ _id: user._id }, { $set: { favorites: user.favorites } });
    return true;
  }

  function getRecipeByID(_recipes: Array<Recipe>, _recipeID: string): number {
    // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
    return _recipes.findIndex(recipe => String(recipe.recipeID) == _recipeID);
  }
}