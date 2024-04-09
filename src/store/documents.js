/**
 * @description 점주서류 조회 or 등록/수정/삭제 
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jyh         2024.01.19       최초생성
 * jyh         2024.01.19       조회 시 등록된 갯수 체크하여 0보다 작으면 등록 작업을 선행하도록 수정
 */

const dbMng = require('../../config/dbInfo');
const logger = require("../../logger/logger");
const common = require('../../common/common')
const CustomError = require('../../errors/CustomError');
const util = require('../../common/util');

const { setDynamicDetails } = require('./code');

const RequestData = require('../../common/RequestData');
const ResponseData = require('../../common/ResponseData');

const { RESPONSE_CODE, RESPONSE_FIELD } = require('../../common/ResponseConst');

/**
 * 점주서류 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const getDocumentsList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = requestData.getBody();
    // 갯수 조회 후 없으면 등록
    
    let cnt = await dbMng.totalCnt("documentsMapper", 'getDocumentsCnt', params);
    if( cnt <= 0 ) {
      common.setRegUser(params, requestData);
      await dbMng.transExec(conn, "documentsMapper", 'instInitDocuments', params);
      //await dbMng.transExec(conn, "documentsMapper", 'instOwnerDetail', params);

    }

    await conn.commit();
    const response = await dbMng.select("documentsMapper", 'getDocumentsList', params);  // 리스트
    //let response2 = await dbMng.select("documentsMapper", 'getOwnerDocDetailList', params);
    const response2 = await dbMng.select("documentsMapper", 'getDocumentsDetailShowList', params);  // 메인리스트에 보여줄 상세 항목 조회
    const response3 = await dbMng.single("documentsMapper", 'getDocumentInitDirect', params);  // 직접 입력 시 사용할 obj

    const result = {main: response, itemList: response2, initData: response3};
    
    responseData.setData(result);

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
 * 점주서류 디테일 리스트 조회
 * @param {*} req 
 * @param {*} res
 */
const setDocumentsDetail = async ( req, res ) => {
    logger.debug(`${req.originalUrl} == START ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);
  
    try {
      let data = {};
      let params = requestData.getBody();
      //common.setRegUser(params, requestData);
      if( !params.hasOwnProperty("STATUS") ) {
        const response1 = await dbMng.single("documentsMapper", "getDocumentsDetail", params); // 상세
        const response2 = await dbMng.select("documentsMapper", "getDocumentDetailLower", params);  // 하위 상세 
        const response3 = await dbMng.select("codeMapper", 'getDynamicDetails', params);  // 동적 상세
  
        // 첨부파일      
        const response4 = await dbMng.select("commMapper", 'getAttachments', {"FILE_SEQ": params.AD_DOCUMENTS_SEQ, "FILE_TYPE_CD": params.DOC_GB});
        data = {detail: response1, subDetail: response2, dynamicDetail: response3, fileList: response4 };

      } else {
        const response1 = await dbMng.single("documentsMapper", "getDocumentInitDirect", params); // 상세
        data = {detail: response1 };
      }

      responseData.setData(data);
  
    } catch (e) {
      logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);          
      responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
    } finally {
      logger.debug(`${req.originalUrl} == END ==`);      
      res.send(responseData);    
    }
}

/**
 * 점주서류 디테일 INSERT OR UPDATE
 * @param {*} req 
 * @param {*} res
 */
const setDocuments = async ( req, res ) => {
    logger.debug(`${req.originalUrl} == START ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);
  
    const conn = await dbMng.connection();
    await conn.beginTransaction();
    try {
        let params = requestData.getBody();
        let AD_DOCUMENTS_SEQ = params.AD_DOCUMENTS_SEQ || 0;
        // 직접 입력 시 insert
        if( params.main.hasOwnProperty("STATUS") && params.main.STATUS === "I" ) {          
          common.setRegUser(params.main, requestData);
          params.main['AD_STORE_INFO_SEQ'] = params.AD_STORE_INFO_SEQ;
          const seq = await dbMng.transExec(conn, "documentsMapper", 'instDocumentsDirect', params.main);
          AD_DOCUMENTS_SEQ = seq.insertId;
          //params['AD_DOCUMENTS_SEQ'] = seq.insertId;
          
        } else {
        // 그 외는 리스트 불러올때 이미 저장 되어 있기 때문에 update 처리
          common.setRegUser(params.main, requestData);
          params.main["AD_DOCUMENTS_SEQ"] = params.AD_DOCUMENTS_SEQ;
          await dbMng.transExec(conn, "documentsMapper", 'updDocuments', params.main);
  
          // 서류 디테일 업데이트
          for (const arr of params.subDetail) {
            common.setRegUser(arr, requestData);
            arr["AD_DOCUMENTS_SEQ"] = params.AD_DOCUMENTS_SEQ;
            arr["AD_STORE_INFO_SEQ"] = params.AD_STORE_INFO_SEQ;
  
            await dbMng.transExec(conn, "documentsMapper", 'updDocumentsDetail', arr);
          }
        }

        // 동적 상세 등록
        saveDynamic = await setDynamicDetails(conn, params.AD_DOCUMENTS_SEQ, params.DOC_GB, params.dynamicList, requestData); 

        await conn.commit();
        
        responseData.setDataValue("AD_DOCUMENTS_SEQ", AD_DOCUMENTS_SEQ);
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
 * 점주서류 디테일 리스트 초기화 (삭제)
 * @param {*} req 
 * @param {*} res
 */
const setDocumentsDel = async ( req, res ) => {
    logger.debug(`${req.originalUrl} == START ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);
  
    const conn = await dbMng.connection();
    await conn.beginTransaction();
    try {
        let params = requestData.getBody();
        common.setRegUser(params, requestData);

        params['AD_USE_SEQ'] = params.AD_DOCUMENTS_SEQ;
        await dbMng.transExec(conn, "commMapper", 'delAllFileDelete', params);        
        await dbMng.transExec(conn, "codeMapper", 'delDynamicDetails', params);
        await dbMng.transExec(conn, "documentsMapper", 'delDocumentsDetail', params);

        if( params.CATE_NM === '직접입력' ) {
          await dbMng.transExec(conn, "documentsMapper", 'delDocuments', params);
        } else {
          await dbMng.transExec(conn, "documentsMapper", 'delUpdDocuments', params);  
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
    getDocumentsList,
    setDocumentsDetail,
    setDocuments,
    setDocumentsDel
}