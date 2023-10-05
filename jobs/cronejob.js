var createError = require('http-errors');
var express = require('express');
const cron = require("node-cron");
require('dotenv').config();
var app = express();

var { newAccess } = require('./jobController');

var everyDayEvent = () => {
  newAccess(); /* Send email to users whose created time is in today's date */
};

module.exports.initJobs = () => {
  const scheduledJob = cron.schedule("0 0 6,23 * * *", everyDayEvent); // run every day at 6AM and 11PM PM CST
  //scheduledJob.start();
}