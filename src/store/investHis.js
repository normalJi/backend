/**
 * @description 투자내역 조회 or 등록/수정/삭제 
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2023.12.27       최초생성
 * jhr         2024.01.02       조회 시 등록된 갯수 체크하여 0보다 작으면 등록 작업을 선행하도록 수정
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
 * 투자내역 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getInvestHisList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = requestData.getBody();
    
    // 갯수 조회 후 없으면 등록
    let cnt = await dbMng.totalCnt("investHisMapper", 'getInvestHisCnt', params);
    if( cnt <= 0 ) {
      common.setRegUser(params, requestData);
      await dbMng.transExec(conn, "investHisMapper", 'instInvestHis', params);
    }
    await conn.commit();
    let response = await dbMng.select("investHisMapper", 'getInvestHisList', params);
    
    
    responseData.setDataValue('data', response);

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
 * 투자내역 저장
 * @param {*} req 
 * @param {*} res 
 */
const setInvestHis = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();
    common.setRegUser(params, requestData);   
    
    if( params.STATUS === 'U' ) {
      for (const arr of params.list) {
        common.setRegUser(arr, requestData);
        await dbMng.transExec(conn, "investHisMapper", 'updInvestHis', arr);
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
  getInvestHisList,
  setInvestHis,
}