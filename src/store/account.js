/**
 * @description 계좌정보 조회 or 상세조회 or 등록/수정/삭제 
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
const { setDynamicDetails } = require('./code');

/**
 * 계좌정보 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getAccountList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("accountMapper", 'getAccountList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 계좌정보 상세조회
 * @param {*} req 
 * @param {*} res 
 */
const getAccountDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    
    const details = await dbMng.single("accountMapper", 'getAccountDetails', params);

    params['DYNAMIC_DIVISION'] = 'ACCOUNT';
    const subDetails = await dbMng.select("codeMapper", 'getDynamicDetails', params);

    const data = {details: details, list: subDetails}

    responseData.setData(data);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 계좌정보 저장
 * @param {*} req 
 * @param {*} res 
 */
const setAccountInfo = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();

    let AD_ACCOUNT_INFO_SEQ = params.AD_ACCOUNT_INFO_SEQ || 0;
    let saveDynamic = false;
    if( params.STATUS !== 'D' ){
      let queryResult;
      common.setRegUser(params.main, requestData);
      params.main['AD_STORE_INFO_SEQ'] = params.AD_STORE_INFO_SEQ;
      if( params.STATUS === 'I' ) {
        queryResult = await dbMng.transExec(conn, "accountMapper", 'instAccountInfo', params.main);
        AD_ACCOUNT_INFO_SEQ = queryResult.insertId;

      } else {
        params.main['AD_ACCOUNT_INFO_SEQ'] = AD_ACCOUNT_INFO_SEQ;
        queryResult = await dbMng.transExec(conn, "accountMapper", 'updAccountInfo', params.main);
      }      
      // 동적 상세 등록/수정
      saveDynamic = await setDynamicDetails(conn, AD_ACCOUNT_INFO_SEQ, 'ACCOUNT', params.dynamicList, requestData);
    } else if( params.STATUS === 'D' ){
      await dbMng.transExec(conn, "accountMapper", 'delAccountInfo', params);
      // 동적 상세 삭제
      saveDynamic = await setDynamicDetails(conn, params.AD_ACCOUNT_INFO_SEQ, 'ACCOUNT', null, requestData);
    }    

    if( saveDynamic === false ){      
      throw new responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
    }
    
    // // 동적 input 저장
    // if( (params.subList).length > 0 ) {
    //   for (const row of params.subList) {
    //     common.setRegUser(row, requestData);
    //     row['AD_ACCOUNT_INFO_SEQ'] = AD_ACCOUNT_INFO_SEQ;
    //     if( row.hasOwnProperty('STATUS') ) {
    //       // 등록
    //       await dbMng.transExec(conn, "accountMapper", 'instAccountInfoDetail', row);          
    //     } else {
    //       // 수정
    //       await dbMng.transExec(conn, "accountMapper", 'updAccountInfoDetail', row);          
    //     }        
    //   }  
    // }

    await conn.commit();
    responseData.setDataValue('AD_ACCOUNT_INFO_SEQ', AD_ACCOUNT_INFO_SEQ);
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
  getAccountList,
  getAccountDetails,
  setAccountInfo,
}