const express = require('express');
const subdomain = require('express-subdomain');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const { getSitemap } = require('./configs/sitemap');
const path = require('path');
const { database, auth, cron } = require('./configs');
const compression = require('compression');
const helmet = require('helmet');
const pupperender = require('pupperender');
const aads = require('./configs/aads');


const adminRouter = require('./routes/admin/index');
const apiRouter = require('./routes/client/api');
const keys = require('./keys');


var port = process.env.PORT || '5000';

const app = express();

app.use(cors({
    credentials: true,
    origin: true
}));
app.use(compression());
app.use(helmet.hidePoweredBy());
app.use(helmet.frameguard({
    action: "sameorigin",
}))
app.use(helmet.crossOriginOpenerPolicy())
app.use(express.json({limit: '50mb'}));

app.use(session({
    secret : keys.session,
    resave: true,
    saveUninitialized: false, 
    rolling: true,
    store: database.session(),
    cookie: {
        sameSite: 'strict',
    }
}));

//Database
database.initialize(app);

//CRON
cron.viewsRating.start();
cron.sitemap.start();


//Auth config
auth.config()
app.use(passport.initialize())
app.use(passport.session())

app.use(subdomain('admin.yphim', adminRouter));

const botUserAgents = [
    ...pupperender.botUserAgents,
    'googlebot',
    'facebookcatalog'
]

app.use(pupperender.makeMiddleware({
    useAgentPattern: new RegExp(botUserAgents.join('|'), 'i'),
    useCache: true,
    cacheTTL: 86400
}))

app.use(aads.makeMiddleware({
    useCache: true,
    cacheTTL: 86400
}))

//CLIENT ROUTER
app.use(express.static(path.join(__dirname, '../client', 'build')))

app.use('/audio', express.static(path.join(__dirname, 'public/uploads')));
app.use('/api', apiRouter);


app.get('/sitemap.xml', async (req, res) => {
    res.header('Content-Type', 'application/xml');

    const sitemap = await getSitemap();
    if(sitemap) return res.status(200).send(sitemap);

    return res.sendStatus(500);
})

app.get('/not-found', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../client/build', 'index.html'));
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.listen(port, () => {
    console.log('Listening on port ' + port)
})