const express = require('express');
const router = express.Router();
const { logInfo, generateErrorLog} = require('../modules/component');
const { user, sessionID} = require('../init');

/**
 * @swagger
 * /:
 *  get:
 *    description: Use to request index page of Customer Profile API
 *    tags: [Home]
 *    responses:
 *      '200':
 *        description: A successful response, with details of the application
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API key for authentication
 */
router.get('/', async(req, res, next) =>{
  try{
	  //res.sendFile(process.cwd()+"/CM/dist/Angular/index.html")
    setCache('dsanaliticsapp:home:welcome', 3600, "'index', {pageTitle: 'Welcome to DS Analytics', info: 'DS Analytics Back-End Application, Please contact administrator for more details.'}");
  }catch(err){
    generateErrorLog(logInfo, user, sessionID, err.status, err.message, req.originalUrl, req.method, req.connection.remoteAddress);
    res.status(err.status || 500);
    res.render('error', {pageTitle: 'DS Analytic  API', status: err.status || 500, message: err.message});
  }finally{
    res.status(200);
    res.render('index', {pageTitle: 'Welcome to DS Analytics', info: 'DS Analytics Back-End Application, Please contact administrator for more details.'});
  }
});

module.exports = router;