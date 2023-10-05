const email_trigger = require('../utils/email_trigger');
const { logInfo, queryParam, sql, sqlOP } = require('../modules/component');
const winston = require('../config/winston');
module.exports = {
    newAccess: async () => {
        winston.info('Crone Job Started' + new Date());
        var log = logInfo;
        log.message = "Crone job for sending acess request emails"; /* Getting email id's which are newly loaded to Admin User table detected with IsMail = 0 as new */
        queryParam.sqlQuery = "select distinct User_Email_Address AS email, User_First_Name AS firstName, User_Last_Name AS lastName from " + process.env.DB_Mosaic_Schema + "CDP_Admin_Users where IsMail = 0 and Is_Active = 1 and User_Email_Address is not null"
        response = await sqlOP(queryParam, log);
        if (response.result.recordsets[0].length > 0) {
            response.result.recordsets[0].forEach(async (el) => {
                await TemplateBuilder({ "to": [el.email] }, {"user_name": el.firstName + " " +el.lastName}, email_trigger["accept"]) /* Sending welcome emails */
                    .then(async (res) => {
                        if (!!res) {
                            winston.info('email-triggered-accept, email-mailer' + el.email);
                            log.message = "Crone job to make isMail column to 1"; /* Updating Ismail to 1 after successful email trigger */
                            queryParam.sqlQuery = "Update " + process.env.DB_Mosaic_Schema + "CDP_Admin_Users SET IsMail = 1 where IsMail = 0 and Is_Active = 1 and User_Email_Address = @mail"
                            queryParam.columns[0]={name:'mail', type:sql.VarChar, value:el.email}
                            let result = await sqlOP(queryParam, log);
                            if(!!result.log) logger(result.log);
                        }
                    })
                    .catch(err => {
                        winston.error('error-email-triggered-accept, email-mailer' + el.email+ ' message-' + err);
                    });
            });
        }
    }
}