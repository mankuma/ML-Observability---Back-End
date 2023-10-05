const sql = require('mssql');
const winston = require('../config/winston');
const { decodeJwtToken } = require('./auth');
const {setCache} = require('../config/cache');
const { poolConnect } = require('../config/DBConnections');
const { metricsPool } = require('../config/userMetrics');
const { amandaconnection } = require('../config/AmandaConnection');
const fs = require('fs').promises;
const {transporter} = require('../config/email');
const email_trigger = require('../utils/email_trigger');

queryParam = {columns:[],sqlQuery:''};
logInfo = {type:'error',user:'',sessionID:'',originalURL:'',method:'',body:'',status:'',role:'',ip:'',message:'',auth:'',loadedPage:'',error:''};
module.exports.apiResponse = {
    metadata:{about:'',rows:0,responseStatus:200,responseTime:0},
    response:{}
};

logger = async function(logInfo){
    try{
        if(logInfo.level === 'info')
            winston.info(`${logInfo.user} - ${logInfo.sessionID} - ${logInfo.originalURL} - ${logInfo.method} - ${logInfo.body || 'no req body'} - ${logInfo.ip || 'IP Address not identified'}`);
        else if(logInfo.level === 'sqlOP')
            winston.info(`${logInfo.user} - ${logInfo.sessionID} - ${logInfo.message || 'SQL query executed'}`);
        else if(logInfo.level === 'loggedIn')
            winston.info(`${logInfo.user} - ${logInfo.sessionID} - ${loginfo.module} - ${logInfo.auth} - ${logInfo.role} - ${logInfo.device} - ${logInfo.ip || 'IP Address not identified'}`);
        else {
            winston.error(`${logInfo.user || 'User details not identified'} - ${logInfo.sessionID} - ${logInfo.originalURL || '/'} - ${logInfo.method || 'GET'} - ${logInfo.message || 'Error message was not identified'} - ${logInfo.body || 'no request body'}- ${logInfo.ip || 'IP Address not identified'}`);
            if (logInfo.user !== "UnAuthorized User") {
                let id = new Date().valueOf()
                await TemplateBuilder({ to: process.env.dev_emails.split(", ") },
                    { id: id, user_name: logInfo.user, session_id: logInfo.sessionID, url: logInfo.originalURL, http_method: logInfo.method, req_body: logInfo.body, ip_adress: logInfo.ip, error_description: logInfo.message,error: logInfo.error, env: process.env.NODE_ENV.toUpperCase() },
                    email_trigger['alert'])
                    .then(res => {
                        winston.info('email-triggered-' + 'alert');
                    })
                    .catch(err => {
                        winston.error('error-email-triggered-' + 'alert' + ', message-' + err);
                    });
            }
        }
    }catch(err){
        console.log("************************error in code*******************");
        winston.error(`${'logger Error'} - ${err.status || 500} - ${'Logger Method'} - ${'Logger'} - ${err.message || 'Error message was not identified'}`);
        if (logInfo.user !== "UnAuthorized User") {
            let id = new Date().valueOf();
            await TemplateBuilder({ to: process.env.dev_emails.split(", ") },
                { id: id, user_name: logInfo.user, session_id: logInfo.sessionID, url: logInfo.originalURL, http_method: logInfo.method, req_body: logInfo.body, ip_adress: logInfo.ip, error_description: logInfo.message,error: logInfo.error, env: process.env.NODE_ENV.toUpperCase() },
                email_trigger['alert'])
                .then(res => {
                    winston.info('email-triggered-' + 'alert');
                })
                .catch(err => {
                    winston.error('error-email-triggered-' + 'alert' + ', message-' + err);
                });
        }
    }
}

module.exports.generateLogInfo = async function(logInfo, sessionID, originalURL, method, body, user){
    logInfo.level = 'info';
    logInfo.user = user;
    logInfo.sessionID = sessionID;
    logInfo.originalURL = originalURL;
    logInfo.method = method;
    logInfo.body = JSON.stringify(body);
    return logInfo;
}
module.exports.generateReqLogInfo = async function(logInfo, originalUrl, method, body, user, sessionID, ip){
    logInfo.level = 'info';
    logInfo.user = user;
    logInfo.sessionID = sessionID;
    logInfo.originalURL = originalUrl;
    logInfo.method = method;
    logInfo.body = JSON.stringify(body);
    logInfo.ip = ip;
    await logger(logInfo);
}

module.exports.generateUnAuthLog = async function(logInfo, sessionID, originalURL, method, body, user, ip){
    logInfo.level = 'info';
    logInfo.user = user;
    logInfo.sessionID = sessionID;
    logInfo.originalURL = originalURL;
    logInfo.method = method;
    logInfo.body = JSON.stringify(body);
    logInfo.message = 'UnAuthenticated request for REST API';
    logInfo.ip = ip;
    await logger(logInfo);
}

generateErrorLog = async function(logInfo, user, sessionID, status, message, originalURL, method, body,ip){
    logInfo.level = 'error';
    logInfo.user = user;
    logInfo.sessionID = sessionID;
    logInfo.originalURL = originalURL;
    logInfo.method = method;
    logInfo.message = message;
    logInfo.status = status;
    logInfo.body = JSON.stringify(body);
    logInfo.ip = ip;
    await logger(logInfo);
}

sqlOP = async function(queryParam, logInfo){
    const pool = await poolConnect;
    let response = {};
    response.logInfo = logInfo;
    let result = '';
    response.logInfo.level = "info";
    try{
        const request = pool.request();
        for(i=0; i<queryParam.columns.length; i++){
            request.input(queryParam.columns[i].name, queryParam.columns[i].type, queryParam.columns[i].value);
        }
        if(queryParam.table)
            result = await request.bulk(queryParam.table);
        else
            result = await request.query(queryParam.sqlQuery);
        response.status = 200;
        response.result = result;
        response.logInfo.status = 200;
    }catch(err){
        response.logInfo.level = "error";
        response.logInfo.status = 500;
        response.logInfo.message = err;
        response.status = 500;
        response.result = 'failure';
        throw err;
    }finally{
        return response;
    }
}

sqlOPforAmanda = async function(queryParam, logInfo){
    let pool = await amandaconnection;
    let response = {};
    response.logInfo = logInfo;
    let result = '';
    response.logInfo.level = "info";
    try{
        const request = pool.request();
        for(i=0; i<queryParam.columns.length; i++){
            request.input(queryParam.columns[i].name, queryParam.columns[i].type, queryParam.columns[i].value);
        }
        if(queryParam.table)
            result = await request.bulk(queryParam.table);
        else
            result = await request.query(queryParam.sqlQuery);
        response.status = 200;
        response.result = result;
        response.logInfo.status = 200;
    }catch(err){
        console.log('i am here')
        response.logInfo.level = "error";
        response.logInfo.status = 500;
        response.logInfo.message = err;
        response.status = 500;
        response.result = 'failure';
        throw err;
    }finally{
        return response;
    }
}

module.exports.generateCacheKey = async function(req){
    var cacheKey = "dsanalyticsapp:";
    var feature = req.originalUrl.split('/');
    //console.log(feature[5])
    if(feature[3] && feature[4])
        cacheKey = cacheKey+feature[3].toLowerCase()+":"+feature[4].split('?')[0].toLowerCase();

    if(req.query.userID != undefined){
        cacheKey = cacheKey + ":" + req.query.userID.toLowerCase();
        if(req.query.moduleID != undefined )
            cacheKey = cacheKey +':'+ req.query.moduleID.toLowerCase();
    }
    else if(req.query.coworkerID != undefined){
        if(req.query.moduleID != undefined )
            cacheKey = cacheKey +':'+ req.query.moduleID.toLowerCase();
        cacheKey = cacheKey + ":" + req.query.coworkerID.toLowerCase();
    }
    if(req.query.customerCode != undefined)
        cacheKey = cacheKey + ":" + req.query.customerCode.toLowerCase();
    if(req.query.pagenumber != undefined)
        cacheKey = cacheKey + ":" + req.query.pagenumber.toLowerCase();
    if(req.query.simulate != undefined)
        cacheKey = cacheKey + ":" + req.query.simulate.toLowerCase();
    if(req.query.sortby != undefined)
        cacheKey = cacheKey + ":" + req.query.sortby.toLowerCase();
    if(req.query.sortorder != undefined)
        cacheKey = cacheKey + ":" + req.query.sortorder.toLowerCase();
    if(req.query.searchterm != undefined)
        cacheKey = cacheKey + ":" + req.query.searchterm.toLowerCase();
    if(req.query.view != undefined)
        cacheKey = cacheKey + ":" + req.query.view.toLowerCase();
    if(req.query.typeofaccount != undefined)
        cacheKey = cacheKey + ":" + req.query.typeofaccount.toLowerCase();
    if(req.query.sellerrole != undefined)
        cacheKey = cacheKey + ":" + req.query.sellerrole.toLowerCase();
    if(req.query.sellerRole != undefined)
        cacheKey = cacheKey + ":" + req.query.sellerRole.toLowerCase();
    if(req.query.goalattained != undefined)
        cacheKey = cacheKey + ":" + req.query.goalattained.toLowerCase();
    if(req.query.accountManager != undefined)
        cacheKey = cacheKey + ":" + req.query.accountManager.toLowerCase();
    if(req.query.roleID != undefined)
        cacheKey = cacheKey + ":" + req.query.roleID.toLowerCase();
    if(req.query.moduleID != undefined)
        cacheKey = cacheKey + ":" + req.query.moduleID.toLowerCase();
    
    return cacheKey;
}

module.exports.validateUser = async function(token){
    if(process.env.AUTHENTICATE === 'false')
        return true;
    else if(token === undefined)
        return false;
    else if((process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa' || process.env.NODE_ENV === 'local') && token === process.env.BEARER_TOKEN)
        return true;
    else{
        if(await decodeJwtToken(token))
            return true;
        else
            return false;
    }
}

getUser = async function(coworkerID){
    queryParam.sqlQuery = "select User_CoWorker_ID AS CoworkerID from CDP_Admin_Users where User_NetworkUserID = @coworkerID and Is_Active = 1";
    queryParam.columns[0]={name:'coworkerID', type:sql.VarChar, value:coworkerID}
    let result = await sqlOP(queryParam,logInfo);
    return result.result.rowsAffected[0];
}

module.exports.addUserMetrics = async function(queryParam, logInfo, feature, sessionID, userID, path, navPath, parent){
    try{
        queryParam.sqlQuery = "INSERT INTO CDP_Info_Activity (Activity_DateTime, User_UUID, Session_ID, Feature_UUID, Navigation_Path, Additional_Details, Referer) VALUES (GETDATE(), @userID, @sessionID, @featureID, @path, @details, @parent)";
        queryParam.columns[0] = {name:'userID', type:sql.Int, value:userID};
        queryParam.columns[1] = {name:'sessionID', type:sql.VarChar, value:sessionID};
        queryParam.columns[2] = {name:'featureID', type:sql.VarChar, value:null};
        queryParam.columns[3] = {name:'path', type:sql.VarChar, value:navPath};
        queryParam.columns[4] = {name:'details', type:sql.VarChar, value:path};
        queryParam.columns[5] = {name:'parent', type:sql.VarChar, value:parent};
        
        logInfo.message = 'Insert Query executed to add user metrics';
        response = await addMetrics(queryParam,logInfo);
        //logger(response.logInfo);
    }catch(err){
        logger(logInfo);
        //console.log('User Metrics : '+err);
    }
}

module.exports.addIntegrationMetrics = async function(queryParam, logInfo, sessionID, appName, direction, callInfo, method, reqBody, resTime, resStatus, parenta){
    try{
        queryParam.sqlQuery = "INSERT INTO CDP_Info_Integration_Calls (Call_DateTime, session_ID, Application_Name, Direction, Call_Info, Method, Additional_Details, Response_Time, Response_Status, Referer) VALUES (GETDATE(), @sessionID, @appName, @direction, @callInfo, @method, @reqBody, @resTime, @resStatus, @parenta)";
        queryParam.columns[0] = {name:'sessionID', type:sql.VarChar, value:sessionID};
        queryParam.columns[1] = {name:'appName', type:sql.VarChar, value:appName};
        queryParam.columns[2] = {name:'direction', type:sql.VarChar, value:direction};
        queryParam.columns[3] = {name:'callInfo', type:sql.VarChar, value:callInfo};
        queryParam.columns[4] = {name:'method', type:sql.VarChar, value:method};
        queryParam.columns[5] = {name:'reqBody', type:sql.VarChar, value:reqBody};
        queryParam.columns[6] = {name:'resTime', type:sql.Int, value:resTime};
        queryParam.columns[7] = {name:'resStatus', type:sql.Int, value:resStatus};
		queryParam.columns[8] = {name:'parenta', type:sql.VarChar, value:parenta};
        logInfo.message = 'Insert Query executed to add user Integration calls';
        let response = await addMetrics(queryParam,logInfo);
        //logger(response.logInfo);
    }catch(err){
        logger(logInfo);
        //console.log('Integration Metrics : '+err);
    }
}

addMetrics = async function(queryParam, logInfo){
    const pool = await metricsPool;
    let response = {};
    response.logInfo = logInfo;
    let result = '';
    try{
        const request = pool.request();
        for(i=0; i<queryParam.columns.length; i++){
            request.input(queryParam.columns[i].name, queryParam.columns[i].type, queryParam.columns[i].value);
        }
        if(queryParam.table)
            result = await request.bulk(queryParam.table);
        else
            result = await request.query(queryParam.sqlQuery);
        response.status = 200;
        response.result = result;
        response.logInfo.status = 200;
    }catch(err){
        response.logInfo.level = "error";
        response.logInfo.status = 500;
        response.logInfo.message = err;
        response.status = 500;
        response.result = 'failure';
        throw err;
    }finally{
        return response;
    }
}

encryptor = async function (req, res, next) {
    try{
        if (req.path.split('/')[1] != 'api-docs') { //bypassing 1)api docs
            const originalSend = res.send;
            const crypto = require("crypto");
            const algorithm = "aes-128-cbc";
            res.send = function (result) {
                let encrypt_response = JSON.parse(result)
                if (encrypt_response.response) {
                    const cipher = crypto.createCipheriv(algorithm, process.env.encryption_key, process.env.encryption_iv);
                    let encryptedData = cipher.update(JSON.stringify(encrypt_response.response), "utf8", "hex");
                    encryptedData += cipher.final("hex");
                    encrypt_response.response = encryptedData;
                    arguments[0] = JSON.stringify(encrypt_response)
                    originalSend.apply(res, arguments);
                }
            };
            next();
        } else {
            next();
        }
    }catch(err){
        console.log(err)
    }
    
}

sendEmail = async function(mailer, content) {
    
    return await transporter.sendMail({
        from: `${process.env.email_domain} <${process.env.email}>`,
        to: mailer.to,
        cc: mailer.cc,
        subject: content.subject,
        text: content.text,
        html: content.html,
        attachments: content.attachments
    }).then(res => {
        return Promise.resolve(res);
    }).catch(err => {
        return Promise.reject(err);
    }).finally(() => {
        // transporter.close();
    });

}
TemplateBuilder = async function (mailer, Keys, content) {
    try {
        if (process.env.NODE_ENV !== "local") {
            if(process.env.NODE_ENV !== 'prod' && content.type !== 'dev'){ //for non prod environments and non dev triggers email will be sent to sender itself
                mailer = {};
                mailer.to = [process.env.email];
            }
            let mailerContent =  Object.assign({}, content);
            let mail = await fs.readFile(mailerContent.template, 'utf8').catch(err => { return { error: err } })
            if (mail != undefined && mail != '') {
                if (!!mail.error) {
                    return Promise.reject(mail.error);
                }
                if(Keys['user_name'] == undefined || Keys['user_name'] == ''){
                    Keys['user_name'] = 'Coworker'
                }
                Keys['redirectURI'] = process.env.redirectURI
                Keys['time'] = new Date().toLocaleString('en-US', {
                    timeZone: 'America/Chicago',
                    year: 'numeric', 
                    month: 'long', 
                    day: '2-digit', 
                    hour:'2-digit',
                    minute:'2-digit',
                    second:'2-digit'
                });
                let html = mail;
                let subject = mailerContent.subject;
                if (!!Keys && Keys != '') {
                    for (let Key in Keys) {
                        let str = "{{" + Key + "}}";
                        html = html.split(str).join(Keys[Key]); //replace All
                        subject = subject.split(str).join(Keys[Key]); //replace All
                    }
                }
                if (html != '') {
                    for (let image in mailerContent.image) {
                        let str1 = "{{" + image + "}}";
                        html = html.split(str1).join(mailerContent.image[image]); //replace All
                    }
                } else {
                    for (let image in mailerContent.image) {
                        let str1 = "{{" + image + "}}";
                        html = mail.split(str1).join(mailerContent.image[image]); //replace All
                    }
                }
                mailerContent.html = html;
                mailerContent.subject = subject;
                if(!!mailer) return await sendEmail(mailer, mailerContent);
            }
        }else{
           return Promise.resolve('Email ignored as this is local environment.');
        }
    } catch (error) {
        return Promise.reject(error);
    }
}



module.exports.sql = sql;
module.exports.logger = logger;
module.exports.sqlOP = sqlOP;
module.exports.sqlOPforAmanda = sqlOPforAmanda;
module.exports.generateErrorLog = generateErrorLog;
module.exports.queryParam = queryParam;
module.exports.logInfo = logInfo;
module.exports.encryptor = encryptor;
module.exports.sendEmail = sendEmail;
module.exports.TemplateBuilder = TemplateBuilder;