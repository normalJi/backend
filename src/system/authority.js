const dbMng = require('../../config/dbInfo');
const logger = require("../../logger/logger");
const common = require('../../common/common')
const CustomError = require('../../errors/CustomError');
//const JWT = require('../../jwt/jwt');
// jwt에 사용할 토큰 object

const RequestData = require('../../common/RequestData');
const ResponseData = require('../../common/ResponseData');

const { RESPONSE_CODE, RESPONSE_FIELD } = require('../../common/ResponseConst');

/**
 * 권한 목록 조회
 * @param {*} req 요청 데이터
 * @param {*} res 응답 데이터
 * @param {*} req_data
 */
const getAuthorityList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);

  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);     
    
    let list = await dbMng.select("authMapper", "getAuthList", params);

    responseData.setData(list);
  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};

/**
 * 권한 메뉴 매핑 저장
 * @param {*} req 
 * @param {*} res 
 */
const setAuthMenuMap = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();    
    
    common.setRegUser(params, requestData);
      
    // #1. 기 등록되어 있는 메뉴 제외한 나머지 메뉴 전체 저장
    await dbMng.transExec(conn, 'authMapper', 'instTotalAuthMenu', params);
    

    // #2. 체크된 메뉴 select_yn = y로 수정
    if( params.hasOwnProperty('CHK_MENU_LIST') ) {
      // #2-1. 기존 등록된 항목 전부 select_yn = N 으로 수정
      params["SELECT_YN"] = 'N';
      await dbMng.transExec(conn, 'authMapper', 'updAuthMenu', params);

      // #2-2. 체크되어 있는 메뉴의 select_yn = Y 로 수정
      for (const menu of params.CHK_MENU_LIST) {
        params["SYS_MENU_SEQ"] = menu.SYS_MENU_SEQ;
        params["SELECT_YN"] = 'Y';
        params["SAVE_YN"] = menu.SAVE_YN;
        params["DELETE_YN"] = menu.DELETE_YN;
        await dbMng.transExec(conn, "authMapper", "updAuthMenu", params);        
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
 * 권한에 매핑된 사용자 목록 조회
 * @param {*} req 요청 데이터
 * @param {*} res 응답 데이터
 * @param {*} req_data
 */
const getAuthUserList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);

  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);     
    
    let list = await dbMng.select("authMapper", "getAuthUserList", params);

    responseData.setData(list);
  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};


/**
 * 권한 저장
 * @param {*} req 
 * @param {*} res 
 */
const setAuthority = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();    
    params['MANAGE_CD'] = requestData.payload.getmanageCd();
    common.setRegUser(params, requestData);
      
    if( params.STATUS === 'I' ) {
      await dbMng.transExec(conn, 'authMapper', 'instAuthority', params);
    } else if( params.STATUS === 'U' ) {
      await dbMng.transExec(conn, 'authMapper', 'updAuthority', params);
    } else if( params.STATUS === 'D' ) {
      await dbMng.transExec(conn, 'authMapper', 'delAuthority', params);
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
 * 권한에 미 매핑된 사용자 목록 조회
 * @param {*} req 요청 데이터
 * @param {*} res 응답 데이터
 * @param {*} req_data
 */
const getNonAuthUserList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData);     
    
    let list = await dbMng.select("authMapper", "getNonAuthUserList", params);
    responseData.setData(list);

  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};

/**
 * 권한과 사용자 매핑 등록
 * @param {*} req 
 * @param {*} res 
 */
const instAuthUserMap = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = {};
    params = requestData.getBody();    
    params['MANAGE_CD'] = requestData.payload.getmanageCd();
    common.setRegUser(params, requestData);     
    
    await dbMng.transExec(conn, 'authMapper', 'instAuthUserMap', params);    

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
 * 권한과 사용자 매핑 삭제
 * @param {*} req 
 * @param {*} res 
 */
const delAuthUserMap = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {

    let params = requestData.getBody();
    
    await dbMng.transExec(conn, 'authMapper', 'delAuthUserMap', params);    

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

module.exports = {
  getAuthorityList,
  setAuthMenuMap,
  getAuthUserList,
  setAuthority,
  getNonAuthUserList,
  instAuthUserMap,
  delAuthUserMap,
}