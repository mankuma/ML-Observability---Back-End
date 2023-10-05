const winston = require('./winston');
require('dotenv').config();
const nodemailer = require("nodemailer");
var transporter;

if (process.env.NODE_ENV !== "local") {
    //create connection
    transporter = nodemailer.createTransport({
        host: "messaging.cdw.com",
        port: 25,
        secure: false,
        pool: true,
        maxConnections: 3, //maxconnection are limited to 3 for our service account
        auth: {
            user: process.env.email
        }
    })

    // verify connection configuration
    transporter.verify(function (error, success) {
        if (error) {
            winston.error(`SMTP connection error - ${error}`);
        } else {
            winston.info(`SMTP connection established`);
        }
    });
}else{
    winston.info(`Email functionality is disabled as this is local environment`);
}

module.exports = {
    transporter
}