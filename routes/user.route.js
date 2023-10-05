const express = require('express');
const router = express.Router();
const {logInfo, sql, queryParam, sqlOP, logger, apiResponse} = require('../modules/component');
const {setCache, delCache} = require('../config/cache');
const now = require("performance-now");
const Table = require('mssql/lib/table');


/**
 * @swagger
 * /user/feedback:
 *  post:
 *    description: Feedback Submitted by the user
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Feedback Submitted by the user
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API key for authentication
 *      - in: body
 *        name: feedback
 *        description:
 *        schema:
 *          type: object
 *          required:
 *            - type
 *            - tile
 *            - content
 *            - userID
 *          properties:
 *            type:
 *              type: string
 *            title:
 *              type: string
 *            content:
 *              type: string
 *            userID:
 *              type: string
 */
router.post('/feedback', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let userID = req.body.userID;
  let type = req.body.type;
  let title = req.body.title;
  let content = req.body.content;

  /** setting default values for response and logging details */
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Submitted feedback by the user";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID, type, content, title are required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    if(type != undefined && title != undefined && content != undefined && userID != undefined){
      log.message = "insert query executed to add row of feedback";
      queryParam.sqlQuery = "INSERT INTO "+process.env.DB_Mosaic_Schema+"CDP_Admin_Feedback (Feedback_Type, Feedback_Text, Feedback_Title, Created_By, Created_DateTime) VALUES (@type, @content, @title, @createdBY, GETDATE())";
      queryParam.columns[0]={name:'title', type:sql.VarChar, value:title};
      queryParam.columns[1]={name:'content', type:sql.VarChar, value:content};
      queryParam.columns[2]={name:'createdBY', type:sql.VarChar, value:userID};
      queryParam.columns[3]={name:'type', type:sql.VarChar, value:type};
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.rowsAffected[0];
      result.metadata.responseStatus = response.status;
      result.response = 'success';
    }
  }catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = 'failure';
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/preference:
 *  post:
 *    description: Used to insert user preference details of the customer mosaic application
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: response boolean value to indicate if record is added
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API key for authentication
 *      - in: body
 *        name: preference
 *        description:
 *        schema:
 *          type: object
 *          required:
 *            - userID
 *            - moduleID
 *            - featuresList
 *            - featuresIDList
 *            - userUUID
 *          properties:
 *            userID:
 *              type: string
 *            moduleID:
 *              type: integer
 *            featuresList:
 *              type: string
 *            featuresIDList:
 *              type: string
 *            userUUID:
 *              type: integer
 */
router.post('/preference', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let userID = req.body.userID;
  let moduleID = req.body.moduleID;
  let featuresList = req.body.featuresList;
  let featuresIDList = req.body.featuresIDList;
  let userUUID = req.body.userUUID;

  /** setting default values for response and logging details */
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Submitted preference by the user";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID, moduleID, featuresList, featuresIDList, userUUID are required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.sqlQuery = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    if(userID != undefined && moduleID != undefined && featuresIDList != undefined && userUUID != undefined){
      delCache('dsanalyticsapp:user:preference:'+ userID.toLowerCase() + ':' + moduleID);
      log.message = "insert query executed to add row of preference";
      queryParam.table = new sql.Table('CDP_Admin_Users_Features_Xref');
      queryParam.table.create = false;
      queryParam.table.schema = process.env.DB_Mosaic_Schema;
      queryParam.table.columns.add('User_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Feature_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Module_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Is_Active', sql.Int, {nullable: true});
      queryParam.table.columns.add('Widget_Row', sql.Int, {nullable: true});
      queryParam.table.columns.add('Widget_Column', sql.Int, {nullable: true});
      queryParam.table.columns.add('User_Feature_Xref_UUID', sql.Int, {nullable: false, identity: true});
      for (var i=0; i<featuresIDList.length; i++) {
        if(i<3){
          let column = i + 1;
          if(featuresIDList[i] > 0 && featuresList[i] != "")
            queryParam.table.rows.add(userUUID,featuresIDList[i],moduleID,1,1,column,1);
        }
        else{
          let column = i - 2;
          if(featuresIDList[i] > 0 && featuresList[i] != "")
            queryParam.table.rows.add(userUUID,featuresIDList[i],moduleID,1,2,column,1);
        }
      }
      response = await sqlOP(queryParam, log);
      queryParam.table = '';
      result.metadata.rows = response.result.rowsAffected;
      result.metadata.responseStatus = response.status;
      result.response = 'success';
    }
  }catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = 'failure';
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/Preference:
 *  get:
 *    description: User Preference details for the given user ID
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: User Preference details for the given user ID
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: userID
 *        type: string
 *        required: true
 *        description: unique identification of the user
 *      - in: query
 *        name: roleID
 *        type: string
 *        required: true
 *        description: unique identification of the role
 *      - in: query
 *        name: moduleID
 *        type: integer
 *        required: true
 *        description: Unique Indentification of a Module
 */
router.get('/preference', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let userID = req.query.userID;
  let moduleID = req.query.moduleID;
  let roleID = req.query.roleID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:preference";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "User preference for the given userID";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID and moduleID is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch user preference details";
    if(userID != undefined && moduleID != undefined){
      cacheKey = cacheKey + ":" + userID.toLowerCase() + ":" + moduleID.toLowerCase();
      queryParam.sqlQuery = "select * from ( SELECT distinct u.User_UUID as UserUUID, u.User_CoWorker_ID as CoworkerID, u.User_Nick_Name as NickName, u.User_First_Name as FirstName, u.User_Last_Name as LastName, ur.Role_UUID as RoleID, rf.Module_UUID as ModuleID, rf.Feature_UUID as FeatureID, f.Feature_Name as Feature, f.Expandable as Expandable, rf.Widget_Row as WidgetRow, rf.Widget_Column as WidgetColumn, '1' as IsDefault, f.Feature_Component as component, f.Feature_Icon_Name as FeatureIcon, u.displayAlert As displayAlert FROM "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users AS u with (nolock) left join "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Roles_Xref ur with (nolock) ON u.User_UUID = ur.User_UUID left join "+process.env.DB_Mosaic_Schema+"CDP_Admin_Roles_Features_Xref rf with (nolock) ON ur.Role_UUID = rf.Role_UUID and rf.Is_Active = 1 left JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Features AS f with (nolock) ON rf.Feature_UUID = f.Feature_UUID WHERE u.User_UUID not in ( select distinct user_uuid from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Features_Xref with (nolock) WHERE Module_UUID = @moduleID ) union SELECT distinct u.User_UUID as UserUUID, u.User_CoWorker_ID as CoworkerID, u.User_Nick_Name as NickName, u.User_First_Name as FirstName, u.User_Last_Name as LastName, null as Role_UUID, uf.Module_UUID as ModuleID, uf.Feature_UUID as FeatureID, f.Feature_Name as Feature, f.Expandable as Expandable, uf.Widget_Row as WidgetRow, uf.Widget_Column as WidgetColumn, '0' as IsDefault, f.Feature_Component as component, f.Feature_Icon_Name as FeatureIcon, u.displayAlert As displayAlert FROM "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users AS u with (nolock) left join "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Features_Xref AS uf with (nolock) ON u.User_UUID = uf.User_UUID and uf.Is_Active = 1 left JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Features AS f with (nolock) ON uf.Feature_UUID = f.Feature_UUID ) as aa where ModuleID is not null and CoworkerID = @userID and ModuleID = @moduleID order by WidgetRow, WidgetColumn";
      queryParam.columns[0]={name:'userID', type:sql.VarChar, value:userID}
      queryParam.columns[1]={name:'moduleID', type:sql.VarChar, value:moduleID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
      if(result.metadata.rows > 0)
        setCache(cacheKey, process.env.rediscachettl, result);
    }
    if(roleID != undefined && moduleID != undefined){
      cacheKey = cacheKey + ":" + roleID.toLowerCase() + ":" + moduleID.toLowerCase();
      queryParam.sqlQuery = "select rf.Role_UUID as RoleID, rf.Module_UUID as ModuleID, rf.Feature_UUID as FeatureID, f.Feature_Name as Feature, f.Expandable as Expandable, rf.Widget_Row as WidgetRow, rf.Widget_Column as WidgetColumn, '1' as IsDefault, f.Feature_Component as component, f.Feature_Icon_Name as FeatureIcon from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Roles_Features_Xref rf left JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Features AS f ON rf.Feature_UUID = f.Feature_UUID where rf.Role_UUID = @roleID and rf.Module_UUID = @moduleID and rf.Is_Active=1";
      queryParam.columns[0]={name:'roleID', type:sql.VarChar, value:roleID}
      queryParam.columns[1]={name:'moduleID', type:sql.VarChar, value:moduleID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
      if(result.metadata.rows > 0)
        setCache(cacheKey, process.env.rediscachettl, result);
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /User/preference:
 *  put:
 *    description: Used to update user preference details of the customer mosaic application
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: response boolean value to indicate if record is updated
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API key for authentication
 *      - in: body
 *        name: preference
 *        description:
 *        schema:
 *          type: object
 *          required:
 *            - userID
 *            - moduleID
 *            - featuresList
 *            - featuresIDList
 *            - userUUID
 *          properties:
 *            userID:
 *              type: string
 *            moduleID:
 *              type: integer
 *            featuresList:
 *              type: string
 *            featuresIDList:
 *              type: string
 *            userUUID:
 *              type: integer
 */
router.put('/preference', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let userID = req.body.userID;
  let moduleID = req.body.moduleID;
  let featuresList = req.body.featuresList;
  let featuresIDList = req.body.featuresIDList;
  let userUUID = req.body.userUUID;
  let displayAlert = null;
  if(req.body.displayAlert != undefined){
    displayAlert = req.body.displayAlert;
  }

  /** setting default values for response and logging details */
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Submitted updated preference by the user";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID, moduleID, featuresList, featuresIDList, userUUID are required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    if(userID != undefined && moduleID != undefined && featuresIDList != undefined && userUUID != undefined){
      delCache('dsanalyticsapp:user:preference:'+ userID.toLowerCase() + ':' + moduleID);
      log.message = "delete query executed to remove rows of preference";
      queryParam.sqlQuery = "DELETE FROM "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Features_Xref WHERE User_UUID = @userUUID and Module_UUID = @moduleID";
      queryParam.columns[0]={name:'userUUID', type:sql.Int, value:userUUID}
      queryParam.columns[1]={name:'moduleID', type:sql.Int, value:moduleID}
      await sqlOP(queryParam, log);
      if(displayAlert == 0 || displayAlert == 1){
        log.message = "update query to update the display alert value";
        queryParam.sqlQuery = "UPDATE "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users SET displayAlert = @displayAlert WHERE user_coworker_id =@userID";
        queryParam.columns[0]={name:'userID', type:sql.VarChar, value:userID}
        queryParam.columns[1]={name:'displayAlert', type:sql.SmallInt, value:displayAlert}
        await sqlOP(queryParam, log);
      }
      queryParam.sqlQuery = '';
      queryParam.columns = [];
      log.message = "insert query executed to add row of preference";
      queryParam.table = new sql.Table(process.env.DB_Mosaic_Schema+'CDP_Admin_Users_Features_Xref');
      queryParam.table.create = false;
      queryParam.table.columns.add('User_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Feature_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Module_UUID', sql.Int, {nullable: true});
      queryParam.table.columns.add('Is_Active', sql.Int, {nullable: true});
      queryParam.table.columns.add('Widget_Row', sql.Int, {nullable: true});
      queryParam.table.columns.add('Widget_Column', sql.Int, {nullable: true});
      queryParam.table.columns.add('User_Feature_Xref_UUID', sql.Int, {nullable: false, identity: true});
      for (var i=0; i<featuresIDList.length; i++) {
        if(i<3){
          let column = i + 1;
          if(featuresIDList[i] > 0 && featuresList[i] != "")
            queryParam.table.rows.add(userUUID,featuresIDList[i],moduleID,1,1,column,1);
        }
        else{
          let column = i - 2;
          if(featuresIDList[i] > 0 && featuresList[i] != "")
            queryParam.table.rows.add(userUUID,featuresIDList[i],moduleID,1,2,column,1);
        }
      }
      response = await sqlOP(queryParam, log);
      queryParam.table = '';
      result.metadata.rows = response.result.rowsAffected;
      result.metadata.responseStatus = response.status;
      result.response = 'success';
    }
  }catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = 'failure';
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/Feedback:
 *  get:
 *    description: Feedback for the given user ID
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Feedback for the given user ID
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: userID
 *        type: string
 *        required: false
 *        description: unique identification of the user
 */
router.get('/feedback', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let coworkerID = req.query.userID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:feedback";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Feedback for the given user ID";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "with userID can filter feedback";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch feedback details";
    if(coworkerID != undefined){
      cacheKey = cacheKey + ":" + coworkerID.toLowerCase();
      queryParam.sqlQuery = "select top 5 f.Feedback_UUID, f.Feedback_Type as FeedbackType, f.Feedback_Text as FeedbackText, f.Feedback_Title as FeedbackTitle, f.Created_DateTime as FeedbackTime, u.User_First_Name + ' ' + u.User_Last_Name as CreatedBy from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Feedback as f with (nolock) JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users as u with (nolock) on u.User_CoWorker_ID = f.Created_By  where f.Created_By = @coworkerID order by Feedback_UUID desc";
      queryParam.columns[0]={name:'coworkerID', type:sql.VarChar, value:coworkerID};
    }
    else
      queryParam.sqlQuery = "select top 50 f.Feedback_UUID, f.Feedback_Type as FeedbackType, f.Feedback_Text as FeedbackText, f.Feedback_Title as FeedbackTitle, f.Created_DateTime as FeedbackTime, u.User_First_Name + ' ' + u.User_Last_Name as CreatedBy from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Feedback as f with (nolock) JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users as u with (nolock) on u.User_CoWorker_ID = f.Created_By order by Feedback_UUID desc";
    response = await sqlOP(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 *  /user/profile:
 *  get:
 *    description: User profile of given user ID
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: User profile for the given user ID
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: userID
 *        type: string
 *        required: true
 *        description: unique identification of the user
 */
router.get('/profile', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let coworkerID = req.query.userID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:profile";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "User profile for the given User ID";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID is required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch user profile details";
    if(coworkerID != undefined){
      cacheKey = cacheKey + ":" + coworkerID.toLowerCase();
      queryParam.sqlQuery = "SELECT p.User_UUID AS UserID, u.User_CoWorker_ID AS CoworkerID, p.profileSummary AS ProfileSummary, u.User_Email_Address as EmailAddress, r.Role_UUID as RoleID FROM "+process.env.DB_Mosaic_Schema+"cdp_smry_profile_json AS p with (nolock) JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users AS u with (nolock) ON p.User_UUID = u.User_UUID JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Roles_Xref AS r with (nolock) ON p.User_UUID = r.User_UUID WHERE u.User_CoWorker_ID = @coworkerID";
      queryParam.columns[0]={name:'coworkerID', type:sql.VarChar, value:coworkerID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/features:
 *  get:
 *    description: Features of application for the given Module
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Features of application for the given Module
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: moduleID
 *        type: integer
 *        required: true
 *        description: unique Indentification of Module
 */
router.get('/features', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let moduleID = req.query.moduleID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:features:";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Features List of application for the given Module";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "moduleID is required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch features list for a moduleID";
    if(moduleID != undefined){
      cacheKey = cacheKey + moduleID;
      queryParam.sqlQuery = "SELECT uf.Feature_UUID as FeatureID, uf.Feature_Name as Feature, uf.Feature_Icon_Name as FeatureIcon FROM "+process.env.DB_Mosaic_Schema+"CDP_Admin_Features AS uf with (nolock) JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Modules_Features_Xref AS mf with (nolock) ON mf.Feature_UUID = uf.Feature_UUID WHERE mf.Module_UUID = @module_ID";
      queryParam.columns[0]={name:'module_ID', type:sql.Int, value:moduleID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
      if(result.metadata.rows > 0)
        setCache(cacheKey, process.env.rediscachettl, result);
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 *  /user/user:
 *  get:
 *    description: Authenticated User details of given user ID
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Authenticated User details of given user ID
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: userID
 *        type: string
 *        required: true
 *        description: unique identification of the user
 */
router.get('/user', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let coworkerID = decodeURI(req.query.userID);
  
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:user";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Authenticated User details of given user ID";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID is required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch Authenticated User details of given user ID";
    if(coworkerID != 'undefined'){
      cacheKey = cacheKey + ":" + coworkerID.toLowerCase();
      let network = coworkerID.split('@');
      queryParam.sqlQuery = "select u.User_UUID as userUUID, u.User_CoWorker_ID as CoworkerID, u.User_First_Name as FirstName, u.User_Last_Name as LastName, u.User_Nick_Name as NickName, u.User_Title as Title, u.User_Email_Address as Email, u.User_Phone_Number as Phone, User_Mimic_Id as MimicUser from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users as u with (nolock)  where (u.User_Email_Address = @coworkerID OR u.User_NetworkUserID = @network) and u.Is_Active = 1";
      queryParam.columns[0]={name:'coworkerID', type:sql.VarChar, value:coworkerID}
      queryParam.columns[1]={name:'network', type:sql.VarChar, value:network[0]}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.sessionID = Math.random().toString(36).substr(2, 16);
      result.response = response.result.recordsets[0];
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/resetLayout:
 *  get:
 *    description: Reset to default layout for the given Module
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Reset to default layout for the given Module
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: moduleID
 *        type: integer
 *        required: true
 *        description: unique Indentification of Module
 *      - in: query
 *        name: roleID
 *        type: integer
 *        required: true
 *        description: unique Indentification of Role
 */
router.get('/resetLayout', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let moduleID = req.query.moduleID;
  let roleID = req.query.roleID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:resetlayout:";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Reset to default layout for the given Module";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "moduleID and RoleID are required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch default preference for given moduleID and roleID";
    if(moduleID != undefined && roleID != undefined){
      cacheKey = cacheKey + moduleID;
      queryParam.sqlQuery = "select rf.Role_UUID as RoleID, rf.Module_UUID as ModuleID, f.Feature_UUID as FeatureID, f.Feature_Name as Feature, f.Expandable as Expandable, rf.Widget_Row as WidgetRow, rf.Widget_Column as WidgetColumn, 0 as IsDefault, f.Feature_Icon_Name as FeatureIcon from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Roles_Features_Xref as rf with (nolock) join "+process.env.DB_Mosaic_Schema+"CDP_Admin_Features as f with (nolock) on rf.Feature_UUID = f.Feature_UUID where rf.Role_UUID = @roleID and rf.Module_UUID = @moduleID and rf.Is_Active = 1 and f.Is_Active = 1";
      queryParam.columns[0]={name:'moduleID', type:sql.Int, value:moduleID}
      queryParam.columns[1]={name:'roleID', type:sql.Int, value:roleID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 * /user/resetlayout:
 *  post:
 *    description: Reset to default layout for the given Module
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: Reset to default layout for the given Module
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: body
 *        name: layout
 *        description:
 *        schema:
 *          type: object
 *          required:
 *            - userID
 *            - userUUID
 *            - moduleID
 *          properties:
 *            userID:
 *              type: string
 *            userUUID:
 *              type: integer
 *            moduleID:
 *              type: integer
 */
router.post('/resetLayout', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let coworkerID = req.body.userID;
  let userUUID = req.body.userUUID;
  let moduleID = req.body.moduleID;

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:resetlayout:";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Reset default layout for the given Module for the user";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "moduleID, userID and userUUID are required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "removing the rows from user_features_xref table to give default layout";
    if(userUUID != undefined && coworkerID != undefined && moduleID != undefined){
      delCache('dsanalyticsapp:user:preference:'+ coworkerID.toLowerCase() + ':' + moduleID);
      cacheKey = cacheKey + moduleID;
      queryParam.sqlQuery = "DELETE FROM "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Features_Xref WHERE module_UUID = @moduleID and user_UUID = @userUUID";
      queryParam.columns[0]={name:'moduleID', type:sql.Int, value:moduleID}
      queryParam.columns[1]={name:'userUUID', type:sql.Int, value:userUUID}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.rowsAffected[0];
      result.metadata.responseStatus = response.status;
      result.response = "success";
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = "failure";
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
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
 *  /user/mapping:
 *  get:
 *    description: User details of given user ID for mapping details
 *    tags: [User]
 *    responses:
 *      '200':
 *        description: User details of given user ID for mapping details
 *  parameters:
 *      - in: header
 *        name: authorization
 *        type: string
 *        required: true
 *        description: API Key for authentication
 *      - in: query
 *        name: userID
 *        type: string
 *        required: true
 *        description: unique identification of the user
 */
router.get('/mapping', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  let coworkerID = decodeURI(req.query.userID);

  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:user:mapping";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "User details of given user ID for mapping details";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "userID is required";
  result.response = log.message;
  queryParam.table = '';
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try{
    log.message = "Select query executed to fetch mapping details of given user ID";
    if(coworkerID != 'undefined'){
      cacheKey = cacheKey + ":" + coworkerID.toLowerCase();
      let network = coworkerID.split('@');
      queryParam.sqlQuery = "select u.User_UUID as userUUID, u.User_CoWorker_ID as CoworkerID, r.Role_UUID as RoleID, u.User_First_Name as FirstName, u.User_Last_Name as LastName, u.User_Nick_Name as NickName, u.User_Title as Title, u.User_Email_Address as Email, u.User_Phone_Number as Phone, User_Mimic_Id as MimicUser from "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users as u with (nolock) JOIN "+process.env.DB_Mosaic_Schema+"CDP_Admin_Users_Roles_XREF as r with (nolock) on u.User_UUID = r.User_UUID where (u.User_Email_Address = @coworkerID OR u.User_NetworkUserID = @network)";
      queryParam.columns[0]={name:'coworkerID', type:sql.VarChar, value:coworkerID}
      queryParam.columns[1]={name:'network', type:sql.VarChar, value:network[0]}
      response = await sqlOP(queryParam, log);
      result.metadata.rows = response.result.recordsets[0].length;
      result.metadata.responseStatus = response.status;
      result.response = response.result.recordsets[0];
      //if(result.metadata.rows > 0)
        //setCache(cacheKey, process.env.rediscachettl, result);
    }
  }catch(err){
    result.metadata.responseStatus = response.status;
    result.response = response.result;
    //res.render('error', {pageTitle: 'Customer Mosiac API', status: err.status || 500, message: err.message});
    log.error = err;
  }finally{
    if(response.log === undefined)
      logger(log);
    else
      logger(response.log);

    result.metadata.responseTime = now() - startTime;
    res.status(response.status || result.metadata.responseStatus);
    res.json(result);
  }
});

module.exports = router;