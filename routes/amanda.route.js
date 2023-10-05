const express = require('express');
const router = express.Router();
const { logInfo, sql, queryParam, sqlOP, sqlOPforAmanda, logger, apiResponse } = require('../modules/component');
const { setCache, delCache } = require('../config/cache');
const now = require("performance-now");
const Table = require('mssql/lib/table');

router.get('/getMonthWiseReport', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:getMonthWiseReport";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select month(cartcreationdate) as monthnumber,left(datename(month,cartcreationdate),3) as [month] ,year(cartcreationdate) as Year,count(case when orders_ibmiordernumber is null then cartid end) as ordernotcoverted,count(case when orders_ibmiordernumber is not null then cartid end) as ordernotcoverted,count(cartid) as totalcart from ods_amanda_sps_carts_items_ordersquotes_fact  where year(cartcreationdate) = 2023 group by month(cartcreationdate),left(datename(month,cartcreationdate),3),year(cartcreationdate) order by month(cartcreationdate) ASC";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

router.get('/YTDreports', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:YTDreports";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select year(cartcreationdate) as Year,sum(CAST(cartinitialvalue as float)) as cartvalue ,count(cartid) as totalcart  from ods_amanda_sps_carts_items_ordersquotes_fact   where year(cartcreationdate) in (2023,2022) and orders_ibmiordernumber is not null group by year(cartcreationdate) ";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

router.get('/getMonthWiseTotalCart', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:getMonthWiseReport";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select month(cartcreationdate) as monthnumber, left(datename(month,cartcreationdate),3) as [month] ,year(cartcreationdate) as Year, count(cartid) as totalcart, sum(CAST(cartinitialvalue AS float))/count(cartid) as totalavg from ods_amanda_sps_carts_items_ordersquotes_fact  where year(cartcreationdate) = 2023 group by month(cartcreationdate),left(datename(month,cartcreationdate),3),year(cartcreationdate) order by month(cartcreationdate) ASC";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

router.get('/getMonthWiseOrderNotConverted', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:getMonthWiseReport";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select month(cartcreationdate) as monthnumber, left(datename(month,cartcreationdate),3) as [month] , year(cartcreationdate) as Year, count(cartid) as ordernotcoverted,sum(CAST(cartinitialvalue AS float))/count(cartid)  as ordernotconvertedavg from ods_amanda_sps_carts_items_ordersquotes_fact  where year(cartcreationdate) = 2023 and orders_ibmiordernumber is null group by month(cartcreationdate),left(datename(month,cartcreationdate),3),year(cartcreationdate) order by month(cartcreationdate) ASC";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

router.get('/getMonthWiseOrderConverted', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:getMonthWiseReport";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select month(cartcreationdate) as monthnumber,left(datename(month,cartcreationdate),3) as [month] , year(cartcreationdate) as Year,count(cartid) as ordercoverted,sum(CAST(cartinitialvalue AS float))/count(cartid)  as orderconvertedavg from ods_amanda_sps_carts_items_ordersquotes_fact where year(cartcreationdate) = 2023 and orders_ibmiordernumber is not null group by month(cartcreationdate),left(datename(month,cartcreationdate),3),year(cartcreationdate) order by month(cartcreationdate) ASC";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

router.get('/getMonthWiseOrderCancel', async (req, res) => {
  let startTime = now();
  /** read query parameters */
  /** setting default values for cachekey, response and logging details */
  let cacheKey = "dsanalyticsapp:amanda:getMonthWiseReport";
  let response = "";
  let result = apiResponse;
  result.metadata.about = "Year Wise Amanda Report";
  result.metadata.rows = 0;
  var log = logInfo;
  log.user = req.headers.useruuid;
  log.sessionID = req.headers.sessionid;
  log.ip = req.ip;
  log.message = "Authorization is required";
  result.response = log.message;
  queryParam.table = '';
  queryParam.columns = [];
  result.metadata.responseStatus = 400;
  /** execute the query and logging the details to user logs */
  try {
    log.message = "Select query executed to fetch the amnada details";
    queryParam.sqlQuery = "select month(cartcreationdate) as monthnumber,left(datename(month,cartcreationdate),3) as [month] , year(cartcreationdate) as Year,count(cartid) as cancelorders,sum(CAST(cartinitialvalue AS float))/count(cartid)  as ordercanceledavg from ods_amanda_sps_carts_items_ordersquotes_fact where year(cartcreationdate) = 2023 and ibmistatus='CANCELED' group by month(cartcreationdate),left(datename(month,cartcreationdate),3),year(cartcreationdate) order by month(cartcreationdate) ASC";
    response = await sqlOPforAmanda(queryParam, log);
    result.metadata.rows = response.result.recordsets[0].length;
    result.metadata.responseStatus = response.status;
    result.response = response.result.recordsets[0];

  } catch (err) {
    result.metadata.responseStatus = response.status;
    result.response = response.result;
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

module.exports = router;