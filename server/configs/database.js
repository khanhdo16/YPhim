const mongoose = require("mongoose");
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const redis = require('redis');
const keys = require('../keys');
const { setRateLimit } = require('./ratelimit');

var app;

const connectMongoDB = () => {
    //Establish connection to MongoDB
    mongoose.connect(keys.mongodb)

    const db = mongoose.connection
    db.on('error', console.error.bind(console, 'Connection error:'))
    db.once('open', () => console.log('Connected to MongoDB'))
}

const redisClient = redis.createClient({url: keys.redis});

const connectRedis = async () => {
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    redisClient.on('ready', () =>  console.log('Connected to Redis'))
    await redisClient.connect();

    setRateLimit(redisClient, app);
}

const getRedisClient = () => redisClient;

const database = {
    initialize: (passedApp) => {
        app = passedApp;

        connectMongoDB();
        connectRedis();
    },
    session: () => {
        const store = new MongoDBStore({
            uri: keys.mongodb,
            collection: 'sessions'
        });

        return store;
    },
    getRedisClient
}

module.exports = database