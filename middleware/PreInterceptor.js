/**
 *  선처리 interceptor
 *  module       middleware/PreInterceptor
 *  author       jhr
 *  version      1.0 
 *  날짜          작업 내용
 * -----------------------------------------------------
 *  2023-05-02   최종 생성
 */

/** 인증 예외  API     */
const { authExcet } = require('../common/authException');
const COMMON = require('../common/common');
const logger = require('../logger/logger');
const {StatusCodes}           = require("http-status-codes");
const CustomError = require('../errors/CustomError');
const { getPayload } = require('../jwt/jwt');
const {DATA_FIELD_NAME}       = require("../common/Constant");
const {RESPONSE_FIELD}        = require("../common/ResponseConst");

const { getUserRole } = require('../src/user/User');

const jwtInfo = require('../config/jwtInfo');


const PreInterceptor = async(req, res, next) =>{    
  // /** swagger  */
  // if(req.originalUrl.startsWith("/api-docs")) {
  //   return next();
  // }
  
  console.log(`[개발환경] - ${process.env.SYSTEM}`);
  
  /** 인증 예외  API 를 확인, method 와 요청 URL 체크 */
  let authExcept = await authExcet();  
  if (authExcept.some(api => req.method === api.EXCEPT_METHOD && req.originalUrl === api.EXCEPT_URL)) {
    return next();
  }

  /** 토큰 체크  */
  //const responseData = getPayload(req);

  /** 토큰 체크  */
  const responseData = getPayload(req);

  /** 인증 체크에 성공하였을 때 데이터 셋탕하고 다음 단계  */
  if (responseData.getResponseCode() === StatusCodes.OK) {
    
    const payload = responseData.getDataValue(DATA_FIELD_NAME.PAYLOAD);

    // jwt decode 값을 request 객체에 보관
    req[DATA_FIELD_NAME.PAYLOAD] = payload;

    return next();

  } else {
    /** 토큰 체크  */
    /** 에러 응답 */
    const data = responseData.getData();

    if(data.hasOwnProperty(RESPONSE_FIELD.CODE)){
      res.status(data[RESPONSE_FIELD.CODE]);
      delete data[RESPONSE_FIELD.CODE];
    }

    res.send(data);  
  }
}

module.exports = PreInterceptor;

