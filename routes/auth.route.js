const express = require('express');
const router = express.Router();
const {logInfo, sql, queryParam, sqlOP, logger, apiResponse} = require('../modules/component');
const {setCache} = require('../config/cache');
const now = require("performance-now");
const {getToken} = require('../modules/auth');

router.get('/', async(req, res, next) =>{
    res.send(await decodeJwtToken(req.body.token.access_token));
});

module.exports = router;