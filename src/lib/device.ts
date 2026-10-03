/**
 * This device in a few words, for security notifications ("You logged in on
 * Chrome on Android"), from the browser's user agent. A best guess: good
 * enough for someone to recognise their own phone.
 */
export function describeThisDevice(): string {
  if (typeof navigator === "undefined") return "a browser";
  const agent = navigator.userAgent;

  const system = /iPhone/.test(agent)
    ? "iPhone"
    : /iPad/.test(agent) || (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)
      ? "iPad"
      : /Android/.test(agent)
        ? "Android"
        : /Windows/.test(agent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(agent)
            ? "Mac"
            : /Linux/.test(agent)
              ? "Linux"
              : null;

  // Order matters: Edge, Opera and Samsung Internet also say "Chrome".
  const browser = /EdgA?\/|Edg\//.test(agent)
    ? "Edge"
    : /OPR\/|Opera/.test(agent)
      ? "Opera"
      : /SamsungBrowser/.test(agent)
        ? "Samsung Internet"
        : /CriOS|Chrome\//.test(agent)
          ? "Chrome"
          : /FxiOS|Firefox\//.test(agent)
            ? "Firefox"
            : /Safari\//.test(agent)
              ? "Safari"
              : "a browser";

  return system ? `${browser} on ${system}` : browser;
}
