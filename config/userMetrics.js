const sql = require('mssql');
const winston = require('./winston');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_EVAL,
  server: process.env.DB_SERVER_METRICS,
  database: process.env.DB_Mosaic,
  requestTimeout: 300000,
  pool: {
    max: parseInt(process.env.DB_MAX_METRICS),
    min: parseInt(process.env.DB_MIN_METRICS),
    idleTimeoutMillis: parseInt(process.env.DB_IDLETIMEOUT)
  },
  options: {
    encrypt: true,
    enableArithAbort: true
  }
}

let metricsPool;
try{
  const poolPromise = new sql.ConnectionPool(config)
  metricsPool = poolPromise.connect();
  winston.info(`User Metrics DB connection established`);
}catch(err){
  if(process.env.NODE_ENV === 'local')
    console.log(err.message);
  winston.error(`${err.status || 500} - ${err.message} `);
}


module.exports = {
    metricsPool
}