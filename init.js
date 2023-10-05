// including all the libraries required
const express = require('express');
const path = require('path');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUI = require("swagger-ui-express");
var cors = require('cors');
var app = express();
const {client} = require('./config/cache');
const now = require("performance-now");

// application to allow request from external sites
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
var corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

//configuration for user metrics and logs
const {generateErrorLog, addUserMetrics, validateUser, encryptor} = require('./modules/component');
var {queryParam, logInfo, generateReqLogInfo, generateUnAuthLog, generateCacheKey} = require('./modules/component');

//user and session id until there is actual connection from UI
var user = 'UnAuthorized User';
var sessionID = 'UnAuthorized Session';

//routes for the application
var indexRouter = require('./routes/index.route');
var userRouter = require('./routes/user.route');
var authRouter = require('./routes/auth.route');
var unauthRouter = require('./routes/unauth.route');
var amandaRouter = require('./routes/amanda.route');
// view engine setup to send html pages for API calls if needed or errors
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

async function authChecker(req, res, next){
  if(await validateUser(req.headers.authorization) || (req.path.split('/')[1] === 'api-docs' && process.env.NODE_ENV != 'prod')){
    await generateReqLogInfo(logInfo, req.originalUrl, req.method, req.body, req.headers.useruuid, req.headers.sessionid, req.connection.remoteAddress);
    await addUserMetrics(queryParam, logInfo, req.headers.Feature, req.headers.sessionid, req.headers.useruuid, req.method+''+req.originalUrl, req.headers.referer, req.headers.parent);
    let cacheEnabled = ['preference','user','menu','listfeatures','features','entity','funding','executive','executivessummary','sellersummary','accountproductsummary','portfoliosummary','news','seller'];
    //let cacheEnabled = [];
    let checkURL = req.originalUrl.split('/')[4];
    //if(req.query.simulate != undefined && req.query.simulate != 'true' && checkURL != undefined && req.method.toLowerCase() === 'get' && cacheEnabled.indexOf(checkURL.split('?')[0].toLowerCase()) >= 0 && process.env.REDIS_CACHE === 'true'){
      if(checkURL != undefined && req.method.toLowerCase() === 'get' && cacheEnabled.indexOf(checkURL.split('?')[0].toLowerCase()) >= 0 && process.env.REDIS_CACHE === 'true'){
      const cacheKey = await generateCacheKey(req);
      //console.log(cacheKey)
      client.get(cacheKey, (err, data) => {
        if (err){
          res.status(400);
          res.json(err.message)
        }
        if (data !== null){
          res.status(200);
          res.json(JSON.parse(data));
        }
        else
          next();
      });
    }else
      next();
  }
  else{
    await generateUnAuthLog(logInfo, sessionID, req.originalUrl, req.method, req.body, user, req.connection.remoteAddress);
    res.status(401);
    res.render('auth', {message: 'Welcome to Customer Mosiac', status: '401', stack: 'UnAuthorized Access, Please contact administrator for more details'});
  }
  
}

// encryption interceptor finction works when encryption_mode is true
if(process.env.encryption_mode == "true"){
  app.use(encryptor);
}

// middleware functions confirguration
// app.use(authChecker);
app.use(express.Router());
app.use(bodyParser.json());
app.use(express.static(process.cwd()+"/CM/dist/Angular/"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/asset' ,express.static(path.join(__dirname, 'asset')));

//API routes configuration

//app.use('/:id', indexRouter);
app.use('/v1/api/user', authChecker, userRouter);
app.use('/v1/api/auth', authChecker, authRouter);
app.use('/v1/api/unauth', unauthRouter);
app.use('/v1/api/amanda', amandaRouter);
app.use('/*', indexRouter);

if(process.env.NODE_ENV != 'prod'){
  // Swagger configuration for documenting REST APIExtended: https://swagger.io/specification/#infoObject
  const swaggerOptions = {
    swaggerDefinition: {
      info: {
        title: "DATA SCIENCE ANALYTICS API",
        description: "DATA SCIENCE ANALYTICS API Information",
        contact: {
          name: "CDW Developer"
        },
        servers: ["https://localhost"]
      }
    },
    apis: ["./routes/*.js"]
  };
  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
}
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in local
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'local' ? err : {};
  generateErrorLog(logInfo,user,err.status, err.message, req.originalUrl, req.method, req.connection.remoteAddress);
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//module exports statements
module.exports = app;
