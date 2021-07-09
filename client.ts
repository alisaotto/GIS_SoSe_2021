namespace Client {
    export function handleInitStartPage(): void {
        setModalBox();
        setButtonLogout();
        listAllRecipes();
    }

    export function handleInitLogin(): void {
        return;
    }

    export function handleInitMyRecipes(): void {
        setModalBox();
        setButtonLogout();
        listMyRecipes();
    }

    export function handleInitFavorites(): void {
        setModalBox();
        setButtonLogout();
        listMyFavorites();
    }

    async function getResponseText(_urlParam: string): Promise<string> {
        let formData: FormData = new FormData(document.forms[0]);
        let url: string = "https://gis21.herokuapp.com"; //http://localhost:8100
        let query: URLSearchParams = new URLSearchParams(<URLSearchParams>formData);
        url = url + _urlParam + "&" + query.toString();
        let response: Response = await fetch(url, { method: "get" });
        return await response.text();
    }

    export function handleRecipe(_event: Event): void {
        let image: HTMLImageElement = _event.target as HTMLImageElement;
        if (image == null) {
            return;
        }
        localStorage.setItem("RecipeID", image.className);
        if (image.id == "delete") {
            handleDeleteRecipe();
        } else if (image.id == "edit") {
            handleEditRecipe();
        } else if (image.id == "show") {
            handleShowRecipe();
        } else if (image.id == "deleteFavorite") {
            handleDeleteFavorite();
        } else if (image.id == "showFavorite") {
            handleShowFavorite();
        }
    }

    export async function handleRegistration(): Promise<void> {
        let username: HTMLInputElement = <HTMLInputElement>document.getElementById("username");
        let password: HTMLInputElement = <HTMLInputElement>document.getElementById("password");
        if (username.value == null || username.value == "" || password.value == null || password.value == "") {
            window.alert("Du musst einen Benutzernamen und ein Passwort eingeben.");
            return;
        }
        let responseText: string = await getResponseText("?function=registration");
        if (responseText != "") {
            window.alert("Du hast dich für schmackofatz! registriert. Du kannst dich nun login.");
        } else {
            window.alert("Registration fehlgeschlagen. Dieser Benutzername ist leider schon vergeben.");
        }
    }

    export async function handleLogin(): Promise<void> {
        let responseText: string = await getResponseText("?function=login");
        if (responseText != "") {
            let username: string = JSON.parse(responseText);
            localStorage.setItem("Username", username);
            localStorage.removeItem("RecipeID");
            window.alert("Du hast dich erfolgreich eingeloggt.");
            window.location.pathname = "GIS_SoSe_2021/startseite.html";
        }
        else {
            window.alert("Die Anmeldung ist fehlgeschlagen. Gebe deinen Benutzernamen und dein Passwort richtig ein oder registriere dich.");
        }
    }

    export async function handleSaveRecipe(): Promise<void> {
        let recipename: HTMLInputElement = <HTMLInputElement>document.getElementById("recipename");
        if (recipename.value == null || recipename.value == "") {
            window.alert("Bitte gebe einen Rezeptnamen an!");
            return;
        }
        let modal: HTMLElement = <HTMLElement>document.getElementById("titleRecipe");
        let mode: string = modal.className;
        let recipeID: string = null;
        let username: string = localStorage.getItem("Username");
        if (username != null && username != "") {
            if (mode == "edit") {
                recipeID = localStorage.getItem("RecipeID");
            } else if (mode == "add") {
                recipeID = "";
            }
        }
        if (recipeID != null) {
            let responseText: string = await getResponseText("?function=saveRecipe&mode=" + mode + "&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                localStorage.removeItem("RecipeID");
                let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
                modalBox.style.display = "none";
                window.alert("Dein Rezept wurde erfolgreich gespeichert!");
                window.location.pathname = "GIS_SoSe_2021/meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gespeichert werden.");
    }

    async function handleDeleteRecipe(): Promise<void> {
        let username: string = localStorage.getItem("Username");
        let recipeID: string = localStorage.getItem("RecipeID");
        if (username != null && username != "" && recipeID != null && recipeID != "") {
            let responseText: string = await getResponseText("?function=deleteRecipe&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                localStorage.removeItem("RecipeID");
                window.alert("Dein Rezept wurde erfolgreich gelöscht!");
                window.location.pathname = "GIS_SoSe_2021/meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gelöscht werden.");
    }

    async function handleEditRecipe(): Promise<void> {
        if (await fillInputFields() == true) {
            setModalTitle("edit");
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Dein Rezept kann nicht geändert werden.");
    }

    async function handleShowRecipe(): Promise<void> {
        if (await fillTextFields() == true) {
            setModalTitle("show");
            await setButtonFavorite();
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }

    async function handleDeleteFavorite(): Promise<void> {
        let username: string = localStorage.getItem("Username");
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText: string = await getResponseText("?function=toggleFavorite&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                window.alert("Dein Favorit wurde erfolgreich gelöscht!");
                listMyFavorites();
                return;
            }
        }
        window.alert("Dein Favorit konnte nicht gelöscht werden.");
    }

    async function handleShowFavorite(): Promise<void> {
        if (await fillTextFields() == true) {
            setModalTitle("showFavorite");
            await setButtonFavorite();
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }

    export async function handleToggleFavorite(): Promise<void> {
        let username: string = localStorage.getItem("Username");
        let recipeID: string = localStorage.getItem("RecipeID");
        if (username != null && username != "" && recipeID != null && recipeID != "") {
            let responseText: string = await getResponseText("?function=toggleFavorite&username=" + username + "&recipeID=" + recipeID);
            if (responseText != "") {
                let favoriteButton: HTMLElement = <HTMLElement>document.getElementById("favoriteButton");
                if (favoriteButton.className == "") {
                    window.alert("Das Rezept wurde erfolgreich zu deinen Favoriten hinzugefügt!");
                } else {
                    window.alert("Das Rezept wurde erfolgreich aus deinen Favoriten entfernt!");
                }
                await setButtonFavorite();
                return;
            }
        }
        window.alert("Das Rezept konnte nicht zu deinen Favoriten hinzugefügt werden.");
    }

    async function handleReadUser(): Promise<User> {
        let user: User = null;
        let username: string = localStorage.getItem("Username");
        if (username != null && username != "") {
            let responseText: string = await getResponseText("?function=readUser&username=" + username);
            if (responseText != "") {
                user = JSON.parse(responseText);
            }
        }
        return user;
    }

    async function handleReadAllRecipes(): Promise<Array<AllRecipes>> {
        let allRecipes: Array<AllRecipes> = new Array<AllRecipes>();
        let responseText: string = await getResponseText("?function=readAllRecipes");
        if (responseText != "") {
            allRecipes = JSON.parse(responseText);
        }
        return allRecipes;
    }

    export function handleLogout(): void {
        localStorage.clear();
        window.location.pathname = "GIS_SoSe_2021/login.html";
    }

    //https://www.w3schools.com/howto/howto_css_modals.asp
    export function handleAdd(): void {
        setModalTitle("add");
        clearInputFields();
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
        modalBox.style.display = "block";
        modalBox.scrollIntoView(true);
    }

    export function handleDropdown(): void {
        document.getElementById("dropdown").classList.toggle("show");
    }

    export function handleClose(): void {
        // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-yes-and-no-options
        localStorage.removeItem("RecipeID");
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
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

    async function listMyRecipes(): Promise<void> {
        let myRecipesList: HTMLElement = <HTMLElement>document.getElementById("myRecipesList");
        let recipesText: string = "";
        myRecipesList.innerHTML = recipesText;
        let user: User = await handleReadUser();
        if (user != null) {
            for (let i: number = 0; i < user.recipes.length; i++) {
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

    async function listMyFavorites(): Promise<void> {
        let favoritesList: HTMLElement = document.getElementById("favoritesList");
        let recipesText: string = "";
        favoritesList.innerHTML = recipesText;
        let user: User = await handleReadUser();
        if (user != null) {
            let allRecipes: Array<AllRecipes> = await handleReadAllRecipes();
            if (allRecipes != null && user.favorites != null && user.favorites.length > 0) {
                for (let i: number = 0; i < user.favorites.length; i++) {
                    let index: number = allRecipes.findIndex(recipe => recipe.recipe.recipeID == user.favorites[i]);
                    if (index < 0) {
                        recipesText = recipesText + "Dieses Rezept ist leider nicht mehr vorhanden.";
                    } else {
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
            } else {
                recipesText = "<h2>Du hast noch keine Favoriten angelegt.</h2>";
            }
            favoritesList.innerHTML = recipesText;
            return;
        }
        window.location.pathname = "GIS_SoSe_2021/startseite.html";
        window.alert("Deine Favoriten können nicht gelesen werden. Bitte melde dich an!");
    }

    async function listAllRecipes(): Promise<void> {
        let recipeWorldList: HTMLDivElement = <HTMLDivElement>document.getElementById("recipeWorldList");
        let recipesText: string = "";
        recipeWorldList.innerHTML = recipesText;
        let allRecipes: Array<AllRecipes> = await handleReadAllRecipes();
        if (allRecipes != null) {
            let user: User = await handleReadUser();
            for (let i: number = 0; i < allRecipes.length; i++) {
                recipesText = recipesText +
                    "<h2>" +
                    getFavoriteImage(String(allRecipes[i].recipe.recipeID), user) +
                    allRecipes[i].recipe.recipename + " von " + allRecipes[i].author +
                    getShowImage(String(allRecipes[i].recipe.recipeID)) +
                    "</h2>"; //generischer HTML Code      
            }
        } else {
            recipesText = "<h1>Es sind noch keine Rezepte vorhanden.</h1>";
        }
        recipeWorldList.innerHTML = recipesText;
    }

    function setModalBox(): void {
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
        modalBox.style.display = "none";
    }

    function setButtonLogout(): void {
        let elementDesktop: HTMLElement = document.getElementById("logoutButtonText");
        let elementMobile: HTMLElement = document.getElementById("logoutButtonTextMobile");
        let username: string = localStorage.getItem("Username");
        if (username == null || username == "") {
            elementDesktop.innerText = "ANMELDEN";
            elementMobile.innerText = "ANMELDEN";
        } else {
            elementDesktop.innerText = "ABMELDEN";
            elementMobile.innerText = "ABMELDEN";
        }
    }

    async function setButtonFavorite(): Promise<void> {
        let element: HTMLElement = document.getElementById("favoriteButton");
        if (element == null) {
            return;
        }
        element.innerHTML = "";
        let user: User = await handleReadUser();
        if (user == null) {
            element.style.display = "none";
            return;
        }
        element.innerHTML = "Zu Favoriten hinzufügen";
        element.className = "";
        element.style.display = "block";
        let allRecipes: Array<AllRecipes> = await handleReadAllRecipes();
        if (allRecipes == null) {
            return;
        }
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID == null) {
            return;
        }
        let index: number = user.favorites.findIndex(objectID => String(objectID) == recipeID);
        if (index < 0) {
            return;
        }
        element.innerHTML = "Aus Favoriten entfernen";
        element.className = "X";
    }

    function setModalTitle(_mode: string): void {
        let modal: HTMLElement = <HTMLElement>document.getElementById("titleRecipe");
        modal.className = _mode;
        if (_mode == "add") {
            modal.innerText = "Neues Rezept";
        } else if (_mode == "edit") {
            modal.innerText = "Rezept ändern";
        } else if (_mode == "show") {
            modal.innerText = "Rezept anzeigen";
        } else if (_mode == "showFavorite") {
            modal.innerText = "Favorit anzeigen";
        }
    }

    function clearInputFields(): void {
        let recipe: Recipe = { recipeID: null, recipename: "", ingredients: new Array<string>(), preparation: "" };
        fillFields(recipe, false);
    }

    async function fillInputFields(): Promise<boolean> {
        let user: User = await handleReadUser();
        if (user == null) {
            return false;
        }
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID == null || recipeID == "") {
            return false;
        }
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        let index: number = user.recipes.findIndex(recipe => String(recipe.recipeID) == recipeID);
        if (index < 0) {
            return false;
        }
        fillFields(user.recipes[index], false);
        return true;
    }

    async function fillTextFields(): Promise<boolean> {
        let allRecipes: Array<AllRecipes> = await handleReadAllRecipes();
        if (allRecipes == null) {
            return false;
        }
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID == null || recipeID == "") {
            return false;
        }
        // https://stackoverflow.com/questions/58971067/how-do-i-get-the-index-of-object-in-array-using-angular
        let index: number = allRecipes.findIndex(recipe => String(recipe.recipe.recipeID) == recipeID);
        if (index < 0) {
            return false;
        }
        fillFields(allRecipes[index].recipe, true);
        return true;
    }

    function fillFields(_recipe: Recipe, _readOnly: boolean): void {
        let readOnly: string = "";
        if (_readOnly) {
            readOnly = " readonly='true'";
        }
        let recipename: HTMLInputElement = <HTMLInputElement>document.getElementById("recipename");
        recipename.value = _recipe.recipename;
        let ingredients: HTMLDivElement = <HTMLDivElement>document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i: number = 0; i < 10; i++) {
            let ingredient: string = "";
            if (i < _recipe.ingredients.length) {
                ingredient = _recipe.ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "'" + readOnly + ">";
        }
        let preparation: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("preparation");
        preparation.value = _recipe.preparation;
    }

    function getFavoriteImage(_recipeID: string, _user: User): string {
        let favoriteImage: string = "";
        if (_user != null) {
            let index: number = _user.favorites.findIndex(objectID => String(objectID) == _recipeID);
            if (index >= 0) {
                favoriteImage = "♡ ";
            }
        }
        return favoriteImage;
    }

    function getEditImage(_recipeID: string): string {
        return "<img src='Pictures/edit.png' id='edit' class='" + _recipeID + "' alt='edit'>";
    }

    function getShowImage(_recipeID: string): string {
        return "<img src='Pictures/glasses.png' id='show' class='" + _recipeID + "' alt='show'>";
    }

    function getDeleteImage(_recipeID: string): string {
        return "<img src='Pictures/trash.png' id='delete' class='" + _recipeID + "' alt='delete'>";
    }

    function getShowFavoriteImage(_recipeID: string): string {
        return "<img src='Pictures/glasses.png' id='showFavorite' class='" + _recipeID + "' alt='show'>";
    }

    function getDeleteFavoriteImage(_recipeID: string): string {
        return "<img src='Pictures/trash.png' id='deleteFavorite' class='" + _recipeID + "' alt='delete'>";
    }
}