namespace Client {
    export function handleInitStartPage(): void {
        setModalBox();
        setButtonLogout();
        readAllRecipes();
        listAllRecipes();
    }

    export function handleInitLogin(): void {
        readAllRecipes();
    }

    export function handleInitMyRecipes(): void {
        setModalBox();
        setButtonLogout();
        listMyRecipes();
    }

    export function handleInitFavorites(): void {
        setModalBox();
        setButtonLogout();
        readAllRecipes();
        listMyFavorites();
    }

    export async function handleLogin(): Promise<void> {
        let responseText: string = await getResponseText("?function=login&");
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

    export async function handleRegistration(): Promise<void> {
        let responseText: string = await getResponseText("?function=registration&");
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

    export function handleLogout(): void {
        localStorage.clear();
        window.location.pathname = "Login.html";
    }

    //https://www.w3schools.com/howto/howto_css_modals.asp
    export function handleAdd(): void {
        setModalTitle("add");
        clearInputFields();
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
        modalBox.style.display = "block";
        modalBox.scrollIntoView(true);
    }

    export async function handleSave(): Promise<void> {
        let modal: HTMLElement = <HTMLElement>document.getElementById("titleRecipe");
        let mode: string = modal.className;
        let recipeID: string = null;
        if (mode == "edit") {
            recipeID = localStorage.getItem("RecipeID");
        } else {
            recipeID = "";
        }
        if (recipeID != null) {
            let responseText: string = await getResponseText("?function=save&mode=" + mode + "&" + "recipeID=" + recipeID + "&");
            if (responseText != "") {
                localStorage.setItem("User", responseText);
                localStorage.removeItem("RecipeID");
                let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
                modalBox.style.display = "none";
                window.alert("Dein Rezept wurde erfolgreich gespeichert!");
                window.location.pathname = "meinerezepte.html";
                return;
            }
        }
        window.alert("Dein Rezept konnte nicht gespeichert werden.");
    }

    export function handleRecipe(_event: Event): void {
        let image: HTMLImageElement = _event.target as HTMLImageElement;
        if (image == null) {
            return;
        }
        localStorage.setItem("RecipeID", image.className);
        if (image.id == "edit") {
            handleEdit();
        } else if (image.id == "delete") {
            handleDelete();
        } else if (image.id == "show") {
            handleShow();
        } else if (image.id == "deleteFavorite") {
            handleDeleteFavorite();
        } else if (image.id == "showFavorite") {
            handleShowFavorite();
        }
    }

    export async function handleToggleFavorite(): Promise<void> {
        let user: User = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let recipeID: string = localStorage.getItem("RecipeID");
            if (recipeID != null) {
                let responseText: string = await getResponseText("?function=toggleFavorite&recipeID=" + recipeID + "&");
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

    export function handleDropdown(): void {
        document.getElementById("dropdown").classList.toggle("show");
    }

    export function handleClose(): void {
        // https://stackoverflow.com/questions/9334636/how-to-create-a-dialog-with-yes-and-no-options
        localStorage.removeItem("RecipeID");
        readAllRecipes();
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
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

    export async function readAllRecipes(): Promise<void> {
        let responseText: string = await getResponseText("?function=readAllRecipes&");
        if (responseText != "") {
            localStorage.setItem("AllRecipes", responseText);
        } else {
            localStorage.removeItem("AllRecipes");
        }
    }

    export function listMyFavorites(): void {
        let favoritesStart: HTMLElement = document.getElementById("favorites");
        let favoritesText: string = "";
        favoritesStart.innerHTML = favoritesText;
        let user: User = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let allRecipes: Array<AllRecipes> = JSON.parse(localStorage.getItem("AllRecipes"));
            if (allRecipes != null && user.favorites != null && user.favorites.length > 0) {
                for (let i: number = 0; i < user.favorites.length; i++) {
                    let index: number = allRecipes.findIndex(recipe => recipe.recipe.recipeID == user.favorites[i]);
                    favoritesText = favoritesText + "<h2>♡ ";
                    if (index < 0) {
                        favoritesText = favoritesText + "Dieses Rezept ist leider nicht mehr vorhanden.";
                    } else {
                        favoritesText = favoritesText + allRecipes[index].recipe.recipename + " von " +
                            allRecipes[index].author +
                            "<img src='../Pictures/glasses.png' id='showFavorite' class='" + user.favorites[i] + "' alt='showFavorite'>";

                    }
                    favoritesText = favoritesText +
                        "<img src='../Pictures/trash.png' id='deleteFavorite' class='" + user.favorites[i] + "' alt='deleteFavorite'>" +
                        "</h2>"; //generischer HTML Code
                }
            } else {
                favoritesText = "<h2>Du hast noch keine Favoriten angelegt.</h2>";
            }
            favoritesStart.innerHTML = favoritesText;
            return;
        }
        window.location.pathname = "startseite.html";
        window.alert("Deine Favoriten können nicht gelesen werden. Bitte melde Dich an!");
    }

    async function listAllRecipes(): Promise<void> {
        let allRecipes: Array<AllRecipes> = JSON.parse(localStorage.getItem("AllRecipes"));
        let recipes: string = "";
        if (allRecipes != null) {
            let user: User = JSON.parse(localStorage.getItem("User"));
            for (let i: number = 0; i < allRecipes.length; i++) {
                let favoriteImage: string = "";
                if (user != null) {
                    let index: number = user.favorites.findIndex(objectID => objectID == allRecipes[i].recipe.recipeID);
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
        } else {
            localStorage.removeItem("AllRecipes");
            recipes = "<h1>Es sind noch keine Rezepte vorhanden.</h1>";
        }
        let recipeWorld: HTMLDivElement = <HTMLDivElement>document.getElementById("recipeWorld");
        recipeWorld.innerHTML = recipes;
    }

    function setModalBox() {
        let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
        modalBox.style.display = "none";
    }

    function setButtonLogout(): void {
        let element: HTMLElement = document.getElementById("logoutButtonText");
        let elementMobile: HTMLElement = document.getElementById("logoutButtonTextMobile");
        let user: User = JSON.parse(localStorage.getItem("User"));
        if (user == null) {
            element.innerText = "ANMELDEN";
            elementMobile.innerText = "ANMELDEN";
        } else {
            element.innerText = "ABMELDEN";
            elementMobile.innerText = "ABMELDEN";
        }
    }

    function setButtonFavorite(): void {
        let element: HTMLElement = document.getElementById("favoriteButton");
        if (element == null) {
            return;
        }
        element.innerHTML = "";
        let user: User = JSON.parse(localStorage.getItem("User"));
        if (user == null) {
            element.style.display = "none";
            return;
        }
        element.innerHTML = "Zu Favoriten hinzufügen";
        element.style.display = "block";
        let allRecipes: Array<AllRecipes> = JSON.parse(localStorage.getItem("AllRecipes"));
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
        let recipename: HTMLInputElement = <HTMLInputElement>document.getElementById("recipename");
        recipename.value = "";
        let ingredients: HTMLDivElement = <HTMLDivElement>document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i: number = 0; i < 10; i++) {
            let ingredient: string = "";
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "'>";
        }
        let preparation: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("preparation");
        preparation.value = "";
    }

    function fillInputFields(): boolean {
        let user: User = JSON.parse(localStorage.getItem("User"));
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
        let recipename: HTMLInputElement = <HTMLInputElement>document.getElementById("recipename");
        recipename.value = user.recipes[index].recipename;
        let ingredients: HTMLDivElement = <HTMLDivElement>document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i: number = 0; i < 10; i++) {
            let ingredient: string = "";
            if (i < user.recipes[index].ingredients.length) {
                ingredient = user.recipes[index].ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "'>";
        }
        let preparation: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("preparation");
        preparation.value = user.recipes[index].preparation;
        return true;
    }

    function fillTextFields(): boolean {
        let responseText: string = localStorage.getItem("AllRecipes");
        let allRecipes: Array<AllRecipes> = JSON.parse(responseText);
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
        let recipename: HTMLInputElement = <HTMLInputElement>document.getElementById("recipename");
        recipename.value = allRecipes[index].recipe.recipename;
        let ingredients: HTMLDivElement = <HTMLDivElement>document.getElementById("ingredients");
        ingredients.innerHTML = "";
        for (let i: number = 0; i < 10; i++) {
            let ingredient: string = "";
            if (i < allRecipes[index].recipe.ingredients.length) {
                ingredient = allRecipes[index].recipe.ingredients[i];
            }
            ingredients.innerHTML = ingredients.innerHTML + "<input name='ingredient' value='" + ingredient + "' readonly='true'>";
        }
        let preparation: HTMLTextAreaElement = <HTMLTextAreaElement>document.getElementById("preparation");
        preparation.value = allRecipes[index].recipe.preparation;
        return true;
    }

    async function getResponseText(_urlParam: string): Promise<string> {
        let formData: FormData = new FormData(document.forms[0]);
        let url: string = "http://localhost:8100"; //http://localhost:8100 https://gistestalisa.herokuapp.com/
        let query: URLSearchParams = new URLSearchParams(<any>formData);
        url = url + _urlParam + query.toString();
        let response: Response = await fetch(url, { method: "get" });
        return await response.text();
    }

    async function listMyRecipes(): Promise<void> {
        let user: User = JSON.parse(localStorage.getItem("User"));
        if (user != null) {
            let element: HTMLElement = <HTMLElement>document.getElementById("recipes");
            element.innerHTML = "";
            for (let i: number = 0; i < user.recipes.length; i++) {
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

    async function handleEdit(): Promise<void> {
        if (fillInputFields() == true) {
            setModalTitle("edit");
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Dein Rezept kann nicht geändert werden.");
    }

    async function handleDelete(): Promise<void> {
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText: string = await getResponseText("?function=delete&recipeID=" + recipeID + "&");
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

    async function handleShow(): Promise<void> {
        if (fillTextFields() == true) {
            setModalTitle("show");
            setButtonFavorite();
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Das Rezept kann nicht angezeigt werden.");
    }

    async function handleDeleteFavorite(): Promise<void> {
        let recipeID: string = localStorage.getItem("RecipeID");
        if (recipeID != null && recipeID != "") {
            let responseText: string = await getResponseText("?function=toggleFavorite&recipeID=" + recipeID + "&");
            if (responseText != "") {
                localStorage.setItem("User", responseText);
                window.alert("Dein Favorit wurde erfolgreich gelöscht!");
                listMyFavorites();
                return;
            }
        }
        window.alert("Dein Favorit konnte nicht gelöscht werden.");
    }

    async function handleShowFavorite(): Promise<void> {
        if (fillTextFields() == true) {
            setModalTitle("showFavorite");
            setButtonFavorite();
            let modalBox: HTMLElement = <HTMLElement>document.getElementById("modalBox");
            modalBox.style.display = "block";
            modalBox.scrollIntoView(true);
            return;
        }
        window.alert("Da Rezept kann nicht angezeigt werden.");
    }
}