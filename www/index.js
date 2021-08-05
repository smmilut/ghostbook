import * as utils from "./utils.js";

const MonsterCodex = (function buildMonsterCodex() {
    // the object we are building
    const objMonsterCodex = {};
    // Monster codex data retrieved from the JSON file
    let json_obj = {};

    /*
    * Get monster database and update monster and clue data on the page
    */
    objMonsterCodex.fetchData = function Codex_fetchData(url) {
        return utils.Http.Request({
            url: url || "../data/monsters.json"
        })
            .then(function gotMonsters(data) {
                json_obj = JSON.parse(data.responseText);
                console.log(json_obj);
                const elVersionInfo = document.getElementById("versioninfo");
                elVersionInfo.innerHTML = json_obj.game_version;
                updateVisibleMonsters();
                initCluesHtml();
            });
    };

    /*
    * Display the details about that monster
    */
    objMonsterCodex.showDetails = function Codex_showDetails(monsterName) {
        const elDetails = document.getElementById("details");
        json_obj.monsters.forEach(function findMonsterNamed(monster) {
            if (monster.name == monsterName) {
                console.log(monster.details);
                elDetails.innerHTML = monster.details;
            }
        });
    };

    /*
    * Clear the monster details display
    */
    objMonsterCodex.clearDetails = function Codex_clearDetails(monsterName) {
        const elDetails = document.getElementById("details");
        elDetails.innerHTML = "";
    };

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
    }

    /*
    * return a list of monsters that match the selecetd clues
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
        let showAll;
        let validMonsters;
        if (selectedClues == undefined || selectedClues.length == 0) {
            showAll = true;
            validMonsters = json_obj.monsters;
        } else {
            showAll = false;
            validMonsters = getMatchingMonsters(selectedClues);
        }

        const elSuspects = document.getElementById("suspects");
        const tableBody = document.createElement("tbody");

        validMonsters.forEach(function displayMonsterRow(monster) {
            let tableRow = tableBody.insertRow(-1);
            const cellName = tableRow.insertCell(0);
            cellName.innerHTML = monster.name;
            tableRow.addEventListener("click", monsterClicked, false);

            let columnIndex = 1;
            for (let clueIndex = 0; clueIndex < monster.clues.length; clueIndex++) {
                const clueName = monster.clues[clueIndex];
                if (showAll || !selectedClues.includes(clueName)) {
                    const cellClue = tableRow.insertCell(columnIndex);
                    cellClue.innerHTML = clueName;
                    columnIndex += 1;
                }
            }
        });
        objMonsterCodex.clearDetails();
        elSuspects.innerHTML = "";
        elSuspects.appendChild(tableBody);
    }

    /*
    * User clicked a monster to get its details
    */
    function monsterClicked(event) {
        const monsterName = event.target.parentElement.firstChild.innerText;
        objMonsterCodex.showDetails(monsterName);
    }

    return objMonsterCodex;
})();





(function init() {
    MonsterCodex.fetchData();
})();
