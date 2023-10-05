const sql = require('mssql');
const winston = require('./winston');
require('dotenv').config();

const configforread = {
    // user: "MDRCPRW",
    // password: "wn2Vz1tlvZjxsoJDpZsWINMC4KsWdj6wgzEL52xy_MDRCPRW",
    // server: "EDSSQLPDVHIL01",
    // database: "MDRRPTDB",
    user:  process.env.DB_USER_READ,
    password: process.env.DB_EVAL_READ,
    server: process.env.DB_SERVER_READ,
    database: process.env.DB_READ_FOR_AMANDA,
    requestTimeout: 300000,
    pool: {
      max: parseInt(process.env.DB_MAX_CONNECTIONS),
      min: parseInt(process.env.DB_MIN_CONNECTIONS),
      idleTimeoutMillis: parseInt(process.env.DB_IDLETIMEOUT)
    },
    options: {
      encrypt: true,
      enableArithAbort: true
    }
  }
  
  let amandaconnection;
  try{
    const poolPromise = new sql.ConnectionPool(configforread)
    amandaconnection = poolPromise.connect().catch(err=> {winston.error(`${err.status || 500} - ${err.message} `);});
    winston.info(`DB AMANDA connection established`);
  }catch(err){
    if(process.env.NODE_ENV === 'local')
      console.log(err.message);
    winston.error(`${err.status || 500} - ${err.message} `);
  }

  module.exports = {
    amandaconnection
  }