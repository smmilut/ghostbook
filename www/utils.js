/*
 * Utilities module
 */

export const Http = (function build_HttpUtils() {
    /* Http utils module */
    const HttpRequest = function createHttpRequestPromise(options) {
        /* promisified XMLHttpRequest
         * 
         * Parameters :
         *  options = {
         *              method,  // default: "GET"
         *              url,
         *              async,  // default: true
         *              requestHeaders : [{name, value}],
         *              data
         *            }
         * 
         * Resolve returns :
         *  {responseText}
         *
         * Reject returns :
         *  {status, statusText}
         * */
        return new Promise(function promiseHttpRequest(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open(options.method || "GET", options.url, options.async || true);
            if (options.requestHeaders) {
                for (let i = 0; i < options.requestHeaders.length; i++) {
                    xhr.setRequestHeader(options.requestHeaders[i].name, options.requestHeaders[i].value);
                };
            };
            xhr.onloadend = function httpRequestLoadEnd() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    resolve({
                        responseText: xhr.responseText
                    });
                } else {
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText
                    });
                };
            };
            xhr.onerror = function httpRequestError() {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText
                });
            };
            xhr.send(options.data);
        });
    };

    /* exposed module properties */
    return {
        Request: HttpRequest
    };
})();

/*
* Get object values based on selected Locale
*/
export const Locale = (function build_Locale() {
    // this object
    const objLocale = {};
    // default fallback locale
    const defaultLocale = "en";
    // array of user preferred locales, in order
    let userPreferredLocales = navigator.languages;
    /*
    * Get object value based on selected Locale
    */
    objLocale.get = function objLocale_get(object, propertyName) {
        for (let localeIndex = 0; localeIndex < userPreferredLocales.length; localeIndex++) {
            const userPreferredLocale = userPreferredLocales[localeIndex];
            const userPreferredLocaleShort = userPreferredLocale.split("-", 1)[0]
            const localizedPropertyName = propertyName + "_" + userPreferredLocaleShort;
            const localizedPropertyValue = object[localizedPropertyName];
            if (localizedPropertyValue != undefined) {
                return localizedPropertyValue;
            }
        }
        const defaultPropertyName = propertyName + "_" + defaultLocale;
        const defaultPropertyValue = object[defaultPropertyName];
    };

    return objLocale;
})();