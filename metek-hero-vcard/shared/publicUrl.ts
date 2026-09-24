export function isInternetUrl(value: string): boolean {
  try {
    const url = new URL(value), host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password &&
      host.includes(".") && !host.endsWith(".local") && !host.endsWith(".localhost") &&
      !/^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
  } catch { return false; }
}
