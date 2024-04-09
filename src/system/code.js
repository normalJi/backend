/**
 * @description 공통 코드
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2024.01.22       최초생성
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
 * 공통코드 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getCommonCodeList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("commMapper", 'getCommonCodeList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

// 첨부파일 저장
const setAttachments = [  
  uploadMiddleware().array('files'),
  async ( req, res ) => {
    logger.debug(`${req.originalUrl} == START 시작 ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);

    try {
      if(!requestData.hasAllMandatoryFields(['AD_STORE_INFO_SEQ']) || !requestData.hasAllMandatoryFields(['AD_INFO_SEQ'])){
        return responseData.setResponseCode(RESPONSE_CODE.REQUIRED_FIELD);
      }

      let { AD_STORE_INFO_SEQ, AD_INFO_SEQ, FILE_TYPE_CD } = requestData.getBody();
      
      const files = requestData.files;
      files.changeAllFileDirectory(`store/${AD_STORE_INFO_SEQ}/${AD_INFO_SEQ}/file`);

      for (let file of files) {
        let params = {
          AD_STORE_INFO_SEQ,
          AD_INFO_SEQ,
          FILE_TYPE_CD,
          ORI_FILE_NM: file.originalname,
          FILE_NM: file.normalizedPath,
          FILE_SIZE: file.size,
          ID_REG_USER: requestData.getUserID(),
          ID_MOD_USER: requestData.getUserID()
        }
        console.log(params);
        await dbMng.insert("commMapper", 'instAttachments', params);
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
 * 첨부파일 삭제
 * @param {*} req 
 * @param {*} res 
 */
const setFileDelete = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();    
    
    await dbMng.transExec(conn, "commMapper", 'delFileDelete', params);
    
    await conn.commit();    
    responseData.setResponseCode(RESPONSE_CODE.SUCCESS);

    logger.debug(`${req.originalUrl} == END ==`);
    conn.release();
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    await conn.rollback();
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 카테고리 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getCategoryList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("commMapper", 'getCategoryList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 개설프로세스 카테고리 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getOpenCateList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("commMapper", 'getOpenCateList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

module.exports = {    
  getCommonCodeList,
  setAttachments,
  getCategoryList,
  setFileDelete,
  getOpenCateList,
}