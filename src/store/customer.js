/**
 * @description 거래처관리 조회 or 상세조회 or 등록/수정/삭제 
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2023.12.27       최초생성
 */

const dbMng = require('../../config/dbInfo');
const logger = require("../../logger/logger");
const common = require('../../common/common')
const CustomError = require('../../errors/CustomError');
const util = require('../../common/util');

const RequestData = require('../../common/RequestData');
const ResponseData = require('../../common/ResponseData');

const { RESPONSE_CODE, RESPONSE_FIELD } = require('../../common/ResponseConst');

/**
 * 거래처관리 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getCustomerMngList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("customerMapper", 'getCustomerMngList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 거래처관리 상세조회
 * @param {*} req 
 * @param {*} res 
 */
const getCustomerMngDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    
    let details = await dbMng.single("customerMapper", 'getCustomerMngDetails', params);    

    responseData.setDataValue('data', details);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 거래처관리 저장
 * @param {*} req 
 * @param {*} res 
 */
const setCustomerMng = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();
    if( params.STATUS !== 'D' ){      
      common.setRegUser(params, requestData);
      if( params.STATUS === 'I' ) {
        await dbMng.transExec(conn, "customerMapper", 'instCustomerMng', params);
      } else {
        await dbMng.transExec(conn, "customerMapper", 'updCustomerMng', params);
      }
    } else if( params.STATUS === 'D' ){
      for (const row of params.list) {        
        await dbMng.transExec(conn, "customerMapper", 'delCustomerMng', row);        
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

module.exports = {    
  getCustomerMngList,
  getCustomerMngDetails,
  setCustomerMng  
}