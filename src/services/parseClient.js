import Parse from "parse";

const APP_ID = import.meta.env.VITE_BACK4APP_APP_ID;
const JS_KEY = import.meta.env.VITE_BACK4APP_JS_KEY;
const SERVER_URL = import.meta.env.VITE_BACK4APP_SERVER_URL || "https://parseapi.back4app.com/";

/** True when Back4App env vars are set (Vite embeds these at build time). */
export function isBack4AppConfigured() {
  return Boolean(APP_ID && JS_KEY);
}

if (isBack4AppConfigured()) {
  Parse.initialize(APP_ID, JS_KEY);
  Parse.serverURL = SERVER_URL;
}

export default Parse;
