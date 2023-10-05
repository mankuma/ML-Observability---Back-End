const sql = require('mssql');
const winston = require('./winston');
require('dotenv').config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_EVAL,
  server: process.env.DB_SERVER,
  database: process.env.DB_Mosaic,
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

// const configlocalrptdb = {
//   user: process.env.DB_USER,
//   password: process.env.DB_EVAL,
//   server: process.env.DB_SERVER,
//   database: "MDRRPTDB",
//   requestTimeout: 300000,
//   pool: {
//     max: parseInt(process.env.DB_MAX_CONNECTIONS),
//     min: parseInt(process.env.DB_MIN_CONNECTIONS),
//     idleTimeoutMillis: parseInt(process.env.DB_IDLETIMEOUT)
//   },
//   options: {
//     encrypt: true,
//     enableArithAbort: true
//   }
// }

// const configforread = {
//   user: process.env.DB_USER_READ,
//   password: process.env.DB_EVAL_READ,
//   server: process.env.DB_SERVER_READ,
//   database: process.env.DB_READ_FOR_AMANDA,
//   requestTimeout: 300000,
//   pool: {
//     max: parseInt(process.env.DB_MAX_CONNECTIONS),
//     min: parseInt(process.env.DB_MIN_CONNECTIONS),
//     idleTimeoutMillis: parseInt(process.env.DB_IDLETIMEOUT)
//   },
//   options: {
//     encrypt: true,
//     enableArithAbort: true
//   }
// }

let poolConnect;
try{
  const poolPromise = new sql.ConnectionPool(config)
  poolConnect = poolPromise.connect().catch(err=> {winston.error(`${err.status || 500} - ${err.message} `);});
  winston.info(`DB connection established`);
}catch(err){
  if(process.env.NODE_ENV === 'local')
    console.log(err.message);
  winston.error(`${err.status || 500} - ${err.message} `);
}

// let poolConnectread;
// try{
//   const poolPromise = new sql.ConnectionPool(configlocalrptdb)
//   poolConnectread = poolPromise.connect().catch(err=> {winston.error(`${err.status || 500} - ${err.message} `);});
//   winston.info(`DB AMANDA connection established`);
// }catch(err){
//   if(process.env.NODE_ENV === 'local')
//     console.log(err.message);
//   winston.error(`${err.status || 500} - ${err.message} `);
// }


module.exports = {
  poolConnect
}