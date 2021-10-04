import * as Io from "./io.js";
import * as Utils from "./utils.js";

/** All Monster data and its display on the page */
const Model = {
    init: async function Model_init() {
        /** Monster codex data retrieved from the JSON file */
        this.json_obj = {};
        await this.fetchData("data/monsters.json");
    },
    /** Get monster database and update monster and clue data on the page
     * @param {string} url URL of database file
     */
    fetchData: async function Model_fetchData(url) {
        const data = await Io.Http.Request({
            url: url || "data/monsters.json"
        });
        this.updateLocalDatabase(data.responseText);
        Controller.onDataLoaded();
    },
    /** Update monster and clue data from json text */
    updateLocalDatabase: function Model_updateLocalDatabase(jsonText) {
        this.json_obj = JSON.parse(jsonText);
    },
    getVersionInfo: function Model_getVersionInfo() {
        return this.json_obj.game_version;
    },
    getAllClues: function Model_getAllClues() {
        return Utils.arrayClone(this.json_obj.clues);
    },
    /** get clue name when given the clue key */
    getClueForKey: function Model_getClueForKey(clueKey) {
        for (let clueIndex = 0; clueIndex < this.json_obj.clues.length; clueIndex++) {
            const clue = this.json_obj.clues[clueIndex];
            if (clueKey == clue.key) {
                return Utils.jsonClone(clue);
            }
        }
    },
    getMonsterForKey: function Model_getMonsterForKey(monsterKey) {
        for (const monster of this.json_obj.monsters) {
            if (monster.key == monsterKey) {
                return Utils.jsonClone(monster);
            }
        }
    },
    getAllMonsters: function Model_getAllMonsters() {
        return Utils.arrayClone(this.json_obj.monsters);
    },
    /** return a list of monsters that match the selected clues */
    getMatchingMonsters: function Model_getMatchingMonsters(selectedClues) {
        return Utils.arrayClone(
            this.json_obj.monsters.filter(
                function verifyMonster(monster) {
                    for (let clueIndex = 0; clueIndex < selectedClues.length; clueIndex++) {
                        const clueName = selectedClues[clueIndex];
                        if (!monster.clues.includes(clueName)) {
                            // one selected clue doesn't match this monster
                            // eliminate the monster
                            return false;
                        }
                    }
                    // all selected clues match the monster's clues
                    return true;
                }
            )
        );
    },
};

const Controller = {
    init: function Controller_init() {

    },
    onLocaleChanged: function Controller_onLocaleChanged() {
        this.reload();
    },
    onDataLoaded: function Controller_onDataLoaded() {
        this.reload();
    },
    reload: function Controller_reload() {
        const versionInfo = Model.getVersionInfo();
        View.updateVersionInfo(versionInfo)
        const allMonsters = Model.getAllMonsters();
        View.updateVisibleMonsters(allMonsters, true);
        const clues = Model.getAllClues();
        View.initCluesHtml(clues);
    },
    onClueSelectionChanged: function Controller_onClueSelectionChanged(selectedClues) {
        const matchingMonsters = Model.getMatchingMonsters(selectedClues);
        /*** prepare the list of monsters and clues */
        /** do we show all clues anyway ? */
        let showAll;
        /** the list of only the monsters that match the selected clues */
        let validMonsters;
        if (selectedClues.length == 0) {
            // Selection is empty when unselecting all.
            // ==> Showing all monsters.
            showAll = true;
            validMonsters = Model.getAllMonsters();
        } else {
            showAll = false;
            validMonsters = Model.getMatchingMonsters(selectedClues);
        }
        if (validMonsters.length == 0) {
            // impossible combination of clues
            View.errorNoMatchingMonsters("No monsters are valid for this combination of clues.");
        } else {
            if (validMonsters.length != 1) {
                View.clearDetails();
            }
            View.updateVisibleMonsters(validMonsters, showAll, selectedClues);
        }
        View.styleUnmatchingClues(matchingMonsters);
    },
    /** User clicked a monster to get its details */
    onMonsterClicked: function Controller_onMonsterClicked(monsterKey) {
        this.showDetailsForMonsterKey(monsterKey);
    },
    showDetailsForMonsterKey: function Controller_showDetailsForMonsterKey(monsterKey) {
        const monster = Model.getMonsterForKey(monsterKey);
        View.showDetails(monster);
    },
    getClueForKey: function Controller_getClueForKey(clueKey) {
        return Model.getClueForKey(clueKey);
    },
};

const View = {
    init: function View_init() {
        this.locale = newLocale();
    },
    /** Display info about the game version */
    updateVersionInfo: function View_updateVersionInfo(versionInfo) {
        const elVersionInfo = document.getElementById("versioninfo");
        elVersionInfo.innerHTML = versionInfo;
    },
    /** Display the details about that monster */
    showDetails: function View_showDetails(monster) {
        const elDetails = document.getElementById("details");
        elDetails.innerHTML = "";
        // Add monster name as title
        const nameHeader = document.createElement("h2");
        nameHeader.innerText = this.locale.get(monster, "name") + " :";
        elDetails.append(nameHeader);
        // Add details from database
        const detailsDiv = document.createElement("div");
        detailsDiv.innerHTML = this.locale.get(monster, "details");
        elDetails.append(detailsDiv);
    },
    /** Clear the monster details display */
    clearDetails: function View_clearDetails() {
        const elDetails = document.getElementById("details");
        elDetails.innerHTML = "(click a ghost for details)";
    },
    /** Init the list of clues */
    initCluesHtml: function View_initCluesHtml(clues) {
        const elClues = document.getElementById("clues");
        elClues.innerHTML = "";
        clues.forEach(function initClue(clue) {
            let elClue = new Option(this.locale.get(clue, "name"), clue.key, false, false);
            elClues.options.add(elClue);
        }.bind(this));
        elClues.addEventListener("change", this.clueSelectionChanged.bind(this), false);
    },
    /** User (un)selected clues */
    clueSelectionChanged: function View_clueSelectionChanged(event) {
        let selectedClues = [];
        const options = event.target.options;
        for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
            const option = options[optionIndex];
            if (option.selected) {
                selectedClues.push(option.value);
            }
        }
        Controller.onClueSelectionChanged(selectedClues);
    },
    /** mark all the clues that are impossible with the current selected combination of monsters */
    styleUnmatchingClues: function View_styleUnmatchingClues(matchingMonsters) {
        const options = document.getElementById("clues").options;
        for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
            const option = options[optionIndex];
            // first, style all as unmatched
            option.classList.add("unmatched");
            for (let monsterIndex = 0; monsterIndex < matchingMonsters.length; monsterIndex++) {
                const monster = matchingMonsters[monsterIndex];
                for (let monsterClueIndex = 0; monsterClueIndex < monster.clues.length; monsterClueIndex++) {
                    const monsterClueKey = monster.clues[monsterClueIndex];
                    if (monsterClueKey == option.value) {
                        // at least one monster has this clue
                        // now style as matched
                        option.classList.remove("unmatched");
                    }
                }
            }
        }
    },
    /** update the list of visible monsters and their displayed clues
     * @param {array} validMonsters array of valid monster objects (with key, name, clues, ...)
     * @param {bool} showAll do we show all monsters anyway ?
     * @param {array} selectedClues (optional) array of selected clues
     */
    updateVisibleMonsters: function View_updateVisibleMonsters(validMonsters, showAll, selectedClues) {
        /*** update the display of the monster table */
        const monsterTableBuilder = newMonsterTableBuilder();
        for (const validMonster of validMonsters) {
            // New row for each monster
            monsterTableBuilder.createRow();
            // First invisible cell displays the monster key
            monsterTableBuilder.createCellKey(validMonster.key);
            // Second cell displays the monster name
            monsterTableBuilder.createCellName(this.locale.get(validMonster, "name"));
            if (validMonsters.length == 1) {
                monsterTableBuilder.markCellFound();
                Controller.showDetailsForMonsterKey(validMonster.key);
                break;
            }
            // All other cells display the remaining clues
            for (const clueKey of validMonster.clues) {
                const clue = Controller.getClueForKey(clueKey);
                const clueName = this.locale.get(clue, "name");
                if (showAll || !selectedClues.includes(clueKey)) {
                    // Display this clue
                    monsterTableBuilder.createCellClue(clueName);
                }
            }
        }
        monsterTableBuilder.finalize();
    },
    /** User clicked a monster to get its details */
    onMonsterClicked: function View_onMonsterClicked(event) {
        const monsterKey = event.target.parentElement.firstChild.innerText;
        Controller.onMonsterClicked(monsterKey);
    },
    /** display error when impossible combination of clues */
    errorNoMatchingMonsters: function View_errorNoMatchingMonsters(message) {
        const monsterTableBuilder = newMonsterTableBuilder();
        monsterTableBuilder.createRow();
        monsterTableBuilder.showError(message || "No monsters are valid in this situation.");
        monsterTableBuilder.finalize();
    },
};

const MonsterTableBuilder = {
    init: function MonsterTableBuilder_init(parentId) {
        this.parentId = parentId || "suspects";
        this.tableBody = document.createElement("tbody");
        this.currentTableRow = undefined;
        this.currentColumnIndex = undefined;
        this.currentCell = undefined;
    },
    createRow: function MonsterTableBuilder_createRow() {
        this.currentTableRow = this.tableBody.insertRow(-1);
        this.currentTableRow.addEventListener("click", View.onMonsterClicked.bind(View), false);
        this.currentColumnIndex = 0;
        return this.currentTableRow;
    },

    /** Create a table cell that will contain the monster's key */
    createCellKey: function MonsterTableBuilder_createCellKey(monsterKey) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        this.currentCell.innerHTML = monsterKey;
        // This special cell is invisible
        this.currentCell.style.display = "none";
        return this.currentCell;
    },
    /** Create a table cell that will contain the monster's name */
    createCellName: function MonsterTableBuilder_createCellName(monsterName) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        // special style for the mosnter name
        this.currentCell.classList.add("monstername")
        this.currentCell.innerHTML = monsterName;
        return this.currentCell;
    },
    /** Mark the current cell to show that this monster was found */
    markCellFound: function MonsterTableBuilder_markCellFound() {
        this.currentCell.classList.add("foundmonster");
        return this.currentCell;
    },
    /** Create a new table cell for a monster clue */
    createCellClue: function MonsterTableBuilder_createCellClue(clueName) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        this.currentCell.innerHTML = clueName;
        return this.currentCell;
    },
    /** Show an error inside the table */
    showError: function MonsterTableBuilder_showError(messageText) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        this.currentCell.classList.add("monstererror")
        this.currentCell.innerHTML = messageText;
        return this.currentCell;
    },
    /** Finalize the table and add it to the page */
    finalize: function MonsterTableBuilder_finalize() {
        const elSuspects = document.getElementById(this.parentId);
        elSuspects.innerHTML = "";
        elSuspects.appendChild(this.tableBody);
        return this.tableBody;
    },
};
/** Fully instantiate a new MonsterTableBuilder */
function newMonsterTableBuilder() {
    const o = Object.create(MonsterTableBuilder);
    o.init();
    return o;
}

/** Get object values based on selected Locale */
const Locale = {
    init: function Locale_init() {
        /** default fallback locale */
        this.defaultLocale = "en";
        /** key used to set locales from the url parameters */
        this.urlParameterKey = "lang";
        this.userPreferredLocales = this.getUserPreferredLocales();
        /** locale manually selected in the UI */
        this.selectedLocale = null;
        this.initSelector();
    },
    /** array of user preferred locales, in order */
    getUserPreferredLocales: function Locale_getUserPreferredLocales() {
        /** locales configured in browser, in order */
        const browserLocales = navigator.languages;
        // looking for a user choice in the url
        const urlParameters = new URLSearchParams(window.location.search);
        if (urlParameters) {
            const urlParameterLocaleString = urlParameters.get(this.urlParameterKey);
            if (urlParameterLocaleString != null) {
                let userPreferredLocales = urlParameterLocaleString.split(",");
                userPreferredLocales.push(...browserLocales);
                return userPreferredLocales;
            }
        }
        return [...browserLocales];
    },
    initSelector: function Locale_initSelector() {
        const elSelect = document.getElementById("language");
        elSelect.addEventListener("change", this.onLocaleSelectionChanged.bind(this));
    },
    onLocaleSelectionChanged: function Locale_onLocaleSelectionChanged(event) {
        const option = event.target.value;
        if (this.selectedLocale) {
            // remove previous selection
            this.userPreferredLocales.shift();
        }
        if (option == "none") {
            this.selectedLocale = null;
        } else {
            this.selectedLocale = option;
            this.userPreferredLocales.unshift(this.selectedLocale);
        }
        Controller.onLocaleChanged();
    },
    /** Get object value based on selected Locale */
    get: function Locale_get(object, propertyName) {
        for (const userPreferredLocale of this.userPreferredLocales) {
            // turn "en-US" into "en" for example
            const userPreferredLocaleShort = userPreferredLocale.split("-", 1)[0];
            const localizedPropertyName = propertyName + "_" + userPreferredLocaleShort;
            const localizedPropertyValue = object[localizedPropertyName];
            if (localizedPropertyValue !== undefined) {
                return localizedPropertyValue;
            }
        }
        // property not found for locale, falling back to defaultLocale
        const defaultPropertyName = propertyName + "_" + this.defaultLocale;
        const defaultPropertyValue = object[defaultPropertyName];
        return defaultPropertyValue;
    },
};
/** Fully instantiate a new Locale */
function newLocale() {
    const o = Object.create(Locale);
    o.init();
    return o;
}

export async function init() {
    Controller.init();
    View.init();
    await Model.init()
}