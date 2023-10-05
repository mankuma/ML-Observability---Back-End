const express = require('express');
const router = express.Router();
const {logInfo, sql, queryParam, sqlOP, logger, apiResponse} = require('../modules/component');
const {setCache} = require('../config/cache');
const now = require("performance-now");
const email_trigger = require('../utils/email_trigger');
const winston = require('../config/winston');

/**
 * @swagger
 *  /unauth/accessRequest:
 *  Post:
 *    description: Form submission of new user request for application access
 *    tags: [Unauth]
 *    responses:
 *      '200':
 *        description: Successfully raised request for application access
 *      '400':
 *        description: Invalid request, Please provide valid request paramenters
 *  parameters:
 *     
 *      - in: query
 *        email id: cdw email id
 *        type: string
 *        required: true
 *        description: valid cdw customer email id
 *      - in: query
 *        co-worker id: customer id
 *        type: string
 *        required: true
 *        description: customer id
 *      - in: query
 *        First Name: first name
 *        type: string
 *        required: true
 *        description: customer first name
 *      - in: query
 *        Last Name: last name
 *        type: string
 *        required: true
 *        description: customer last name
 *      - in: query
 *        Reason For Access: reason for access
 *        type: string
 *        required: true
 *        description: purpose for which customer has requested access for(Track Accounts, Research, Team Performance Tracking)
 */
 router.post('/accessRequest', async (req, res) => {
    let startTime = now();
    /** read query parameters */
    let requestForm = req.body;
    /** setting default values for cachekey, response and logging details */
    let response = "";
    let result = apiResponse;
    result.metadata.about = "Customer request for access to application";
    result.metadata.rows = 0;
    var log = logInfo;
    log.user = req.headers.useruuid;
    log.sessionID = req.headers.sessionid;
    log.ip = req.ip;
    log.message = "Access request form is required";
    result.response = log.message;
    result.metadata.responseStatus = 400;
  
    /* execute the query and logging the details to user logs */
    try {
      log.message = "Select query executed to create a record for user raising request for application access";
  
      if (requestForm.email != undefined &&
        requestForm.coWorker != undefined &&
        requestForm.firstName != undefined &&
        requestForm.LastName != undefined &&
        requestForm.reason != undefined) {
        /* Checking if access request is already registered */
        queryParam.sqlQuery = "select CoworkerEmailAddress AS email from "+process.env.DB_Mosaic_Schema+"cdp_admin_access_request where CoworkerEmailAddress = @email_id and IsActive = 1";
        queryParam.columns[0] = {name: 'email_id',type: sql.VarChar,value: requestForm.email}
        response = await sqlOP(queryParam, log);
        if (response.result.recordsets[0].length === 0) {
          //cacheKey = cacheKey + ":" + customerCode.toLowerCase();
          queryParam.sqlQuery = "INSERT INTO "+process.env.DB_Mosaic_Schema+"cdp_admin_access_request (CoworkerEmailAddress,CoworkerFirstName,CoworkerLastName,Reason,CoworkerId,CreatedDatetime,isActive,isApproved,isBulkUpload,isManual,CoworkerManager,CoworkerNetworkId,CoworkerTitle,CoworkerSegment,CreatedBy) VALUES (@email_id,@firstName,@LastName,@reason,@coworker_id,GETDATE(),1,0,0,0,@Manager,@networkID,@title,@segment,@createdBy)";
          queryParam.columns[0]={name:'email_id', type:sql.VarChar, value:requestForm.email},
          queryParam.columns[1]={name:'firstName', type:sql.VarChar, value:requestForm.firstName},
          queryParam.columns[2]={name:'LastName', type:sql.VarChar, value:requestForm.LastName},
          queryParam.columns[3]={name:'reason', type:sql.VarChar, value:requestForm.reason},
          queryParam.columns[4]={name:'coworker_id', type:sql.VarChar, value:requestForm.coWorker},
          queryParam.columns[5]={name:'Manager', type:sql.VarChar, value:requestForm.Manager},
          queryParam.columns[6]={name:'networkID', type:sql.VarChar, value:requestForm.networkID},
          queryParam.columns[7]={name:'title', type:sql.VarChar, value:requestForm.title},
          queryParam.columns[8]={name:'segment', type:sql.VarChar, value:requestForm.segment},
          queryParam.columns[9]={name:'createdBy', type:sql.VarChar, value:requestForm.firstName+" "+requestForm.LastName},
          response = await sqlOP(queryParam, log);
          // console.log('response',response)
          result.metadata.rows = response.result.rowsAffected[0].length;
          result.metadata.responseStatus = response.status;
          result.response = 'success';
          if (result.response === 'success') {
            await TemplateBuilder({ to: requestForm.email }, { "user_name": requestForm.firstName + ' ' +requestForm.LastName }, email_trigger["request"])
              .then(res => {
                winston.info('email-triggered-request, email-mailer ' + requestForm.email);
              })
              .catch(err => {
                winston.error('error-email-triggered-request, email-mailer ' + requestForm.email + ' message-' + err);
              });
          }
          // console.log('result', result)
          //setCache(cacheKey, process.env.rediscachettl, result);
        } else {
          result.metadata.rows = response.result.recordsets[0].length;
          result.metadata.responseStatus = 200;
          result.response = 'failure'
        }
      }
    } catch (err) {
      // console.log(err)
      result.metadata.responseStatus = response.status || 400;
      result.response = response.result || 'fail';
      //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
      log.error = err;
    } finally {
      if (response.log === undefined)
        logger(log);
      else
        logger(response.log);
      result.metadata.responseTime = now() - startTime;
      res.status(response.status || result.metadata.responseStatus);
      res.json(result);
    }
  });
  /**
   * @swagger
   *  /unauth/accessRequest/verify:
   *  get:
   *    description: verify given email is valid cdw user or not
   *    tags: [Entity]
   *    responses:
   *      '200':
   *        description: verify given email is valid cdw user or not
   *      '401':
   *        description: UnAuthorized access, Please provide correct Authentication token
   *      '400':
   *        description: Invalid request, Please provide valid request paramenters
   *  parameters:
   *      - in: header
   *        name: authorization
   *        type: string
   *        required: true
   *        description: API Key for authentication
   *      - in: query
   *        name: email
   *        type: string
   *        required: true
   *        description: email required to check whether user exists in cdw records
   */
  router.get('/accessRequest/verify', async (req, res) => {
    let startTime = now();
    /** read query parameters */
    let email = req.query.email;
  
    /** setting default values for cachekey, response and logging details */
    let response = "";
    let result = apiResponse;
    result.metadata.about = "verify email is valid or not";
    result.metadata.rows = 0;
    var log = logInfo;
    log.user = req.headers.useruuid;
    log.sessionID = req.headers.sessionid;
    log.ip = req.ip;
    log.message = "email is required";
    result.response = log.message;
    result.metadata.responseStatus = 400;
  
    /** execute the query and logging the details to user logs */
    try {
      log.message = "Select query executed to fetch List of filters available for companySpend";
      if (email != undefined && email != null && email != 'null') {
        //cacheKey = cacheKey + ":" + customerCode.toLowerCase();
        let request = false
        queryParam.sqlQuery = "select CoworkerEmailAddress AS email, isActive AS status from "+process.env.DB_Mosaic_Schema+"cdp_admin_access_request with (nolock) where CoworkerEmailAddress = @email_id  and IsActive = 1";
        queryParam.columns[0] = {
          name: 'email_id',
          type: sql.VarChar,
          value: email
        }
        response = await sqlOP(queryParam, log);
        result.metadata.rows = response.result.recordsets[0].length;
        if(result.metadata.rows > 0){
          request = true;
        }
        if (!request) {
          queryParam.sqlQuery = "select a.user_email_address AS email, a.user_coworker_id AS coWorker, a.user_first_name AS firstName,a.user_last_name As LastName, a.managercoworkercode AS Manager, a.user_networkuserid AS networkID, a.user_title AS title, a.user_coworkersegment AS segment from "+process.env.DB_Mosaic_Schema+"cdp_admin_all_users as a left join "+process.env.DB_Mosaic_Schema+"cdp_admin_users as b on a.user_email_address = b.user_email_address where (a.user_email_address = @email_id and b.is_active is null and User_TerminationFlag = 0) or (a.user_email_address = @email_id and b.is_active = 0 and User_TerminationFlag = 0)";
          queryParam.columns[0] = {
            name: 'email_id',
            type: sql.VarChar,
            value: email
          }
          response = await sqlOP(queryParam, log);
          result.metadata.rows = response.result.recordsets[0].length;
          if (result.metadata.rows === 0) {
            result.metadata.responseStatus = 400;
            result.response = 'email is not found in cdw records'
          } else {
            result.metadata.responseStatus = response.status;
            result.response = response.result.recordsets[0];
          }
        }else{
          result.metadata.responseStatus = 200;
          result.response = 'request is in progress';
        }
        //setCache(cacheKey, process.env.rediscachettl, result);
      }
    } catch (err) {
      // console.log(err)
      result.metadata.responseStatus = response.status;
      result.response = response.result;
      log.error = err;
    } finally {
      if (response.log === undefined)
        logger(log);
      else
        logger(response.log);
      result.metadata.responseTime = now() - startTime;
      res.status(result.metadata.responseStatus);
      res.json(result);
    }
  });

  /**
   * @swagger
   *  /unauth/accessRequest:
   *  get:
   *    description: List of filters available for company spend
   *    tags: [Entity]
   *    responses:
   *      '200':
   *        description: List of filters available for drilldown
   *      '401':
   *        description: UnAuthorized access, Please provide correct Authentication token
   *      '400':
   *        description: Invalid request, Please provide valid request paramenters
   *  parameters:
   *      - in: header
   *        name: authorization
   *        type: string
   *        required: true
   *        description: API Key for authentication
   *      - in: query
   *        name: email
   *        type: string
   *        required: true
   *        description: email id
   */
   router.get('/accessRequest', async (req, res) => {
    let startTime = now();
    /** read query parameters */
    let email = req.query.email;
  
    /** setting default values for cachekey, response and logging details */
    let response = "";
    let result = apiResponse;
    result.metadata.about = "verify user is enabled or not";
    result.metadata.rows = 0;
    var log = logInfo;
    log.user = req.headers.useruuid;
    log.sessionID = req.headers.sessionid;
    log.ip = req.ip;
    log.message = "email is required";
    result.response = log.message;
    result.metadata.responseStatus = 400;
  
    /** execute the query and logging the details to user logs */
    try {
      log.message = "Select query executed to fetch user details";
      if (email != undefined) {
        //cacheKey = cacheKey + ":" + customerCode.toLowerCase();
        let request = false
        queryParam.sqlQuery = "select user_email_address AS email, is_Active AS status from "+process.env.DB_Mosaic_Schema+"cdp_admin_users with (nolock) where user_email_address = @email_id";
        queryParam.columns[0] = {
          name: 'email_id',
          type: sql.VarChar,
          value: email
        }
        response = await sqlOP(queryParam, log);
        result.metadata.rows = response.result.recordsets[0].length;
        result.metadata.responseStatus = response.status;
        result.response = response.result.recordsets[0];
        //setCache(cacheKey, process.env.rediscachettl, result);
      }
    } catch (err) {
      // console.log(err)
      result.metadata.responseStatus = response.status;
      result.response = response.result;
      log.error = err;
    } finally {
      if (response.log === undefined)
        logger(log);
      else
        logger(response.log);
      result.metadata.responseTime = now() - startTime;
      res.status(result.metadata.responseStatus);
      res.json(result);
    }
  });
//module exports statements
module.exports = router;