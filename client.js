"use strict";
var Client;
(function (Client) {
    function handleInitStartPage() {
        setModalBox();
        setButtonLogout();
        readAllRecipes();
        listAllRecipes();
    }
    Client.handleInitStartPage = handleInitStartPage;
    function handleInitLogin() {
        readAllRecipes();
    }
    Client.handleInitLogin = handleInitLogin;
    function handleInitMyRecipes() {
        setModalBox();
        setButtonLogout();
        listMyRecipes();
    }
    Client.handleInitMyRecipes = handleInitMyRecipes;
    function handleInitFavorites() {
        setModalBox();
        setButtonLogout();
        readAllRecipes();
        listMyFavorites();
    }
    Client.handleInitFavorites = handleInitFavorites;
    async function handleLogin() {
        let responseText = await getResponseText("?function=login&");
        if (responseText != "") {
            localStorage.setItem("User", responseText);
            localStorage.removeItem("RecipeID");
            window.alert("Du hast dich erfolgreich eingeloggt.");
            window.location.pathname = "startseite.html";
        }
        else {
            window.alert("Die Anmeldung ist fehlgeschlagen. Gebe deinen Benutzernamen und dein Passwort richtig ein oder registriere dich.");
        }
    }
    Client.handleLogin = handleLogin;
    async function handleRegistration() {
        let responseText = await getResponseText("?function=registration&");
        if (responseText != "") {
            window.alert("Du hast dich für schmackofatz! registriert. Du kannst dich nun login.");
        }
        if (responseText == "") {
            window.alert("Du musst einen Benutzernamen und ein Passwort eingeben.");
        }
        else {
            window.alert("Registration fehlgeschlagen. Dieser Benutzername ist leider schon vergeben.");
        }
    }
    Client.handleRegistration = handleRegistration;
    function handleLogout() {
        localStorage.clear();
        window.location.pathname = "Login.html";
    }
    Client.handleLogout = handleLogout;
    //https://www.w3schools.com/howto/howto_css_modals.asp
    function handleAdd() {
        setModalTitle("add");
        clearInputFields();
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "block";
        modalBox.scrollIntoView(true);
    }
    Client.handleAdd = handleAdd;
    async function handleSave() {
        let modal = document.getElementById("titleRecipe");
        let mode = modal.className;
        let recipeID = null;
        if (mode == "edit") {
            recipeID = localStorage.getItem("RecipeID");
        }
        else {
            recipeID = "";
        }
        if (recipeID != null) {
            let responseText = await getResponseText("?function=save&mode=" + mode + "&" + "recipeID=" + recipeID + "&");
            if (responseText != "") {
                localStorage.setItem("User", responseText);
                localStorage.removeItem("RecipeID");
                let modalBox = document.getElementById("modalBox");
                modalBox.style.display = "none";
                window.alert("Dein Rezept wurde erfolgreich gespeichert!");
                window.location.pathname = "meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gespeichert werden.");
    }
    Client.handleSave = handleSave;
    function handleRecipe(_event) {
        let image = _event.target;
        if (image == null) {
            return;
        }
        localStorage.setItem("RecipeID", image.className);
        if (image.id == "edit") {
            handleEdit();
        }
        else if (image.id == "delete") {
            handleDelete();
        }
        else if (image.id == "show") {
            handleShow();
        }
        else if (image.id == "deleteFavorite") {
            handleDeleteFavorite();
        }
        else if (image.id == "showFavorite") {
            handleShowFavorite();
        }
    }
    Client.handleRecipe = handleRecipe;
    async function handleToggleFavorite() {
        let user = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let recipeID = localStorage.getItem("RecipeID");
            if (recipeID != null) {
                let responseText = await getResponseText("?function=toggleFavorite&recipeID=" + recipeID + "&");
                if (responseText != "") {
                    localStorage.setItem("User", responseText);
                    window.alert("Das Rezept wurde zu deinen Favoriten hinzugefügt!");
                    setButtonFavorite();
                    return;
                }
            }
        }
        window.alert("das Rezept konnte nicht zu deinen Favoriten hinzugefügt werden.");
    }
    Client.handleToggleFavorite = handleToggleFavorite;
    function handleDropdown() {
        document.getElementById("dropdown").classList.toggle("show");
    }
    Client.handleDropdown = handleDropdown;
    function handleClose() {
        // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-yes-and-no-options
        localStorage.removeItem("RecipeID");
        readAllRecipes();
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "none";
        switch (modalBox.className) {
            case "modalBoxStart":
                window.location.pathname = "startseite.html";
                break;
            case "modalBoxMyRecipes":
                window.location.pathname = "meinerezepte.html";
                break;
            case "modalBoxFavorites":
                window.location.pathname = "favoriten.html";
                break;
            default:
                break;
        }
    }
    Client.handleClose = handleClose;
    async function readAllRecipes() {
        let responseText = await getResponseText("?function=readAllRecipes&");
        if (responseText != "") {
            localStorage.setItem("AllRecipes", responseText);
        }
        else {
            localStorage.removeItem("AllRecipes");
        }
    }
    Client.readAllRecipes = readAllRecipes;
    function listMyFavorites() {
        let favoritesStart = document.getElementById("favorites");
        let favoritesText = "";
        favoritesStart.innerHTML = favoritesText;
        let user = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let allRecipes = JSON.parse(localStorage.getItem("AllRecipes"));
            if (allRecipes != null && user.favorites != null && user.favorites.length > 0) {
                for (let i = 0; i < user.favorites.length; i++) {
                    let index = allRecipes.findIndex(recipe => recipe.recipe.recipeID == user.favorites[i]);
                    favoritesText = favoritesText + "<h2>♡ ";
                    if (index < 0) {
                        favoritesText = favoritesText + "Dieses Rezept ist leider nicht mehr vorhanden.";
                    }
                    else {
                        favoritesText = favoritesText + allRecipes[index].recipe.recipename + " von " +
                            allRecipes[index].author +
                            "<img src='../Pictures/glasses.png' id='showFavorite' class='" + user.favorites[i] + "' alt='showFavorite'>";
                    }
                    favoritesText = favoritesText +
                        "<img src='../Pictures/trash.png' id='deleteFavorite' class='" + user.favorites[i] + "' alt='deleteFavorite'>" +
                        "</h2>"; //generischer HTML Code
                }
            }
            else {
                favoritesText = "<h2>Du hast noch keine Favoriten angelegt.</h2>";
            }
            favoritesStart.innerHTML = favoritesText;
            return;
        }
        window.location.pathname = "startseite.html";
        window.alert("Deine Favoriten können nicht gelesen werden. Bitte melde Dich an!");
    }
    Client.listMyFavorites = listMyFavorites;
    async function listAllRecipes() {
        let allRecipes = JSON.parse(localStorage.getItem("AllRecipes"));
        let recipes = "";
        if (allRecipes != null) {
            let user = JSON.parse(localStorage.getItem("User"));
            for (let i = 0; i < allRecipes.length; i++) {
                let favoriteImage = "";
                if (user != null) {
                    let index = user.favorites.findIndex(objectID => objectID == allRecipes[i].recipe.recipeID);
                    if (index >= 0) {
                        favoriteImage = "♡ ";
                    }
                }
                recipes = recipes +
                    "<h2>" + favoriteImage +
                    allRecipes[i].recipe.recipename + " von " + allRecipes[i].author +
                    "<img src='../Pictures/glasses.png' id='show' class='" + allRecipes[i].recipe.recipeID + "' alt='show'>" +
                    "</h2>"; //generischer HTML Code      
            }
        }
        else {
            localStorage.removeItem("AllRecipes");
            recipes = "<h1>Es sind noch keine Rezepte vorhanden.</h1>";
        }
        let recipeWorld = document.getElementById("recipeWorld");
        recipeWorld.innerHTML = recipes;
    }
    function setModalBox() {
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "none";
    }
    function setButtonLogout() {
        let element = document.getElementById("logoutButtonText");
        let elementMobile = document.getElementById("logoutButtonTextMobile");
        let user = JSON.parse(localStorage.getItem("User"));
        if (user == null) {
            element.innerText = "ANMELDEN";
            elementMobile.innerText = "ANMELDEN";
        }
        else {
            element.innerText = "ABMELDEN";
            elementMobile.innerText = "ABMELDEN";
        }
    }
    function setButtonFavorite() {
        let element = document.getElementById("favoriteButton");
        if (element == null) {
            return;
        }
        element.innerHTML = "";
        let user = JSON.parse(localStorage.getItem("User"));
        if (user == null) {
            element.style.display = "none";
            return;
        }
        element.innerHTML = "Zu Favoriten hinzufügen";
        element.style.display = "block";
        let allRecipes = JSON.parse(localStorage.getItem("AllRecipes"));
        if (allRecipes == null) {
            return;
        }
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID == null) {
            return;
        }
        let index = user.favorites.findIndex(objectID => String(objectID) == recipeID);
        if (index < 0) {
            return;
        }
        element.innerHTML = "Aus Favoriten entfernen";
    }
    function setModalTitle(_mode) {
        let modal = document.getElementById("titleRecipe");
        modal.className = _mode;
        if (_mode == "add") {
            modal.innerText = "Neues Rezept";
        }
        else if (_mode == "edit") {
            modal.innerText = "Rezept ändern";
        }
        else if (_mode == "show") {
            modal.innerText = "Rezept anzeigen";
        }
        else if (_mode == "showFavorite") {
            modal.innerText = "Favorit anzeigen";
        }
    }
    function clearInputFields() {
        let recipename = document.getElementById("recipename");
        recipename.value = "";
        let ingredients = document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i = 0; i < 10; i++) {
            let ingredient = "";
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "'>";
        }
        let preparation = document.getElementById("preparation");
        preparation.value = "";
    }
    function fillInputFields() {
        let user = JSON.parse(localStorage.getItem("User"));
        if (user == null) {
            return false;
        }
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID == null || recipeID == "") {
            return false;
        }
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        let index = user.recipes.findIndex(recipe => String(recipe.recipeID) == recipeID);
        if (index < 0) {
            return false;
        }
        let recipename = document.getElementById("recipename");
        recipename.value = user.recipes[index].recipename;
        let ingredients = document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i = 0; i < 10; i++) {
            let ingredient = "";
            if (i < user.recipes[index].ingredients.length) {
                ingredient = user.recipes[index].ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "'>";
        }
        let preparation = document.getElementById("preparation");
        preparation.value = user.recipes[index].preparation;
        return true;
    }
    function fillTextFields() {
        let responseText = localStorage.getItem("AllRecipes");
        let allRecipes = JSON.parse(responseText);
        if (allRecipes == null) {
            return false;
        }
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID == null || recipeID == "") {
            return false;
        }
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        let index = allRecipes.findIndex(recipe => String(recipe.recipe.recipeID) == recipeID);
        if (index < 0) {
            return false;
        }
        let recipename = document.getElementById("recipename");
        recipename.value = allRecipes[index].recipe.recipename;
        let ingredients = document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i = 0; i < 10; i++) {
            let ingredient = "";
            if (i < allRecipes[index].recipe.ingredients.length) {
                ingredient = allRecipes[index].recipe.ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "' readonly='true'>";
        }
        let preparation = document.getElementById("preparation");
        preparation.value = allRecipes[index].recipe.preparation;
        return true;
    }
    async function getResponseText(_urlParam) {
        let formData = new FormData(document.forms[0]);
        let url = "http://localhost:8100"; //http://localhost:8100 https://gistestalisa.herokuapp.com/
        let query = new URLSearchParams(formData);
        url = url + _urlParam + query.toString();
        let response = await fetch(url, { method: "get" });
        return await response.text();
    }
    async function listMyRecipes() {
        let user = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let element = document.getElementById("recipes");
            element.innerHTML = "";
            for (let i = 0; i < user.recipes.length; i++) {
                element.innerHTML = element.innerHTML + "<h2>" +
                    (i + 1) + ". " + user.recipes[i].recipename +
                    "<img src='../Pictures/edit.png' id='edit' class='" + user.recipes[i].recipeID + "' alt='edit'>" +
                    "<img src='../Pictures/trash.png' id='delete' class='" + user.recipes[i].recipeID + "' alt='delete'>" + "</h2>"; //generischer HTML Code
            }
            return;
        }
        window.location.pathname = "startseite.html";
        window.alert("Deine Rezepte können nicht gelesen werden. Bitte melde Dich an!");
    }
    async function handleEdit() {
        if (fillInputFields() == true) {
            setModalTitle("edit");
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Dein Rezept kann nicht geändert werden.");
    }
    async function handleDelete() {
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText = await getResponseText("?function=delete&recipeID=" + recipeID + "&");
            if (responseText != "") {
                localStorage.setItem("User", responseText);
                localStorage.removeItem("RecipeID");
                window.alert("Dein Rezept wurde erfolgreich gelöscht!");
                window.location.pathname = "meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gelöscht werden.");
    }
    async function handleShow() {
        if (fillTextFields() == true) {
            setModalTitle("show");
            setButtonFavorite();
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }
    async function handleDeleteFavorite() {
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText = await getResponseText("?function=toggleFavorite&recipeID=" + recipeID + "&");
            if (responseText != "") {
                localStorage.setItem("User", responseText);
                window.alert("Dein Favorit wurde erfolgreich gelöscht!");
                listMyFavorites();
                return;
            }
        }
        window.alert("Dein Favorit konnte nicht gelöscht werden.");
    }
    async function handleShowFavorite() {
        if (fillTextFields() == true) {
            setModalTitle("showFavorite");
            setButtonFavorite();
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Da Rezept kann nicht angezeigt werden.");
    }
})(Client || (Client = {}));
//# sourceMappingURL=client.js.map