/**
 * @description 창업투자 조회 or 상세조회 or 등록/수정/삭제 
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2024.02.07       최초생성
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
 * 창업투자 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getInvestCunsultList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    const params = requestData.getBody();
    params['MANAGE_CD'] = requestData.payload.manageCd;
    
    const totalCnt = await dbMng.totalCnt("investMapper", "getInvestConsultCnt", params);
    params['TOTAL_CNT'] = totalCnt;
    
    let response = await dbMng.select("investMapper", 'getInvestConsultList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 창업투자 상세 조회
 * @param {*} req 
 * @param {*} res 
 */
const getInvestCunsultDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    const params = requestData.getBody();    
    
    let response = await dbMng.single("investMapper", 'getInvestConsultDetail', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}


/**
 * 창업투자 수정
 * @param {*} req 
 * @param {*} res 
 */
const setInvestCunsult = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();       
    common.setRegUser(params, requestData);
    if( params.STATUS === 'U' ){
      await dbMng.transExec(conn, "investMapper", 'updInvestConsult', params);      
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
  getInvestCunsultList,
  getInvestCunsultDetails,
  setInvestCunsult,
  
}