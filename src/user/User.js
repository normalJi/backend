const dbMng = require('../../config/dbInfo');
const logger = require("../../logger/logger");
const common = require('../../common/common')
const CustomError = require('../../errors/CustomError');
const Util = require('../../common/util');
const JWT = require('../../jwt/jwt');
const jwt2 = require('jsonwebtoken');
// jwt에 사용할 토큰 object
const PayloadData = require('../../common/PayloadData');

const RequestData = require('../../common/RequestData');
const ResponseData = require('../../common/ResponseData');

const { RESPONSE_CODE, RESPONSE_FIELD } = require('../../common/ResponseConst');

const jwtInfo = require('../../config/jwtInfo');
/**
 * 로그인
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const login = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);

    /** 필수 입력 필드 체크 */
    const fieldList = [
      'USER_ID',
      'USER_PASS',      
    ];

    if( !requestData.hasAllMandatoryFields(fieldList) ) {
      // 필수 입력항목 체크
      return responseData.setResponseCode(RESPONSE_CODE.REQUIRED_FIELD);
    }

    let userInfo = await dbMng.single("userMapper", 'checkUserAccout', params);   

    /**  사용자 정보가 없는 경우  */
    if (userInfo == null) {
      return responseData.setResponseCode(RESPONSE_CODE.WRONG_ACCOUNT);
    }       

    /** 비밀번호 체크 */    
    const dbPassword  = userInfo['USER_PASS'];    

    /** 입력 받은 비밀번호 암호화 */
    let password = await common.sha_encrypt(params.USER_PASS);

    /** 비밀번호와 다른 경우 */
    if(password !== dbPassword) {
      return  responseData.setResponseCode(RESPONSE_CODE.WRONG_ACCOUNT);
    }    

    /** access token & refresh token 발급 */
    const accessToken = await accessTokenIssued(userInfo);     
    const refreshToken = JWT.getRefreshToken();

    const token = {accessToken: accessToken, refreshToken: refreshToken};

    responseData.setDataValue('token', token);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}

/**
 * TODO: auth 쪽으로 이동 시켜야 함.
 * access token 만료 시 refresh token으로 access token 재발급
 * refresh token도 만료 시 token 만료 알림
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const refreshVerify = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);

  let requestData = new RequestData(req.headers);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);
    
    const expirAccessToken = req.headers.authorization.split('Bearer ')[1];
    if( expirAccessToken !== 'undefined' ) {
      const refreshToken = req.headers.refreshtoken;
      try {
        // refresh token이 유효한지 확인
        const payload = jwt2.verify(refreshToken, jwtInfo['SECRET_KEY']);   

        // access token을 decode 하여 정보 확인
        const decoded = jwt2.decode(expirAccessToken);

        params.USER_ID = decoded.data.USER_ID;
        let userInfo = await dbMng.single("userMapper", 'checkUserAccout', params);

        // 새로운 access token 발급
        const newAccessToken = await accessTokenIssued(userInfo);        
        responseData.setDataValue('accessToken', newAccessToken);
      } catch (error) {
        if (error.message === 'jwt expired') {
          responseData.setResponseCode(RESPONSE_CODE.TOKEN_EXPIRED);
        } else if (error.name === 'invalid token') {
          responseData.setResponseCode(RESPONSE_CODE.INVALID_TOKEN)
        } else {
          responseData.setResponseCode(RESPONSE_CODE.VERIFY_TOKEN_FAIL);
        }
      }
    } else {
      responseData.setResponseCode(RESPONSE_CODE.NO_TOKEN);
    }
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);    
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}

/**
 * access token 발급
 * @param {*} userInfo 사용자 정보
 * @returns 
 */
const accessTokenIssued = async(userInfo) => {
  /** 응답 객체 생성 */
  let payload = new PayloadData();
  payload.loadObject(userInfo);

  const payloadObject = payload.getObject();
  const accessToken = JWT.getAccessToken(payloadObject);

  return accessToken;
}

const getUserRole = async(strUserId) => {  
  let roleRet = '';  
  try {
    let params = {"USER_ID" : strUserId};
    let manageInfo = await dbMng.select("userMapper", 'getManage', params);    
    roleRet = manageInfo[DB_RESULT.ROW_FIRST];
  } catch (error) {
    logger.debug(`User.js getUserRole == ERROR == ${error.message}`);
  }
  return roleRet;
}

/**
 * (sogul admin)매장관리의 사용자 정보 조회
 */
const getStoreUserInfo = async(req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    let userInfo = await dbMng.single("userMapper", 'getStoreUserInfo', params);

    /**  사용자 정보가 없는 경우  */
    if (userInfo == null) {
      return responseData.setResponseCode(RESPONSE_CODE.WRONG_USER_INFO);
    }

    responseData.setDataValue('data', userInfo);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}


/**
 * 소굴 일반 회원 사용자 조회
 */
const getMemberList = async(req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    let totalCnt = await dbMng.totalCnt("userMapper", 'getMemberListTotalCnt', params);
    params['TOTAL_CNT'] = totalCnt;
    let userList = await dbMng.select("userMapper", 'getMemberList', params);    

    responseData.setDataValue('data', userList);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}

/**
 * 소굴 일반 회원 사용자 상세 정보 조회
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const getMemberDetail = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    let userInfo = await dbMng.single("userMapper", 'getMemberDetail', params);

    /**  사용자 정보가 없는 경우  */
    if (userInfo == null) {
      return responseData.setResponseCode(RESPONSE_CODE.WRONG_USER_INFO);
    }

    responseData.setDataValue('data', userInfo);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}


/**
 * 관리자 사용자 리스트
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const getAdminList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    let adminList = await dbMng.select("userMapper", 'getAdminList', params);

    responseData.setDataValue('data', adminList);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  }
}

/**
 * 관리자 비밀번호 초기화
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const setPasswordReset = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();    
    
    common.setRegUser(params, requestData);

    let userPw = requestData.payload.userID;
    if (userPw) {
      params['USER_PASS'] = await common.sha_encrypt(userPw);
    }

    await dbMng.transExec(conn, "userMapper", 'updAdminPasswordReset', params);

    await conn.commit();
    responseData.setResponseCode(RESPONSE_CODE.SUCCESS);
    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    await conn.rollback();
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);

  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    conn.release();
    res.send(responseData);    
  }
}

/**
 * 관리자 신규 등록
 * @param {*} req 
 * @param {*} res 
 */
const setAdminSave = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();    
    
    common.setRegUser(params, requestData);
    
    if( params.STATUS === 'I' ) {     

      let userPw = params.USER_ID;
      if (userPw) {
        params['USER_PASS'] = await common.sha_encrypt(userPw);
      }

      const user = await dbMng.transExec(conn, "userMapper", 'instAdminInfo', params);
      params['AD_USER_INFO_SEQ'] = user.insertId;

      // TODO: role 관련 현재는 ADMIN만 있음. 다른것은 나중에 고민 (user, admin)
      // role 저장
      params['USER_ROLES'] = 'ADMIN';
      await dbMng.transExec(conn, "userMapper", 'instAdminRoles', params);      
      //await saveAuthGroup(conn, rec);

    } else if( params.STATUS === 'U' ) {
      await dbMng.transExec(conn, "userMapper", 'updAdminInfo', params);
    }   

    await conn.commit();
    responseData.setResponseCode(RESPONSE_CODE.SUCCESS);
    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    await conn.rollback();
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);

  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    conn.release();
    res.send(responseData);    
  }
}


/**
 * 관리자 사용자 정보 조회
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const getAdminDetail = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    params['SEARCH_USER_ID'] = requestData.getUserID();

    let admin = await dbMng.single("userMapper", 'getAdminList', params);

    responseData.setData(admin);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}


/**
 * 스크래핑을 위한 사이트 계정 저장
 * @param {*} req 
 * @param {*} res 
 */
const setSiteAccount = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();

    const AD_STORE_INFO_SEQ = params[0].AD_STORE_INFO_SEQ;

    // 사이트 계정 등록
    for(let TP_SITE in params[0].list){
      let _params = params[0].list[TP_SITE];
      
      common.setRegUser(_params, requestData);
      // 암호화
      _params.PW_LOGIN_ENC = common.encrypt(_params.PW_LOGIN);

      if(!Util.isNull(_params.ID_LOGIN) || !Util.isNull(_params.PW_LOGIN) ){          
        await dbMng.transExec(conn ,'userMapper', 'instStieAccount', {TP_SITE, ..._params, AD_STORE_INFO_SEQ});
      }
    }

    await conn.commit();
    responseData.setResponseCode(RESPONSE_CODE.SUCCESS);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    await conn.rollback();
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);

  } finally {
    logger.debug(`${req.originalUrl} == END ==`);
    conn.release();
    res.send(responseData);    
  }
}

/**
 * 스크래핑 사이트 계정 조회
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const getSiteAccount = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);       

    let accList = await dbMng.select("userMapper", 'getSiteAccountList', params);
    
    for(let idx in accList){
      accList[idx].PW_LOGIN = common.decrypt(accList[idx].PW_LOGIN);
    } 

    responseData.setDataValue('data', accList);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}



module.exports = {  
  login,
  refreshVerify,
  getUserRole,  
  getStoreUserInfo,
  getMemberList,
  getMemberDetail,
  getAdminList,
  setPasswordReset,
  setAdminSave,
  setSiteAccount,
  getSiteAccount,
  getAdminDetail,
}