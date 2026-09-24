const { getDefaultConfig } = require("expo/metro-config");
const { createExpoApiProxy } = require("./server/expoProxy.cjs");
const config = getDefaultConfig(__dirname);
const enhance = config.server.enhanceMiddleware;
const apiProxy = createExpoApiProxy(Number(process.env.API_PORT || 3001));
config.server.enhanceMiddleware = (middleware, server) => {
  const original = enhance ? enhance(middleware, server) : middleware;
  return (req,res,next) => apiProxy(req,res,() => original(req,res,next));
};
module.exports = config;
