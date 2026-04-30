const ua = navigator.userAgent.toLowerCase();

export const isMacOS = ua.includes("macintosh") || ua.includes("mac os");
export const isWindows = ua.includes("windows");
