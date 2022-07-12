const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");

const setRateLimit = (redis, app) => {
    const limiter = rateLimit({
        // Rate limiter configuration
        windowMs: 1 * 1000, // 15 minutes
        max: 3, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      
        // Redis store configuration
        store: new RedisStore({
          sendCommand: (...args) => redis.sendCommand(args),
        }),
    });

    app.use(limiter)
}

module.exports = { setRateLimit }