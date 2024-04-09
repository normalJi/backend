/**
 * @description 매장관리 조회 or 상세조회 or 등록/수정/삭제 
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
const { uploader: uploadMiddleware, removeFile } = require('../../common/MulterHelper');


/**
 * 매장현황 - 매장정보 리스트
 * @param {*} req 
 * @param {*} res
 */
const getStoreList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("storeMapper", 'getStoreList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 매장정보 상세조회
 * @param {*} req 
 * @param {*} res 
 */
const getStoreDetails = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    // 매장정보 기본정보 조회    
    let info = await dbMng.single("storeMapper", 'getStoreDetails', params);

    // 매장정보 투자정보 조회
    let info_sub = await dbMng.single("storeMapper", 'getStoreInvestDetails', params);
    let response = {"info": info, "info_sub": info_sub}

    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 매장정보 저장
 * @param {*} req 
 * @param {*} res
 */
const setStoreInfo = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    
    let params = requestData.getBody();
    common.setRegUser(params, requestData);
    let queryResult;
    let AD_STORE_INFO_SEQ = params.AD_STORE_INFO_SEQ || 0;
    
    if( params.STATUS === 'I' || params.STATUS === 'U') {      
      if( params.STATUS === 'I' ) {

        let dupliCheck = await dbMng.totalCnt("storeMapper", 'getNobizDupliCheck', params);
        if( dupliCheck > 0 ) {
          return responseData.setResponseCode(RESPONSE_CODE.NO_BIZ_DUPLI);
        }
        // 매장정보 기본정보
        queryResult = await dbMng.transExec(conn, "storeMapper", 'instStoreInfo', params);
        AD_STORE_INFO_SEQ = queryResult.insertId;
        params.AD_STORE_INFO_SEQ = AD_STORE_INFO_SEQ;
        // 매장정보 임차정보
        queryResult = await dbMng.transExec(conn, "storeMapper", 'instLeaseInfo', params);
        // 매장정보 투자정보
        queryResult = await dbMng.transExec(conn, "storeMapper", 'instInvestInfo', params);
      } else {
        queryResult = await dbMng.transExec(conn, "storeMapper", 'updStoreInfo', params);
        queryResult = await dbMng.transExec(conn, "storeMapper", 'updLeaseInfo', params);
        queryResult = await dbMng.transExec(conn, "storeMapper", 'updInvestInfo', params);
      }      
    } else if( params.STATUS === 'D') {
    
      for (const row of params.list) {
        await dbMng.transExec(conn, "storeMapper", 'delStoreInfo', row);        
      }
      // 삭제 조건이 있다면 추가
    }  

    await conn.commit();

    responseData.setDataValue('AD_STORE_INFO_SEQ', AD_STORE_INFO_SEQ);
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
 * 매장정보 매장 사진 조회
 * @param {*} req 
 * @param {*} res 
 */
const getStorePictures = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);
  try {
    let params = requestData.getBody();
    // 매장정보 기본정보 조회    
    let files = await dbMng.select("storeMapper", 'getStorePictures', params);

    responseData.setDataValue('files', files);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 매장정보 매장사진 추가
 */
const addStorePicture = [  
  uploadMiddleware().array('files'),
  async ( req, res ) => {
    logger.debug(`${req.originalUrl} == START ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);

    try {
      if(!requestData.hasAllMandatoryFields(['AD_STORE_INFO_SEQ'])){
        return responseData.setResponseCode(RESPONSE_CODE.REQUIRED_FIELD);
      }

      let { AD_STORE_INFO_SEQ } = requestData.getBody();      
      
      const files = requestData.files;
      files.changeAllFileDirectory(`store/${AD_STORE_INFO_SEQ}/pictures`);

      for (let file of files) {
        let params = {
          AD_STORE_INFO_SEQ,
          ORI_FILE_NM: file.originalname,
          FILE_NM: file.normalizedPath,
          FILE_SIZE: file.size,
          ID_REG_USER: requestData.getUserID(),
          ID_MOD_USER: requestData.getUserID()
        }
        console.log(params);
        await dbMng.insert("storeMapper", 'instStorePicture', params);
      }

      logger.debug(`${req.originalUrl} == END ==`);    
      res.send(responseData);    

    } catch (e) {
      logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
      responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
    }
  }
]

/**
 * 매장정보 매장사진 삭제
 */
const removeStorePicture = async (req, res)=>{
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    if(!requestData.hasAllMandatoryFields(['AD_STORE_FILE_SEQ'])){
      return responseData.setResponseCode(RESPONSE_CODE.REQUIRED_FIELD);
    }

    let { AD_STORE_FILE_SEQ } = requestData.getBody();

    //AD_STORE_FILE_SEQ: 단일 seq & array 형태의 복수 seq 모두 허용
    let AD_STORE_FILE_SEQ_LIST = AD_STORE_FILE_SEQ;
    if(!Array.isArray(AD_STORE_FILE_SEQ_LIST)){
      AD_STORE_FILE_SEQ_LIST = [AD_STORE_FILE_SEQ];
    }

    let files = await dbMng.select("storeMapper", 'getStorePicturesForDelete', {AD_STORE_FILE_SEQ_LIST});

    for(const file of files){
      removeFile(file.FILE_NM);
      await dbMng.delete('storeMapper', 'delStorePicture', file);
    }

    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

// 임차조건만 업데이트 저장
const setLease = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);
  
  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {    
    let params = requestData.getBody();
    common.setRegUser(params, requestData);

    // 매장정보 임차정보
    seq = await dbMng.transExec(conn, "storeMapper", 'updLeaseInfo', params);

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

// 매장 주소 업데이트 
const setAddr = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {    
    let params = requestData.getBody();

    // 주소는 업데이트만
    common.setRegUser(params, requestData);
    await dbMng.transExec(conn, "storeMapper", 'updateStoreAddr', params);
    await conn.commit();
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
  getStoreList,  
  getStoreDetails,  
  setStoreInfo,  
  getStorePictures,
  addStorePicture,
  setLease,
  removeStorePicture,
  setAddr
}