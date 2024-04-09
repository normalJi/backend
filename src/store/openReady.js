/**
 * @description 오픈준비 - 개설프로세스/일정관리 조회 or 등록/수정/삭제 
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2023.12.28       최초생성
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
const { setDynamicDetails } = require('./code');
/**
 * 개설프로세스 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getOpenProcessList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = requestData.getBody();

    // 갯수 조회 후 없으면 insert
    let cnt = await dbMng.totalCnt("openReadyMapper", 'getOpenProcessCnt', params);
    if( cnt <= 0 ) {
      common.setRegUser(params, requestData);
      // 최초 등록 시 서류 카테고리와 개설 카테고리를 매핑함
      await dbMng.transExec(conn, "openReadyMapper", 'instOpenDocumentMap', params);


      await dbMng.transExec(conn, "openReadyMapper", 'instOpenProcess', params);   
      await conn.commit();
    } 
    
    //let cateList = await dbMng.select("openReadyMapper", 'getOpenProcessCateList', params);
    let list = await dbMng.select("openReadyMapper", 'getOpenProcessList', params);    

    let response = {"list": list};

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
 * 개설프로세스 상세조회
 * @param {*} req 
 * @param {*} res 
 */
const getOpenProcessDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();

    //let main = await dbMng.single("openReadyMapper", 'getOpenProcessDetails', params);
    const main = await dbMng.single("openReadyMapper", 'getOpenProcessList', params);    
    //const subDetails = await dbMng.select("codeMapper", 'getDynamicDetails', params);
    const details = await dbMng.select("openReadyMapper", 'getOpenProcessDetails', params);

    const fileList = await dbMng.select("openReadyMapper", 'getFileList', params);

    let response = {data: main, detail: details, fileList: fileList}

    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 개설프로세스 저장
 * @param {*} req 
 * @param {*} res 
 */
const setOpenProcess = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();    
    common.setRegUser(params.main, requestData);

    await dbMng.transExec(conn, "openReadyMapper", 'updOpenProcess', params.main);    
    
    for ( const row of params.detailList ) {
      common.setRegUser(row, requestData);
      row["AD_OPEN_PROCESS_SEQ"] = params.main.AD_OPEN_PROCESS_SEQ;
      const totalCnt = await dbMng.totalCnt("openReadyMapper", 'cntOpenProcessDetail', row);
      if( totalCnt > 0 ) {
        await dbMng.transExec(conn, "openReadyMapper", 'updOpenProcessDetail', row);        
      } else { 
        await dbMng.transExec(conn, "openReadyMapper", 'instOpenProcessDetail', row);
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
 * 개설프로세스 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getOpenProcessCateList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = requestData.getBody();    

    let response = await dbMng.select("openReadyMapper", 'getOpenProcessCateList', params);    
    
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
 * 일정관리 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getScheduleMngList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("openReadyMapper", 'getScheduleMngList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 일정관리 상세조회
 * @param {*} req 
 * @param {*} res 
 */
const getScheduleMngDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    
    const response = await dbMng.single("openReadyMapper", 'getScheduleMngDetails', params);
    
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 일정관리 저장
 * @param {*} req 
 * @param {*} res 
 */
const setScheduleMng = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();    
    common.setRegUser(params, requestData);

    if( util.isEmpty(params.AD_SCHEDULE_MNG_SEQ)  ) {
      await dbMng.transExec(conn, "openReadyMapper", 'instScheduleMng', params);    
    } else {
      await dbMng.transExec(conn, "openReadyMapper", 'updScheduleMng', params);    
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
  getOpenProcessList, 
  getOpenProcessDetails,
  setOpenProcess,
  getScheduleMngList,
  getScheduleMngDetails,
  setScheduleMng,
  getOpenProcessCateList,
}