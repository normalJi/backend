const winston = require('winston')
const WinstonDaily = require('winston-daily-rotate-file')
const path = require('path')

const { combine, timestamp, printf, colorize } = winston.format

const logDir = 'logs'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
}
winston.addColors(colors)

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'http'
}

// Log Format
const logFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  printf((info) => {
    if (info.stack) {
      return `${info.timestamp} ${info.level}: ${info.message} \n Error Stack: ${info.stack}`
    }
    return `${info.timestamp} ${info.level}: ${info.message}`
  })
)

// 콘솔에 찍힐 때는 색깔을 구변해서 로깅해주자.
const consoleOpts = {
  handleExceptions: true,
  level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  format: combine(
    colorize({ all: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' })
  )
}

const transports = [
  // 콘솔로그찍을 때만 색넣자.
  new winston.transports.Console(consoleOpts),
  // error 레벨 로그를 저장할 파일 설정
  new WinstonDaily({
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    dirname: path.join(__dirname, logDir, '/error'),
    filename: '%DATE%.error.log',
    maxFiles: 30,
    zippedArchive: true
  }),
  // 모든 레벨 로그를 저장할 파일 설정
  new WinstonDaily({
    level: 'debug',
    datePattern: 'YYYY-MM-DD',
    dirname: path.join(__dirname, logDir, '/all'),
    filename: '%DATE%.all.log',
    maxFiles: 7,
    zippedArchive: true
  })
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports
})

module.exports = Logger


// const winston = require("winston");
// const winstonDaily = require("winston-daily-rotate-file");

// const levels = {
//     error: 0,
//     warn: 1,
//     info: 2,
//     http: 3,
//     debug: 4
//   }
  
//   const colors = {
//     error: 'red',
//     warn: 'yellow',
//     info: 'green',
//     http: 'magenta',
//     debug: 'blue'
//   }
//   winston.addColors(colors)

// let alignColorsAndTime = winston.format.combine(
//     winston.format.colorize({
//         all: true,
//     }),
//     winston.format.label({
//         label: "[LOGGER]",
//     }),
//     winston.format.timestamp({
//         format: "YYYY-MM-DD HH:MM:SS",
//     }),
//     // winston.format.printf((info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`)
//     winston.format.printf((info) => `[${info.timestamp}] | [${info.level}] | ${info.message}`)
// );

// let notalignColorsAndTime = winston.format.combine(
//     winston.format.label({
//         label: "[LOGGER]",
//     }),
//     winston.format.timestamp({
//         format: "YYYY-MM-DD HH:MM:SS",
//     }),
//     winston.format.printf((info) => `[${info.timestamp}] | [${info.level}] | ${info.message}`)
// );

// const msgLog = winston.createLogger({
//     //level: "debug",
//     transports: [
//         new winstonDaily({
//             filename: "logs/syslog_%DATE%.log",
//             zippedArchive: true,
//             format: winston.format.combine(notalignColorsAndTime),
//         }),
        
//         new winston.transports.Console({
//             format: winston.format.combine(winston.format.colorize(), consoleOpts),
//         }),
//     ],
// });

// const errLog = winston.createLogger({
//     //level: "debug",
//     transports: [
//         new winstonDaily({
//             filename: "logs/errlog_%DATE%.log",
//             zippedArchive: true,
//             format: winston.format.combine(notalignColorsAndTime),
//         }),

//         new winston.transports.Console({
//             format: winston.format.combine(winston.format.colorize(), consoleOpts),
//         }),
//     ],
// });

// const msg = (msg) => {    
// 	msgLog.info(msg);
// };
// exports.msg = msg;

// const error = (msg, e) => {
// 	//sysLog.error(msg);
//     errLog.error(msg);
//     if(e){
//         //sysLog.error(e.message);
//         //sysLog.error(e.stack);
//         errLog.error(e.message);
//         errLog.error(e.stack);
//     }
// };
// exports.error = error;

// //module.exports = logger;