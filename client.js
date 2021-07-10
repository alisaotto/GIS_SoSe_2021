"use strict";
// loaclstorage enthält:
//      "Username" Name des aktuell engemeldeten Benutzers.
//      "RecipeID" ID des ausgewählten Rezepts
var Client;
(function (Client) {
    // Alle Init-Funktionen führen beim Öffnen die jeweiligen Funktionen aus
    function handleInitStartPage() {
        setModalBox();
        setButtonLogout();
        listAllRecipes();
    }
    Client.handleInitStartPage = handleInitStartPage;
    function handleInitLogin() {
        return;
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
        listMyFavorites();
    }
    Client.handleInitFavorites = handleInitFavorites;
    // Response-Text für Server-Aufruf vorbereiten
    async function getResponseText(_urlParam) {
        let formData = new FormData(document.forms[0]);
        let url = "https://gis21.herokuapp.com"; //http://localhost:8100
        let query = new URLSearchParams(formData);
        url = url + _urlParam + "&" + query.toString();
        let response = await fetch(url, { method: "get" });
        return await response.text();
    }
    // Bei einem Klick auf bestimmte Icons/Buttons (Brille, Mülleimer, Bearbeiten-Stift, Favoriten-Button) werden die jeweiligen Funktionen aufgerufen und ausgeführt
    function handleRecipe(_event) {
        let image = _event.target;
        if (image == null) {
            return;
        }
        localStorage.setItem("RecipeID", image.className);
        if (image.id == "delete") { // auf Meine Rezepte
            handleDeleteRecipe();
        }
        else if (image.id == "edit") { // auf Meine Rezepte
            handleEditRecipe();
        }
        else if (image.id == "show") { // auf Startseite
            handleShowRecipe();
        }
        else if (image.id == "deleteFavorite") { // auf Favoriten
            handleDeleteFavorite();
        }
        else if (image.id == "showFavorite") { // auf Favoriten
            handleShowFavorite();
        }
    }
    Client.handleRecipe = handleRecipe;
    // Registration (Benutzername & Passwort) mit dem Server auf der Datenbank überprüfen
    async function handleRegistration() {
        let username = document.getElementById("username");
        let password = document.getElementById("password");
        if (username.value == null || username.value == "" || password.value == null || password.value == "") {
            window.alert("Du musst einen Benutzernamen und ein Passwort eingeben.");
            return;
        }
        let responseText = await getResponseText("?function=registration");
        if (responseText != "") {
            window.alert("Du hast dich für schmackofatz! registriert. Du kannst dich nun login.");
        }
        else {
            window.alert("Registration fehlgeschlagen. Dieser Benutzername ist leider schon vergeben.");
        }
    }
    Client.handleRegistration = handleRegistration;
    // Login (Benutzername & Passwort) mit dem Server auf der Datenbank überprüfen
    async function handleLogin() {
        let responseText = await getResponseText("?function=login");
        if (responseText != "") {
            let username = JSON.parse(responseText);
            localStorage.setItem("Username", username);
            localStorage.removeItem("RecipeID");
            window.alert("Du hast dich erfolgreich eingeloggt.");
            window.location.pathname = "GIS_SoSe_2021/startseite.html";
        }
        else {
            window.alert("Die Anmeldung ist fehlgeschlagen. Gebe deinen Benutzernamen und dein Passwort richtig ein oder registriere dich.");
        }
    }
    Client.handleLogin = handleLogin;
    // Rezeptnamen prüfen und Rezept über den Server auf der Datenbank speichern
    async function handleSaveRecipe() {
        let recipename = document.getElementById("recipename");
        if (recipename.value == null || recipename.value == "") {
            window.alert("Bitte gebe einen Rezeptnamen an!");
            return;
        }
        let modal = document.getElementById("titleRecipe");
        let mode = modal.className;
        let recipeID = null;
        let username = localStorage.getItem("Username");
        if (username != null && username != "") {
            if (mode == "edit") {
                recipeID = localStorage.getItem("RecipeID");
            }
            else if (mode == "add") {
                recipeID = "";
            }
        }
        if (recipeID != null) {
            let responseText = await getResponseText("?function=saveRecipe&mode=" + mode + "&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                localStorage.removeItem("RecipeID");
                let modalBox = document.getElementById("modalBox");
                modalBox.style.display = "none";
                window.alert("Dein Rezept wurde erfolgreich gespeichert!");
                window.location.pathname = "GIS_SoSe_2021/meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gespeichert werden.");
    }
    Client.handleSaveRecipe = handleSaveRecipe;
    // Ausgewähltes Rezept (über RecipeID) aus der Datenbank entfernen
    async function handleDeleteRecipe() {
        let username = localStorage.getItem("Username");
        let recipeID = localStorage.getItem("RecipeID");
        if (username != null && username != "" && recipeID != null && recipeID != "") {
            let responseText = await getResponseText("?function=deleteRecipe&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                localStorage.removeItem("RecipeID");
                window.alert("Dein Rezept wurde erfolgreich gelöscht!");
                window.location.pathname = "GIS_SoSe_2021/meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gelöscht werden.");
    }
    // Eingabefelder aus Datenbank füllen und Modal Box zum Bearbeiten des Rezepts einblenden
    async function handleEditRecipe() {
        if (await fillInputFields() == true) {
            setModalTitle("edit");
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Dein Rezept kann nicht geändert werden.");
    }
    // Ausgabefelder aus Datenbank füllen und Modal Box zum Anzeigen des Rezepts einblenden
    async function handleShowRecipe() {
        if (await fillTextFields() == true) {
            setModalTitle("show");
            await setButtonFavorite();
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }
    // Ausgewählter Favorit (über RecipeID) aus der Datenbank entfernen
    async function handleDeleteFavorite() {
        let username = localStorage.getItem("Username");
        let recipeID = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText = await getResponseText("?function=toggleFavorite&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                window.alert("Dein Favorit wurde erfolgreich gelöscht!");
                listMyFavorites();
                return;
            }
        }
        window.alert("Dein Favorit konnte nicht gelöscht werden.");
    }
    // Ausgabefelder aus Datenbank (über RecipeID) füllen und Modal Box zum Anzeigen des Rezepts einblenden
    async function handleShowFavorite() {
        if (await fillTextFields() == true) {
            setModalTitle("showFavorite");
            await setButtonFavorite();
            let modalBox = document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }
    // Favorit auf der Datenbank speichern (Klassenname des Buttons ist leer) 
    // oder aus der Datenbank entfernen (Klassenname des Buttons ist nicht leer
    async function handleToggleFavorite() {
        let username = localStorage.getItem("Username");
        let recipeID = localStorage.getItem("RecipeID");
        let favoriteButton = document.getElementById("favoriteButton");
        if (username != null && username != "" && recipeID != null && recipeID != "") {
            let responseText = await getResponseText("?function=toggleFavorite&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                if (favoriteButton.className == "") {
                    window.alert("Das Rezept wurde erfolgreich zu deinen Favoriten hinzugefügt!");
                }
                else {
                    window.alert("Das Rezept wurde erfolgreich aus deinen Favoriten entfernt!");
                }
                await setButtonFavorite();
                return;
            }
        }
        if (favoriteButton.className == "") {
            window.alert("Das Rezept konnte nicht zu deinen Favoriten hinzugefügt werden.");
        }
        else {
            window.alert("Das Rezept konnte nicht aus deinen Favoriten gelöscht werden.");
        }
    }
    Client.handleToggleFavorite = handleToggleFavorite;
    // Benutzer aus der DDatenbank lesen (Benutzername steht in localstorage)
    async function handleReadUser() {
        let user = null;
        let username = localStorage.getItem("Username");
        if (username != null && username != "") {
            let responseText = await getResponseText("?function=readUser&username=" + username);
            if (responseText != "") {
                user = JSON.parse(responseText);
            }
        }
        return user;
    }
    // Alle Rezepte aus der Datenbank lesen
    async function handleReadAllRecipes() {
        let allRecipes = new Array();
        let responseText = await getResponseText("?function=readAllRecipes");
        if (responseText != "") {
            allRecipes = JSON.parse(responseText);
        }
        return allRecipes;
    }
    // localstorage beim Abmelden löschen und auf die Loginseite wechseln
    function handleLogout() {
        localStorage.clear();
        window.location.pathname = "GIS_SoSe_2021/login.html";
    }
    Client.handleLogout = handleLogout;
    // Eingabefelder löschen und Modal Box zum Bearbeiten des Rezepts einblenden
    //https://www.w3schools.com/howto/howto_css_modals.asp
    function handleAdd() {
        setModalTitle("add");
        clearInputFields();
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "block";
        modalBox.scrollIntoView(true);
    }
    Client.handleAdd = handleAdd;
    function handleDropdown() {
        document.getElementById("dropdown").classList.toggle("show");
    }
    Client.handleDropdown = handleDropdown;
    // Modal Box ausblenden und über Klassenname der Modal Box zur jeweiligen Seite zurückkehren
    // Dadurch wird die Anzeige aktualisiert, fall das Rezept oder der Favorit geändert wurde
    function handleClose() {
        // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-yes-and-no-options
        localStorage.removeItem("RecipeID");
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "none";
        switch (modalBox.className) {
            case "modalBoxStart":
                window.location.pathname = "GIS_SoSe_2021/startseite.html";
                break;
            case "modalBoxMyRecipes":
                window.location.pathname = "GIS_SoSe_2021/meinerezepte.html";
                break;
            case "modalBoxFavorites":
                window.location.pathname = "GIS_SoSe_2021/favoriten.html";
                break;
            default:
                break;
        }
    }
    Client.handleClose = handleClose;
    // Alle Rezepte des angemeldeten Benutzers aus der Datenbank lesen und auf Meine Rezepte anzeigen
    async function listMyRecipes() {
        let myRecipesList = document.getElementById("myRecipesList");
        let recipesText = "";
        myRecipesList.innerHTML = recipesText;
        let user = await handleReadUser();
        if (user != null) {
            for (let i = 0; i < user.recipes.length; i++) {
                recipesText = recipesText +
                    "<h2>" +
                    user.recipes[i].recipename +
                    getEditImage(String(user.recipes[i].recipeID)) +
                    getDeleteImage(String(user.recipes[i].recipeID)) +
                    "</h2>"; //generischer HTML Code
            }
            myRecipesList.innerHTML = recipesText;
            return;
        }
        window.location.pathname = "GIS_SoSe_2021/startseite.html";
        window.alert("Deine Rezepte können nicht gelesen werden. Bitte melde dich an!");
    }
    // Alle Favoriten des angemeldeten Benutzers aus der Datenbank lesen und und auf der Favoriten-Seite anzeigen
    async function listMyFavorites() {
        let favoritesList = document.getElementById("favoritesList");
        let recipesText = "";
        favoritesList.innerHTML = recipesText;
        let user = await handleReadUser();
        if (user != null) {
            let allRecipes = await handleReadAllRecipes();
            if (allRecipes != null && user.favorites != null && user.favorites.length > 0) {
                for (let i = 0; i < user.favorites.length; i++) {
                    let index = allRecipes.findIndex(recipe => recipe.recipe.recipeID == user.favorites[i]);
                    if (index < 0) {
                        recipesText = recipesText + "Dieses Rezept ist leider nicht mehr vorhanden.";
                    }
                    else {
                        recipesText = recipesText +
                            "<h2>" +
                            "♡ " +
                            allRecipes[index].recipe.recipename + " von " + allRecipes[index].author +
                            getShowFavoriteImage(String(user.favorites[i]));
                    }
                    recipesText = recipesText +
                        getDeleteFavoriteImage(String(user.favorites[i])) +
                        "</h2>"; //generischer HTML Code
                }
            }
            else {
                recipesText = "<h2>Du hast noch keine Favoriten angelegt.</h2>";
            }
            favoritesList.innerHTML = recipesText;
            return;
        }
        window.location.pathname = "GIS_SoSe_2021/startseite.html";
        window.alert("Deine Favoriten können nicht gelesen werden. Bitte melde dich an!");
    }
    // Alle Rezepte aus der Datenbank lesen und auf der Startseite anzeigen
    async function listAllRecipes() {
        let recipeWorldList = document.getElementById("recipeWorldList");
        let recipesText = "";
        recipeWorldList.innerHTML = recipesText;
        let allRecipes = await handleReadAllRecipes();
        if (allRecipes != null) {
            let user = await handleReadUser();
            for (let i = 0; i < allRecipes.length; i++) {
                recipesText = recipesText +
                    "<h2>" +
                    getFavoriteImage(String(allRecipes[i].recipe.recipeID), user) +
                    allRecipes[i].recipe.recipename + " von " + allRecipes[i].author +
                    getShowImage(String(allRecipes[i].recipe.recipeID)) +
                    "</h2>"; //generischer HTML Code      
            }
        }
        else {
            recipesText = "<h1>Es sind noch keine Rezepte vorhanden.</h1>";
        }
        recipeWorldList.innerHTML = recipesText;
    }
    // Modal Box ausblenden
    function setModalBox() {
        let modalBox = document.getElementById("modalBox");
        modalBox.style.display = "none";
    }
    // Buttontext über den Benutzernamen aus localstorage zum anmelden oder abmelden ermitteln
    function setButtonLogout() {
        let elementDesktop = document.getElementById("logoutButtonText");
        let elementMobile = document.getElementById("logoutButtonTextMobile");
        let username = localStorage.getItem("Username");
        if (username == null || username == "") {
            elementDesktop.innerText = "ANMELDEN";
            elementMobile.innerText = "ANMELDEN";
        }
        else {
            elementDesktop.innerText = "ABMELDEN";
            elementMobile.innerText = "ABMELDEN";
        }
    }
    // Buttontext des ausgewählten Rezepts (über RecipeID) und aller Rezepte aus der Datenbank zum Hinzufügen oder Entfernen ermitteln
    // Klassenname zum Kennzeichnen "ist Favorit" = "X" ist kein Favorit "" setzen
    // Butten wird ausgeblendet, wenn der Benutzer nicht angemeldet ist!
    async function setButtonFavorite() {
        let element = document.getElementById("favoriteButton");
        if (element == null) {
            return;
        }
        element.innerHTML = "";
        let user = await handleReadUser();
        if (user == null) {
            element.style.display = "none";
            return;
        }
        element.innerHTML = "Zu Favoriten hinzufügen";
        element.className = "";
        element.style.display = "block";
        let allRecipes = await handleReadAllRecipes();
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
        element.className = "X";
    }
    // Titel und Klasse der Modal Box über Parameter _mode ermitteln
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
    // Eingabefelder der Modal Box beim Anlegen eines Rezepts löschen
    function clearInputFields() {
        let recipe = { recipeID: null, recipename: "", ingredients: new Array(), preparation: "" };
        fillFields(recipe, false);
    }
    // Eingabefelder der Modal Box beim Ändern eines ausgewählten Rezepts (über RecipeID) aus Datenbank füllen
    async function fillInputFields() {
        let user = await handleReadUser();
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
        fillFields(user.recipes[index], false);
        return true;
    }
    // Ausgabefelder der Modal Box beim Anzeigen eines ausgewählten Rezepts (über RecipeID) aus Datanbank füllen
    async function fillTextFields() {
        let allRecipes = await handleReadAllRecipes();
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
        fillFields(allRecipes[index].recipe, true);
        return true;
    }
    // Felder der Modal Box über Parameter _recipe füllen
    // Eingabebereitschaft der Felder werden über den Parameter _reaonly gesteuert
    function fillFields(_recipe, _readOnly) {
        let readOnly = "";
        if (_readOnly) {
            readOnly = "readonly";
        }
        let recipename = document.getElementById("recipename");
        recipename.value = _recipe.recipename;
        let ingredients = document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i = 0; i < 10; i++) {
            let ingredient = "";
            if (i < _recipe.ingredients.length) {
                ingredient = _recipe.ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "' " + readOnly + ">";
        }
        let preparation = document.getElementById("preparation");
        preparation.value = _recipe.preparation;
    }
    // Kennzeichen ♡ für Favorit über Parameter _user und _recipeID ermitteln
    function getFavoriteImage(_recipeID, _user) {
        let favoriteImage = "";
        if (_user != null) {
            let index = _user.favorites.findIndex(objectID => String(objectID) == _recipeID);
            if (index >= 0) {
                favoriteImage = "♡ ";
            }
        }
        return favoriteImage;
    }
    // Bilder für Darstellung in der Liste aufbereiten und Klassenname mit Parameter _recipeID setzen
    // Dadurch kann über den Klassennamen ein ausgewähltes RRezept wieder gefunden werden
    function getEditImage(_recipeID) {
        return "<img src='Pictures/edit.png' id='edit' class='" + _recipeID + "' alt='edit'>";
    }
    function getShowImage(_recipeID) {
        return "<img src='Pictures/glasses.png' id='show' class='" + _recipeID + "' alt='show'>";
    }
    function getDeleteImage(_recipeID) {
        return "<img src='Pictures/trash.png' id='delete' class='" + _recipeID + "' alt='delete'>";
    }
    function getShowFavoriteImage(_recipeID) {
        return "<img src='Pictures/glasses.png' id='showFavorite' class='" + _recipeID + "' alt='show'>";
    }
    function getDeleteFavoriteImage(_recipeID) {
        return "<img src='Pictures/trash.png' id='deleteFavorite' class='" + _recipeID + "' alt='delete'>";
    }
})(Client || (Client = {}));
//# sourceMappingURL=client.js.map