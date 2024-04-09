const dbMng = require('../config/dbInfo');
const logger = require("../logger/logger");
/**
 *  @constant AuthException
 *  @type {array}
 *  @description  인증이 필요없는 API 정의
 */
const authExcet = async() => {
  let authExcetRet = '';  
  try {    
    let params = {"USE_YN": "Y"};
    let except = await dbMng.select("authMapper", 'getAuthExceptList', params);    
    authExcetRet = except;
  } catch (error) {
    logger.debug(`AuthExcept.js AuthExcet == ERROR == ${error.message}`);
  }
  return authExcetRet;
}


module.exports = {
  authExcet,
};