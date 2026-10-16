"use client";

/**
 * Loads installPrompt.ts on every page, so the browser's one-time
 * "this app can be installed" event is caught even before Home is open.
 * Renders nothing.
 */
import "./installPrompt";

export function InstallPromptListener() {
  return null;
}
