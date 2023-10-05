var auth = require(__dirname +'/authentication.js');
//var config = require(__dirname + '/config.json');
var utils = require(__dirname + '/utils.js');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

getReport = async function() {
    // validate configuration info
    res = utils.validateConfig();
    if(res){
       //console.log("error: "  + res);
       return;
    }

    // get aad token to use for sending api requests
    tokenResponse = await auth.getAuthenticationToken();
    if(('' + tokenResponse).indexOf('Error') > -1){
        //console.log('' + tokenResponse);
        return;
    }
    
    var token = tokenResponse.accessToken;
    //console.log("Returned accessToken: " + token);

    // create reqest for GetReport api call
    var requestParams = utils.createGetReportRequestParams(token)
    // get the requested report from the requested api workspace.
    // if report not specified - returns the first report in the workspace.
    // the request's results will be printed to console.
    return await utils.sendGetReportRequestAsync(requestParams.url, requestParams.options);
}

generateEmbedToken = async function (reportID){
    // validate configuration info
    res = utils.validateConfig();
    if(res){
       //console.log("error: "  + res);
       return;
    }

    // get aad token to use for sending api requests
    tokenResponse = await auth.getAuthenticationToken();
    if(('' + tokenResponse).indexOf('Error') > -1){
       //console.log('' + tokenResponse);
        return;
    }
    
    var token = tokenResponse.accessToken;
    var authHeader = utils.getAuthHeader(token);

    // get report id to use in GenerateEmbedToken requestd
    var reportId = reportID;
    if(!reportId){
       return;
    }

    var headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',        
    };

    var options = {
            headers: headers,
            method: 'POST',
            body: JSON.stringify({"accessLevel": "View"})
    };

    var url = process.env.apiUrl + 'v1.0/myorg/groups/' + process.env.workspaceId + '/reports/' + reportId + '/GenerateToken';

    // generate powerbi embed token to use for embed report.
    // the returned token will be printed to console.
    return await utils.sendGenerateEmbedTokenRequestAsync(url, options);
}

generateEmbedTokenWithRls = async function (reportID, username, roles){
    // validate configuration info
    res = utils.validateConfig();
    if(res){
       //console.log("error: "  + res);
       return;
    }

    // get aad token to use for sending api requests
    tokenResponse = await auth.getAuthenticationToken();
    if(('' + tokenResponse).indexOf('Error') > -1){
        //console.log('Authenticate Token' + tokenResponse);
        return;
    }
    
    var token = tokenResponse.accessToken;
    var authHeader = utils.getAuthHeader(token);

    // getting report id to use in GenerateEmbedToken requestd
    var reportParams = utils.createGetReportRequestParams(token, reportID);
    reportResp = await utils.sendGetReportRequestAsync(reportParams.url, reportParams.options);
    var reportId = reportResp.id;

    //getting dataset for effective identity
    var datasetId = reportResp.datasetId;
    var datasetResp = await utils.sendGetDatasetRequestAsync(token, datasetId);

    if(!datasetResp.isEffectiveIdentityRequired){
        //console.log("error: the given dataset doesn't support rls");
        return;
    }

    // creating effective identity
    var identities = [
        {
            'username' : username,
            'roles' : [roles],
            'datasets' : [datasetId]
        }
    ];

    var body = {
        "accessLevel": "View",
        "identities": identities
    }

    var headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',       
    };

    var options = {
            headers: headers,
            method: 'POST',
            body: JSON.stringify(body)
    };

    var url = process.env.apiUrl + 'v1.0/myorg/groups/' + process.env.workspaceId + '/reports/' + reportId + '/GenerateToken';

    // generate powerbi embed token, with the specified effective identity, to use for embed report.
    // the returned token will be printed to console.
    return await utils.sendGenerateEmbedTokenRequestAsync(url, options);
}

module.exports.getReport = getReport;
module.exports.generateEmbedToken = generateEmbedToken;
module.exports.generateEmbedTokenWithRls = generateEmbedTokenWithRls;
