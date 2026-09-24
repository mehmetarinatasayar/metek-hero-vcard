const http = require("node:http");

// Development only: the phone reaches the authenticated API through the same
// Expo connection as its JavaScript bundle. No separate public API port is needed.
exports.createExpoApiProxy = function createExpoApiProxy(port = 3001) {
  return function proxy(req, res, next) {
    const prefix = "/__metek_api/";
    if (!req.url?.startsWith(prefix)) return next();
    const path = "/" + req.url.slice(prefix.length);
    if (!/^\/(health|auth|users|vcards|nfc)(\/|\?|$)/.test(path)) {
      res.writeHead(404, {"Content-Type":"application/json"});
      return res.end(JSON.stringify({message:"İstenen sayfa bulunamadı."}));
    }
    const headers = {...req.headers, host:`127.0.0.1:${port}`};
    for (const name of ["connection","proxy-authorization","proxy-connection","forwarded","x-forwarded-for","x-forwarded-host","x-forwarded-proto"]) delete headers[name];
    const upstream = http.request({hostname:"127.0.0.1",port,path,method:req.method,headers}, response => {
      res.writeHead(response.statusCode || 502, response.headers);
      response.pipe(res);
    });
    upstream.setTimeout(20000, () => upstream.destroy(new Error("API timeout")));
    upstream.on("error", () => {
      if (res.headersSent) return res.destroy();
      res.writeHead(503,{"Content-Type":"application/json","Cache-Control":"no-store"});
      res.end(JSON.stringify({message:"Bilgisayardaki API servisi kapalı. Uygulamayı başlatıp tekrar deneyiniz."}));
    });
    req.on("aborted", () => upstream.destroy());
    res.on("close", () => upstream.destroy());
    req.pipe(upstream);
  };
};
