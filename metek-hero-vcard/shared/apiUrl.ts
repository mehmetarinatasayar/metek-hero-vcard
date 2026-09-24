type Options = { platform: string; development: boolean; configured?: string; hostUri?: string | null };
export function resolveApiUrl({platform,development,configured,hostUri}: Options): string {
  if (platform === "web") return (configured || "http://localhost:3001").replace(/\/$/, "");
  let localConfiguration = !configured;
  try { localConfiguration ||= ["localhost","127.0.0.1","[::1]"].includes(new URL(configured!).hostname); } catch { /* The request reports invalid configuration. */ }
  if (development && localConfiguration && hostUri) {
    try {
      const url = new URL(hostUri.includes("://") ? hostUri : `http://${hostUri}`);
      if ([".exp.direct",".trycloudflare.com"].some(suffix => url.hostname.endsWith(suffix))) { url.protocol="https:"; url.port=""; }
      if (!["http:","https:"].includes(url.protocol) || url.username || url.password) return "";
      return `${url.origin}/__metek_api`;
    } catch { return ""; }
  }
  return (configured || "").replace(/\/$/, "");
}
