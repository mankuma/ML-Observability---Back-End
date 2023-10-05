const redis = require('redis');
const {generateErrorLog, logInfo} = require('../modules/component');
const {user, sessionID} = require('../init');
const { data } = require('./winston');

//redis confirguration and connecting to server
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_SERVER  = process.env.REDIS_SERVER || '127.0.0.1';
const REDIS_EVAL = process.env.REDIS_EVAL || '';
const REDIS_USER = process.env.REDIS_USER || '';

var client = '';

if(process.env.redis_cache === 'true' || process.env.redis_cache === 'undefined'){
  client = redis.createClient({port:REDIS_PORT, host:REDIS_SERVER, no_ready_check: true});
  client['auth'] = null;
  client.send_command('AUTH', [REDIS_USER, REDIS_EVAL]);
  client.set('redisdb', 0);

  //redis connection error logging to logs
  client.on('error', function(err){
    process.env.redis_cache = false;
    if(process.env.NODE_ENV === 'local')
      console.log(err.message);
    generateErrorLog(logInfo, user, sessionID, err.status, err.message, 'Redis server connection failed', 'redis.createClient', '{}', '::1');
  });
}

setCache = async function(key, ttl, value){
  if(process.env.redis_cache === 'true' || process.env.redis_cache === 'undefined')
    client.setex(key, ttl, JSON.stringify(value));
}

delCache = async function(key){
  if(process.env.redis_cache === 'true' || process.env.redis_cache === 'undefined')
    client.del(key, function(err, response){
      if(err){
        generateErrorLog(logInfo, user, sessionID, err.status, err.message, 'Redis server delete key failed', 'delCache', key, '::1');
      }
    });
}

getCache = async function(key){
  if(process.env.redis_cache === 'true' || process.env.redis_cache === 'undefined')
    client.get(key, (err, data) => {
      if (err){
        return err;
      }
      return data;
    });
}

module.exports.setCache = setCache;
module.exports.client = client;
module.exports.delCache = delCache;
module.exports.getCache = getCache;