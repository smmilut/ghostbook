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
            uncollapse(elCollapsable, elClickCollapse);
        } else {
            collapse(elCollapsable, elClickCollapse);
        }
    }

    function collapse(elCollapsable, elClickCollapse) {
        elCollapsable.classList.add("collapsed");
        elClickCollapse.classList.add("clicktouncollapse");
        elClickCollapse.classList.remove("clicktocollapse");
    }

    function uncollapse(elCollapsable, elClickCollapse) {
        elCollapsable.classList.remove("collapsed");
        elClickCollapse.classList.add("clicktocollapse");
        elClickCollapse.classList.remove("clicktouncollapse");
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
    };

    return objThis;
})();

(function init() {
    collapseSystem.initCollapse();
    monsters.MonsterCodex.fetchData();
})();
