import * as monsters from "./monsters.js";

const collapseSystem = (function build_collapseSystem() {
    const objThis = {};
    /*
    * Collapse the next element after the "clickcollapse"
    */
    function collapseClicked(event) {
        const elClickCollapse = event.target;
        const elCollapsable = elClickCollapse.nextElementSibling;
        const isCollapsed = elCollapsable.classList.contains("collapsed");
        // toggle collapsed state
        if (isCollapsed) {
            elCollapsable.classList.remove("collapsed");
        } else {
            elCollapsable.classList.add("collapsed");
        }
    }

    /*
    * Initialize all collapsable elements
    */
    objThis.initCollapse = function initCollapse() {
        const allClickCollapse = document.getElementsByClassName("clickcollapse");
        for (let index = 0; index < allClickCollapse.length; index++) {
            const elClickCollapse = allClickCollapse[index];
            elClickCollapse.addEventListener("click", collapseClicked, false);
        }
    }

    return objThis;
})();

(function init() {
    collapseSystem.initCollapse();
    monsters.MonsterCodex.fetchData();
})();
