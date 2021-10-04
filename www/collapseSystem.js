/** Collapse the next element after the "clickcollapse" */
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

/** Initialize all collapsable elements */
export function init() {
    const allClickCollapse = document.getElementsByClassName("clickcollapse");
    for (let index = 0; index < allClickCollapse.length; index++) {
        const elClickCollapse = allClickCollapse[index];
        elClickCollapse.addEventListener("click", collapseClicked, false);
    }
}
