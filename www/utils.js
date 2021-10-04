export function jsonClone(o) {
    return JSON.parse(JSON.stringify(o));
}

export function arrayClone(a) {
    return [...a];
}
