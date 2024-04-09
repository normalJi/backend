/**
 * @description 매출정보 조회 or 등록/수정/삭제 
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

/**
 * 매출정보 조회
 * @param {*} req 
 * @param {*} res
 */
const getSalesInfoList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();
  try {
    let params = requestData.getBody();
    let invest = await dbMng.select("salesInfoMapper", 'getSalesInvest', params);

    // 투자내역 갯수 조회 후 없으면 등록
    let cntInvest = await dbMng.totalCnt("salesInfoMapper", 'getSalesInvestCnt', params);
    if( cntInvest <= 0 ) {
      common.setRegUser(params, requestData);
      await dbMng.transExec(conn, "salesInfoMapper", 'instSalesInvest', params);
    }

    // 표준 손익계산 갯수 조회 후 없으면 등록
    let cnt = await dbMng.totalCnt("salesInfoMapper", 'getSalesIncomeCnt', params);
    if( cnt <= 0 ) {
      common.setRegUser(params, requestData);
      await dbMng.transExec(conn, "salesInfoMapper", 'instSalesIncome', params);
    }
    await conn.commit();
    let income = await dbMng.select("salesInfoMapper", 'getSalesIncome', params);

    let response = {"invest": invest, "income": income};    
    
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
 * 매출내역 저장
 * @param {*} req 
 * @param {*} res 
 */
const setSalesInfo = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();

    common.setRegUser(params.invest, requestData);    

    if( params.STATUS === 'I' ) {
      // 투자 내역
      await dbMng.transExec(conn, "salesInfoMapper", 'instSalesInvest', params.invest);
      // 표준 손익계산서
      if( params.list.length > 0 ) {
        for (const arr of params.list) {
          common.setRegUser(arr, requestData);    
          await dbMng.transExec(conn, "salesInfoMapper", 'updSalesIncome', arr);
        }        
      }
    } else if( params.STATUS === 'U' ) {
      // 투자내역
      await dbMng.transExec(conn, "salesInfoMapper", 'updSalesInvest', params.invest);    
      // 표준 손익계산서
      for (const arr of params.list) {
        common.setRegUser(arr, requestData);    
        await dbMng.transExec(conn, "salesInfoMapper", 'updSalesIncome', arr);
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

// 
/**
 * 매출현황 조회
 * @param {*} req 
 * @param {*} res 
 */
const getSalesStatusList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();

    // 월 매출 리스트 >> 먼저 실행해야함
    let [salesList] = await dbMng.select("salesInfoMapper", 'getSalesDaySumList', params);

    // 월 매출 합계 
    let salesSum = await dbMng.select("salesInfoMapper", 'getSalesMonthSum', params);

    // 월 정산 리스트
    let calcList = await dbMng.select("salesInfoMapper", 'getSalesCalcDaySumList', params);

    // 월 정산 합계
    let calcSum = await dbMng.select("salesInfoMapper", 'getSalesCalcMonthSum', params);

    
    // 월 지출 합계
    let expenSum = await dbMng.select("salesInfoMapper", 'getSalesExpenMonthSum', params);    
    
    let expenList = await dbMng.select("salesInfoMapper", 'getSalesExpenDaySumList', params);    

    let response = {"salesSum": salesSum, "calcSum": calcSum, "expenSum": expenSum, "salesList": salesList, "calcList": calcList, "expenList": expenList};
    
    responseData.setDataValue('data', response);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);        
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);  
  }
}



/**
 * 일자별 매출 조회
 * @param {*} req 
 * @param {*} res 
 */
const getSalesDateList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    params['PAGE_NO'] = 0;
    let deliveryCnt = await dbMng.totalCnt("salesInfoMapper", 'getSalesDeliveryTotCnt', params);
    params['D_TOTAL_CNT'] = deliveryCnt;
    let deliveryList = await dbMng.select("salesInfoMapper", 'getSalesDeliveryList', params);
    
    let itemCnt = await dbMng.totalCnt("salesInfoMapper", 'getSalesItemTotCnt', params);
    params['I_TOTAL_CNT'] = itemCnt;
    let itemList = await dbMng.select("salesInfoMapper", 'getSalesItemList', params);

    let response = {"delivery": deliveryList, "item": itemList};    
    
    responseData.setDataValue('data', response);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);        
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);  
  }
}

/**
 * 매출 분석 조회
 * @param {*} req 
 * @param {*} res 
 */
const getSalesAnalyList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();

    let weekList = await dbMng.select("salesInfoMapper", 'getSalesWeekAnalyList', params);

    let timeList = await dbMng.select("salesInfoMapper", 'getSalesTimeAnalyList', params);

    let payList = await dbMng.select("salesInfoMapper", 'getSalesPayAnalyList', params);
    
    let itemList = await dbMng.select("salesInfoMapper", 'getSalesItemAnalyList', params);

    let deliveryList = await dbMng.select("salesInfoMapper", 'getSalesDeliveryAnalyList', params);

    let response = {"week": weekList, "time": timeList, "pay": payList, "item": itemList, "delivery": deliveryList};    
    
    responseData.setDataValue('data', response);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);        
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);  
  }
}

/**
 * 지출내역 저장
 * @param {*} req 
 * @param {*} res 
 */
const setSpendInfo = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();
    // 지출 내역
    if( params.list.length > 0 ) {
      for (const arr of params.list) {
        common.setRegUser(arr, requestData);
        await dbMng.transExec(conn, "salesInfoMapper", 'instSpendInvest', arr);
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
 * 지출내역 조회
 * @param {*} req 
 * @param {*} res 
 */
const getSpendInfoList = async( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();
    // 지출 내역
    let spendList = await dbMng.select("salesInfoMapper", 'getSpendList', params);
    let response = {spendList};    
    responseData.setDataValue('data', response);

    logger.debug(`${req.originalUrl} == END ==`);
    res.send(responseData);    
    
  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    await conn.rollback();
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);

  }
}

module.exports = {    
  getSalesInfoList,
  setSalesInfo,
  getSpendInfoList,
  setSpendInfo,
  getSalesStatusList,
  getSalesDateList,
  getSalesAnalyList,
}