var atob = require('atob');
const request = require('request')
const {logInfo, logger} = require('../modules/component');

module.exports.getToken = async function() {
    const url = "https://stsbeta.corp.cdw.com/V3.1/DomainIdentityService/connect/token";
    const data = JSON.stringify(await buildRequestBody());
    const  headers = {
            'rejectUnauthorized': false,
            'Content-Type': 'application/x-www-form-urlencoded'
        }

    request.post(
        url,
        data,
        (error, res, body) => {
          if (error) {
            console.error(error)
            return
          }
          //console.log(`statusCode: ${res.statusCode}`)
          //console.log(body)
        }
      )

    /*const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`);
      
        res.on('data', d => {
          console.log(d);
        })
    })
    req.on('error', error => {
    console.log(error)
    })
    req.write(body);
    req.end();*/
}

buildRequestBody = async function(){
    let data =
    {
      client_id: "DsAilabsClientId",
      grant_type: "implicit",
      scope: "http://ds.corp.cdw.com/service/customerprofile"
    };

    var body = await toUrlEncodedString(data);
    return body;
}

toUrlEncodedString = async function(data) {
    var body = "";
    for (var key in data) {
      if (body.length) {
        body += "&";
      }
      body += key + "=";
      body += encodeURIComponent(data[key]);
    }
    return body;
}


decodeJwtToken = async function(token){//
    var parts = token.split('.');
    if (parts.length !== 3) {
      return false;
      //throw new Error('JWT must have 3 parts');
    }
    var decoded = await urlBase64Decode(parts[1]);
    if (!decoded) {
      return false;
      //throw new Error('Cannot decode the token');
    }
    var userid = '';
    try{
      userid = await getUserIdFromToken(JSON.parse(decoded));
    }catch(err){
      var log = logInfo;
      log.user = '';
      log.sessionID = '';
      log.ip = req.connection.remoteAddress;
      log.message = "invalid Authorization key sent";
      logger(log);
    }finally{
      return userid;
    }
  }

urlBase64Decode = async function(str) {
    var output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0: { break; }
        case 2: { output += '=='; break; }
        case 3: { output += '='; break; }
        default: {
        throw 'Illegal base64url string!';
        }
    }
    return decodeURIComponent(encodeURI(atob(output)));
}

getUserIdFromToken = async function(parsedToken){
    let userId = await getUserFromNetworkName(parsedToken.name);
    return userId;
}


getUserFromNetworkName = async function(networkName){
    if (!networkName.includes('\\')) {
      return networkName;
    }
    let items = networkName.split('\\');
    if (items.length == 2) {
      return items[1];
    }
    return networkName;
}

module.exports.decodeJwtToken = decodeJwtToken;