const CustomError = require('../errors/CustomError');
const key = require('../config/encryptKeyInfo.json');
const logger = require('../logger/logger');
const crypto = require('crypto');
const util = require('./util');
const { isNull, getDateFormat } = require('./util');
exports.initResponse = function (req_data) {
  let res_data = {};

  // res_data.code = ERROR.getErrorCd("SUCCESS");
  // res_data.message = ERROR.getErrorMsg("SUCCESS");

  // if (req_data.hasOwnProperty("token")) {
  //   res_data.token = { accessToken: req_data.token.accessToken };
  //   if (!util.isEmpty(req_data.token.refreshToken)) {
  //     res_data.token = { refreshToken: req_data.token.refreshToken };
  //   }
  // }

  return res_data;
};

/* req data */
exports.initRequest = function (req) {
  let req_data = {};

  let body = req.body;
  if (!body) {
    throw new CustomError("요청데이터가 비었습니다.", 401);
  } else {
    req_data = body;    
  }

  return req_data;
};




/**
 * 파라미터 추출
 * @param {*} req_data
 * @returns
 */
exports.getasdParams = function (req) {
  let req_data = {};
  let body = req.body;  
  if (!body) {
    req_data = "";
  } else {
    //req_data = jsonKeyConversion(body, conversion);
    req_data = body;
    logger.info(`getParams : ${JSON.stringify(req_data)}`);
  }

  return req_data;
};

/**
 * 파라미터 추출
 * @param {*} req_data
 * @returns
 */
exports.getParams = function (requestData) {
  let req_data = {};
  let body = requestData.body;
  let payload = requestData.hasOwnProperty("paylaod");
  
  if( !payload ) {
    if( util.nullToStr(requestData.payload.userID) !== '' ) {
      body["USER_ID"] = requestData.payload.userID;
    } 
    
    if( util.nullToStr(requestData.payload.manageCd) !== '' ) {
      body["MANAGE_CD"] = requestData.payload.manageCd;
    }
  } 
  if (!body) {
    req_data = {};
  } else {
    //req_data = jsonKeyConversion(body, conversion);
    req_data = body;
    logger.info(`getParams : ${JSON.stringify(req_data)}`);
  }

  return req_data;
};

/**
 * 
 * @param {*} obj obj
 * @param {*} fromObj user id
 * @returns 작성자, 수정자에 user id
 */
exports.setRegUser = (obj, fromObj) => {
  let reg_user = "SYSTEM";

  if( fromObj ) {
    reg_user = fromObj.getUserID();
  }
  
  obj["ID_REG_USER"] = reg_user;
  obj["ID_MOD_USER"] = reg_user;

  return obj;
};

/**
   * targetObj에 fieldList의 key가 포함되어 있는지 확인
   * @param {Array<string>} fieldList 필드 이름 배열
   * @param {Array<string>} targetObj object
   * @returns {boolean} 누락된 필드가 있으면 `false`
   */
exports.hasFieldCheck = async(fieldList, targetObj) => {
  let result = true;
  fieldList.forEach(fieldName => {
    if (result)
      result = result && (util.findProp(targetObj, fieldName) != '');
  });
  return result;
}

/**
 * 
 * @param {*} fieldList 필드 이름 배열
 * @param {*} targetObj object
 * @returns object 
 */
exports.setDefaultValue = async(fieldList, targetObj) => {
  let DefaultValue = "0000-00-00";  

  fieldList.forEach(fieldName => {
    if( isNull(targetObj[fieldName]) ){
      targetObj[fieldName] = DefaultValue;
    } else {
      targetObj[fieldName] = getDateFormat(targetObj[fieldName], 'y-m-d');
    }
  });

  return targetObj;
};

/* 스크래핑 계정 패스워드 암호화 */
exports.encrypt = function encrypt(encryptText) {	
	if(!encryptText) return encryptText;
	if(encryptText.trim().length == 0) return encryptText;
	let cipher = crypto.createCipher('aes-256-cbc', key["scrapEncryptKey"]);
	encryptText = cipher.update(encryptText, 'utf8','base64');
	encryptText += cipher.final('base64');
	return encryptText;
}

/* 스크래핑 계정 패스워드 복호화 */
exports.decrypt = function decrypt(encryptedText) {
	if(encryptedText==null){return encryptedText;}
	if(encryptedText.trim().length == 0) return encryptedText;
	
	if(encryptedText==''){
		decryptedText='';
	}
	else{
		let decipher = crypto.createDecipher('aes-256-cbc', key["scrapEncryptKey"]);
		decryptedText = decipher.update(encryptedText, 'base64', 'utf8');
		decryptedText += decipher.final('utf8'); 
	}
	return decryptedText;
};

/* 사용자 비밀번호 암호화(단방향) */
exports.sha_encrypt = function sha_encrypt(encryptText) {  
  if (encryptText == null) {
    return encryptText;
  }
  if (encryptText.trim().length == 0) return encryptText;
  encryptText = crypto
    .createHmac("sha256", key['encryptKey'])
    .update(encryptText)
    .digest("hex");
  return encryptText;
};






