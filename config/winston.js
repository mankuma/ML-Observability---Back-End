const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const timezoned = () => {
  return new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago'
  });
}

const logFormat = winston.format.combine(
 winston.format.timestamp({ format: timezoned }),
 winston.format.printf((info) =>  `${info.level} : ${info.timestamp} - ${info.message}`)
 );

const transport = [new DailyRotateFile({
  filename: "../DSLogs/info-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "200m",
  maxFiles: "30d",
  prepend: true,
  level: "info"
}), new (DailyRotateFile)({
  filename: "../DSLogs/error-%DATE%.log",
  level: 'error',
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  zippedArchive: true,
  maxSize: "200m",
  prepend: true
})]

// transport.on("rotate", function (oldFilename, newFilename) {
//   // call function like upload to s3 or on cloud
// });

const logger = winston.createLogger({
  format: logFormat,
  handleExceptions: true,
  colorize: false,
  transports: transport
});

module.exports = logger;