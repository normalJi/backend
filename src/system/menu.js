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
 * 전체 Menu 목록을 가져온다.
 * @param {*} req 요청 데이터
 * @param {*} res 응답 데이터
 * @param {*} req_data
 */
const getMenuList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);

  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData); 
    console.log("getUserID : ", requestData.getUserID());
    
    let menuInfo = await dbMng.select("menuMapper", "getMenuList", params);

    responseData.setData(menuInfo);
  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};

/**
 * 권한메뉴매핑할 메뉴 리스트 조회
 * @param {*} req 
 * @param {*} res 
 * @param {*} req_data 
 */
const getUseYMenuList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);

  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData); 
    console.log("getUserID : ", requestData.getUserID());
    
    let menuInfo = await dbMng.select("menuMapper", "getAuthMenuList", params);

    responseData.setData(menuInfo);
  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};


/**
 * 사용자에 맞는 left Menu 목록을 가져온다.
 * @param {*} req 요청 데이터
 * @param {*} res 응답 데이터
 * @param {*} req_data
 */
const getUserMenuList = async (req, res, req_data) => {
  logger.debug(`${req.originalUrl} == START ==`);
  
  let requestData = new RequestData(req);

  let responseData = new ResponseData(requestData);

  try {
    let params = common.getParams(requestData); 
    console.log("getUserID : ", requestData.getUserID());
    
    let menuInfo = await dbMng.select("menuMapper", "getUserMenuList", params);

    responseData.setData(menuInfo);
  } catch (error) {
    logger.error(`${req.originalUrl} == ERROR == ${error.message}`);

    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  } finally {        
    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);
  }
};

/**
 * 메뉴 저장
 * @param {*} req 
 * @param {*} res 
 */
const setMenu = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();
    params['MANAGE_CD'] = requestData.payload.manageCd;
    common.setRegUser(params, requestData);
    let sortNo = 0;
    if( params.STATUS === 'I' ){
      sortNo = await dbMng.single("menuMapper", "getPrtMenuSortNo", params);
      params['MENU_SORT'] = sortNo.MENU_SORT;
      await dbMng.transExec(conn, "menuMapper", 'instMenuInfo', params);
    } else if( params.STATUS === 'U' ){
      await dbMng.transExec(conn, "menuMapper", 'updMenuInfo', params);
    } else if( params.STATUS === 'U_I' ){
      sortNo = await dbMng.single("menuMapper", "getUnderMenuSortNo", params);
      params['MENU_SORT'] = sortNo.MENU_SORT;
      await dbMng.transExec(conn, "menuMapper", 'instUnderMenuInfo', params);
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



module.exports = {
  getMenuList,
  getUserMenuList,
  setMenu,
  getUseYMenuList,
}