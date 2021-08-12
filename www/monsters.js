import * as utils from "./utils.js";

export const MonsterCodex = (function buildMonsterCodex() {
    // the object we are building
    const objMonsterCodex = {};
    // Monster codex data retrieved from the JSON file
    let json_obj = {};

    /*
    * Get monster database and update monster and clue data on the page
    */
    objMonsterCodex.fetchData = function Codex_fetchData(url) {
        return utils.Http.Request({
            url: url || "data/monsters.json"
        })
            .then(function gotMonsters(data) {
                updateLocalDatabase(data.responseText);
                updateVersionInfo()
                updateVisibleMonsters();
                initCluesHtml();
            });
    };

    /*
    * Update monster and clue data from json text
    */
    function updateLocalDatabase(jsonText) {
        json_obj = JSON.parse(jsonText);
    }

    /*
    * Display info about the game version
    */
    function updateVersionInfo() {
        const elVersionInfo = document.getElementById("versioninfo");
        elVersionInfo.innerHTML = json_obj.game_version;
    }

    /*
    * Display the details about that monster
    */
    function showDetails(monsterKey) {
        const elDetails = document.getElementById("details");
        json_obj.monsters.forEach(function findMonsterNamed(monster) {
            if (monster.key == monsterKey) {
                elDetails.innerHTML = "";
                // Add monster name as title
                const nameHeader = document.createElement("h2");
                nameHeader.innerText = monster.name + " :";
                elDetails.append(nameHeader);
                // Add details from database
                const detailsDiv = document.createElement("div");
                detailsDiv.innerHTML = monster.details;
                elDetails.append(detailsDiv);
            }
        });
    };

    /*
    * Clear the monster details display
    */
    function clearDetails(monsterName) {
        const elDetails = document.getElementById("details");
        elDetails.innerHTML = "(click a ghost for details)";
    }

    /*
    * Init the list of clues
    */
    function initCluesHtml() {
        const elClues = document.getElementById("clues");
        json_obj.clues.forEach(function initClue(clue) {
            let elClue = new Option(clue.name, clue.key, false, false);
            elClues.options.add(elClue);
        });
        elClues.addEventListener("change", clueSelectionChanged, false);
    }

    /*
    * User (un)selected clues
    */
    function clueSelectionChanged(event) {
        let selectedClues = [];
        const options = event.target.options;
        for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
            const option = options[optionIndex];
            if (option.selected) {
                selectedClues.push(option.value);
            }
        }
        updateVisibleMonsters(selectedClues);
        styleUnmatchingClues(selectedClues);
    }

    /*
    * mark all the clues that are impossible with the current selected combination
    */
    function styleUnmatchingClues(selectedClues) {
        const matchingMonsters = getMatchingMonsters(selectedClues);
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
    }
    

    /*
    * return a list of monsters that match the selected clues
    */
    function getMatchingMonsters(selectedClues) {
        return json_obj.monsters.filter(function verifyMonster(monster) {
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
        });
    }

    /*
    * update the list of visible monsters and their displayed clues
    */
    function updateVisibleMonsters(selectedClues) {
        /*** prepare the list of monsters and clues */
        // do we show all clues anyway ?
        let showAll;
        // the list of only the monsters that match the selected clues
        let validMonsters;
        if (selectedClues == undefined || selectedClues.length == 0) {
            // Selection is undefined when initializing.
            // Selection is empty when unselecting all.
            // ==> Showing all monsters.
            showAll = true;
            validMonsters = json_obj.monsters;
        } else {
            showAll = false;
            validMonsters = getMatchingMonsters(selectedClues);
        }

        /*** update the display of the monster table */
        const elSuspects = document.getElementById("suspects");
        const tableBody = document.createElement("tbody");

        if (validMonsters.length == 0) {
            displayMonsterError();
            return;
        }

        for (let monsterIndex = 0; monsterIndex < validMonsters.length; monsterIndex++) {
            const monster = validMonsters[monsterIndex];
            // New row for each monster
            let tableRow = tableBody.insertRow(-1);
            tableRow.addEventListener("click", monsterClicked, false);
            let columnIndex = 0;
            // First invisible cell displays the monster key
            const cellKey = tableRow.insertCell(columnIndex++);
            cellKey.innerHTML = monster.key;
            cellKey.style.display = "none";
            // Second cell displays the monster name
            const cellName = tableRow.insertCell(columnIndex++);
            cellName.classList.add("monstername")
            cellName.innerHTML = monster.name;
            if (validMonsters.length == 1) {
                cellName.classList.add("foundmonster");
                showDetails(monster.key);
                break;
            }
            // All other cells display the remaining clues
            for (let clueIndex = 0; clueIndex < monster.clues.length; clueIndex++) {
                const clueKey = monster.clues[clueIndex];
                if (showAll || !selectedClues.includes(clueKey)) {
                    // Display this clue
                    const cellClue = tableRow.insertCell(columnIndex++);
                    const clueName = getClueForKey(clueKey);
                    cellClue.innerHTML = clueName;
                }
            }
        };
        if (validMonsters.length != 1) {
            clearDetails();
        }
        elSuspects.innerHTML = "";
        elSuspects.appendChild(tableBody);
    }

    /*
    * get clue name when given the clue key
    */
    function getClueForKey(clueKey) {
        for (let clueIndex = 0; clueIndex < json_obj.clues.length; clueIndex++) {
            const clue = json_obj.clues[clueIndex];
            if (clueKey == clue.key) {
                return clue.name;
            }
        }
    }

    /*
    * User clicked a monster to get its details
    */
    function monsterClicked(event) {
        const monsterKey = event.target.parentElement.firstChild.innerText;
        showDetails(monsterKey);
    }

    /*
    * Update the monster table to show an error if the combination of clues is impossible
    */
    function displayMonsterError() {
        const elSuspects = document.getElementById("suspects");
        const tableBody = document.createElement("tbody");

        let tableRow = tableBody.insertRow(-1);
        const cellError = tableRow.insertCell(0);
        cellError.classList.add("monstererror")
        cellError.innerHTML = "No monsters are valid for this combination of clues.";

        elSuspects.innerHTML = "";
        elSuspects.appendChild(tableBody);
    }

    return objMonsterCodex;
})();
