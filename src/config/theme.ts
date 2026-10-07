/**
 * Theme constants shared by the server (root layout) and the client
 * (useThemeStore). Kept free of React/Zustand so the server can import it.
 */

export type Theme = "light" | "dark";

/** localStorage key where the user's theme choice is saved (by useThemeStore). */
export const THEME_STORAGE_KEY = "feenicks1-theme";

/**
 * Tiny inline script, run in <head> before the page paints.
 * Reads the saved theme straight from localStorage (Zustand's persist
 * format: {"state":{"theme":"dark"},"version":1}) and adds the `dark` class
 * to <html>. Anything missing or invalid → stays light (the default).
 * Running before paint means dark-mode users never see a white flash.
 */
export const themeInitScript = `(function(){
try{
var s=JSON.parse(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY,
)}));
if(s&&s.state&&s.state.theme==="dark"){
document.documentElement.classList.add("dark")}
}catch(e){}})();`;
