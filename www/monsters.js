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
    getMatchingMonsters: function Model_getMatchingMonsters(clueStates) {
        return Utils.arrayClone(
            this.json_obj.monsters.filter(
                function verifyMonster(monster) {
                    for (const clueKey in clueStates) {
                        const clueState = clueStates[clueKey];
                        if (clueState == CLUE_SELECTION_STATE.PRESENT && !monster.clues.includes(clueKey)) {
                            // one selected clue doesn't match this monster
                            // eliminate the monster
                            return false;
                        }
                        if (clueState == CLUE_SELECTION_STATE.ABSENT && monster.clues.includes(clueKey)) {
                            // one unselected clue doesn't match this monster
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
        View.initClearCluesHtml();
    },
    onClueSelectionChanged: function Controller_onClueSelectionChanged(clueStates) {
        /*** prepare the list of monsters and clues */
        /** the list of only the monsters that match the selected clues */
        const matchingMonsters = Model.getMatchingMonsters(clueStates);
        if (matchingMonsters.length == 0) {
            // impossible combination of clues
            View.errorNoMatchingMonsters("No monsters are valid for this combination of clues.");
        } else {
            if (matchingMonsters.length != 1) {
                View.clearDetails();
            }
            View.updateVisibleMonsters(matchingMonsters);
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

const CLUE_SELECTION_STATE = Object.freeze({
    UNKNOWN: "unknown",
    PRESENT: "present",
    ABSENT: "absent",
});

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
        this.clueSelectionState = {};
        const clueTableBuilder = newClueTableBuilder();
        for (const clue of clues) {
            this.clueSelectionState[clue.key] = CLUE_SELECTION_STATE.UNKNOWN;
            clueTableBuilder.createRow(clue.key, this.locale.get(clue, "name"));
        }
        clueTableBuilder.finalize();
        this.updateAllClueButtonsStyle();
    },
    initClearCluesHtml: function View_initClearCluesHtml() {
        const elButtonClearClues = document.getElementById("clearclues");
        elButtonClearClues.addEventListener("click", this.clearClues.bind(this));
    },
    clearClues: function View_clearClues() {
        for (const clueKey in this.clueSelectionState) {
            this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.UNKNOWN;
        }
        this.updateAllClueButtonsStyle();
        Controller.onClueSelectionChanged(this.clueSelectionState);
    },
    onClueButtonUnknownClicked: function View_onClueButtonUnknownClicked(event) {
        // the clue key is stored in the hidden first cell of the table
        const elRow = event.target.parentElement.parentElement;
        const clueKey = elRow.firstChild.innerText;
        this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.UNKNOWN;
        this.updateClueButtonsStyle(elRow);
        Controller.onClueSelectionChanged(this.clueSelectionState);
    },
    onClueButtonPresentClicked: function View_onClueButtonPresentClicked(event) {
        // the clue key is stored in the hidden first cell of the table
        const elRow = event.target.parentElement.parentElement;
        const clueKey = elRow.firstChild.innerText;
        if (this.clueSelectionState[clueKey] == CLUE_SELECTION_STATE.PRESENT) {
            // toggle
            this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.UNKNOWN;
        } else {
            this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.PRESENT;
        }
        this.updateClueButtonsStyle(elRow);
        Controller.onClueSelectionChanged(this.clueSelectionState);
    },
    onClueButtonAbsentClicked: function View_onClueButtonAbsentClicked(event) {
        // the clue key is stored in the hidden first cell of the table
        const elRow = event.target.parentElement.parentElement;
        const clueKey = elRow.firstChild.innerText;
        if (this.clueSelectionState[clueKey] == CLUE_SELECTION_STATE.ABSENT) {
            // toggle
            this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.UNKNOWN;
        } else {
            this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.ABSENT;
        }
        this.updateClueButtonsStyle(elRow);
        Controller.onClueSelectionChanged(this.clueSelectionState);
    },
    onClueNameClicked: function View_onClueNameClicked(event) {
        // the clue key is stored in the hidden first cell of the table
        const elRow = event.target.parentElement;
        const clueKey = elRow.firstChild.innerText;
        /// cycle the state
        switch (this.clueSelectionState[clueKey]) {
            case CLUE_SELECTION_STATE.UNKNOWN:
                this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.PRESENT;
                break;
            case CLUE_SELECTION_STATE.PRESENT:
                this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.ABSENT;
                break;
            case CLUE_SELECTION_STATE.ABSENT:
                this.clueSelectionState[clueKey] = CLUE_SELECTION_STATE.UNKNOWN;
                break;
        }
        this.updateClueButtonsStyle(elRow);
        Controller.onClueSelectionChanged(this.clueSelectionState);
    },
    updateAllClueButtonsStyle: function View_updateAllClueButtonsStyle() {
        const elTable = document.getElementById("clues");
        for (const elRow of elTable.rows) {
            this.updateClueButtonsStyle(elRow);
        }
    },
    updateClueButtonsStyle: function View_updateClueButtonsStyle(elRow) {
        const clueKey = elRow.firstChild.innerText;
        const clueState = this.clueSelectionState[clueKey];
        const elButtonUnknown = elRow.children[1].firstChild;
        const elButtonPresent = elRow.children[2].firstChild;
        const elButtonAbsent = elRow.children[3].firstChild;
        switch (clueState) {
            case CLUE_SELECTION_STATE.UNKNOWN:
                elButtonUnknown.classList.remove("cluebuttonoff");
                elButtonUnknown.classList.add("cluebuttonon");
                elButtonPresent.classList.remove("cluebuttonon")
                elButtonPresent.classList.add("cluebuttonoff")
                elButtonAbsent.classList.remove("cluebuttonon")
                elButtonAbsent.classList.add("cluebuttonoff")
                break;
            case CLUE_SELECTION_STATE.PRESENT:
                elButtonUnknown.classList.remove("cluebuttonon");
                elButtonUnknown.classList.add("cluebuttonoff");
                elButtonPresent.classList.remove("cluebuttonoff")
                elButtonPresent.classList.add("cluebuttonon")
                elButtonAbsent.classList.remove("cluebuttonon")
                elButtonAbsent.classList.add("cluebuttonoff")
                break;
            case CLUE_SELECTION_STATE.ABSENT:
                elButtonUnknown.classList.remove("cluebuttonon");
                elButtonUnknown.classList.add("cluebuttonoff");
                elButtonPresent.classList.remove("cluebuttonon")
                elButtonPresent.classList.add("cluebuttonoff")
                elButtonAbsent.classList.remove("cluebuttonoff")
                elButtonAbsent.classList.add("cluebuttonon")
                break;
        }
    },
    /** Did the user explicitly make a selection for this clue ? */
    isClueSelected: function View_isClueSelected(clueKey) {
        if (this.clueSelectionState === undefined) {
            return false;
        }
        const clueState = this.clueSelectionState[clueKey];
        if (clueState !== CLUE_SELECTION_STATE.UNKNOWN) {
            return true;
        } else {
            return false;
        }
    },
    /** mark all the clues that are impossible with the current selected combination of monsters */
    styleUnmatchingClues: function View_styleUnmatchingClues(matchingMonsters) {
        const elClueTable = document.getElementById("clues");
        for (const elTableRow of elClueTable.rows) {
            const rowClueKey = elTableRow.firstChild.innerText;
            const elClueName = elTableRow.children[4];
            // first, style all as unmatched
            elClueName.classList.add("unmatchedclue");
            for (const monster of matchingMonsters) {
                for (const monsterClueKey of monster.clues) {
                    if (monsterClueKey == rowClueKey) {
                        // at least one monster has this clue
                        // now style as matched
                        elClueName.classList.remove("unmatchedclue");
                    }
                }
            }
        }
    },
    /** update the list of visible monsters and their displayed clues
     * @param {array} validMonsters array of valid monster objects (with key, name, clues, ...)
     */
    updateVisibleMonsters: function View_updateVisibleMonsters(validMonsters) {
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
                if (!this.isClueSelected(clueKey)) {
                    /// The clue is not implicitly defined by user selection,
                    ///  so display this clue.
                    monsterTableBuilder.createCellClue(clueName);
                }
            }
        }
        monsterTableBuilder.finalize();
    },
    /** User clicked a monster to get its details */
    onMonsterClicked: function View_onMonsterClicked(event) {
        // the monster key is stored in the hidden first cell of the table
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


const ClueTableBuilder = {
    init: function ClueTableBuilder_init(parentId) {
        this.parentId = parentId || "clues";
        this.tableBody = document.createElement("tbody");
        this.currentTableRow = undefined;
        this.currentColumnIndex = undefined;
        this.currentCell = undefined;
    },
    createRow: function ClueTableBuilder_createRow(clueKey, localizedClueName) {
        // New row for each clue
        this.newRow();
        // First invisible cell displays the clue key
        this.createCellKey(clueKey);
        // Next cell displays the button to mark the investigation state to "unknown"
        this.createCellButtonUnknown();
        // Next cell displays the button to mark the investigation state to "present"
        this.createCellButtonPresent();
        // Next cell displays the button to mark the investigation state to "absent"
        this.createCellButtonAbsent();
        // Next cell displays the clue name
        this.createCellName(localizedClueName);
    },
    newRow: function ClueTableBuilder_newRow() {
        this.currentTableRow = this.tableBody.insertRow(-1);
        this.currentColumnIndex = 0;
    },
    /** Create a table cell that will contain the clue's key */
    createCellKey: function ClueTableBuilder_createCellKey(clueKey) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        this.currentCell.innerHTML = clueKey;
        // This special cell is invisible
        this.currentCell.style.display = "none";
    },
    /** Create a table cell that will contain the button to mark the investigation state to "unknown" */
    createCellButtonUnknown: function ClueTableBuilder_createCellButtonUnknown() {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        const elButton = document.createElement("button");
        this.currentCell.classList.add("cluebuttoncell");
        elButton.innerHTML = "?";
        elButton.addEventListener("click", View.onClueButtonUnknownClicked.bind(View));
        this.currentCell.appendChild(elButton);
    },
    /** Create a table cell that will contain the button to mark the investigation state to "present" */
    createCellButtonPresent: function ClueTableBuilder_createCellButtonPresent() {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        const elButton = document.createElement("button");
        this.currentCell.classList.add("cluebuttoncell");
        elButton.innerHTML = "✓";
        elButton.addEventListener("click", View.onClueButtonPresentClicked.bind(View));
        this.currentCell.appendChild(elButton);
    },
    /** Create a table cell that will contain the button to mark the investigation state to "absent" */
    createCellButtonAbsent: function ClueTableBuilder_createCellButtonAbsent() {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        const elButton = document.createElement("button");
        this.currentCell.classList.add("cluebuttoncell");
        elButton.innerHTML = "×";
        elButton.addEventListener("click", View.onClueButtonAbsentClicked.bind(View));
        this.currentCell.appendChild(elButton);
    },
    /** Create a table cell that will contain the clue's name */
    createCellName: function ClueTableBuilder_createCellName(localizedClueName) {
        this.currentCell = this.currentTableRow.insertCell(this.currentColumnIndex++);
        this.currentCell.classList.add("cluenamecell");
        this.currentCell.innerHTML = localizedClueName;
        this.currentCell.addEventListener("click", View.onClueNameClicked.bind(View));
    },
    /** Finalize the table and add it to the page */
    finalize: function ClueTableBuilder_finalize() {
        const elClues = document.getElementById(this.parentId);
        elClues.innerHTML = "";
        elClues.appendChild(this.tableBody);
    },
};
/** Fully instantiate a new ClueTableBuilder */
function newClueTableBuilder(parentId) {
    const o = Object.create(ClueTableBuilder);
    o.init(parentId);
    return o;
}

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
        // special style for the monster name
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
function newMonsterTableBuilder(parentId) {
    const o = Object.create(MonsterTableBuilder);
    o.init(parentId);
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