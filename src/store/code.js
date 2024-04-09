/**
 * @description 매장관리에 대한 코드성  
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhr         2024.01.05       최초생성
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
 * 업종코드 조회
 * @param {*} req 
 * @param {*} res
 */
const getIndustryCdList = async ( req, res ) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  try {
    let params = requestData.getBody();
    let response = await dbMng.select("codeMapper", 'getIndustryCdList', params);
    
    responseData.setDataValue('data', response);
    logger.debug(`${req.originalUrl} == END ==`);    
    res.send(responseData);    

  } catch (e) {
    logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);    
    responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
  }
}

/**
 * 동적 상세 건별 삭제
 * @param {*} res 
 * @param {*} req 
 */
const setDelDynamicDetails = async (req, res) => {
  logger.debug(`${req.originalUrl} == START ==`);
  let requestData = new RequestData(req);
  let responseData = new ResponseData(requestData);

  const conn = await dbMng.connection();
  await conn.beginTransaction();

  try {
    let params = {};
    params = requestData.getBody();

    // 동적 상세 삭제
    let saveDynamic = await setDynamicDetails(conn, params.AD_USE_SEQ, 'ACCOUNT', params, requestData);

    if( saveDynamic === false ){      
      throw new responseData.setResponseCode(RESPONSE_CODE.CONTACT_ADMIN);
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
 * 동적 상세 등록/수정 그리고 삭제
 * STATUS 필요
 * @param {*} conn connection transtion
 * @param {*} seq 각 해당 일련번호
 * @param {*} dynamic_division 화면 구분
 * @param {*} obj 객체 리스트
 * @param {*} requestData requestData
 * @returns true of false
 */
const setDynamicDetails = async ( conn, seq, dynamic_division, obj, requestData  ) => {
  
  let returnRst = false;
  try{
    const status = util.isEmpty(requestData.getBody().STATUS) ? "A" : requestData.getBody().STATUS;
    if( !status.includes('D') ) {
      if( obj && obj.length > 0 ) {      
        for (const row of obj) {
          common.setRegUser(row, requestData);          
          row['AD_USE_SEQ'] = seq;
          if( row.hasOwnProperty('STATUS') ) {
            // 등록
            await dbMng.transExec(conn, "codeMapper", 'instDynamicDetails', row);          
          } else {
            // 수정
            await dbMng.transExec(conn, "codeMapper", 'updDynamicDetails', row);          
          }        
        }
      }
    } else if( status === 'D' ) {
      // 삭제
      await dbMng.transExec(conn, "codeMapper", 'delDynamicDetails', {'AD_USE_SEQ': seq, "DYNAMIC_DIVISION": dynamic_division} );
    } else if( status === 'RD' ) {
      // 삭제
      await dbMng.transExec(conn, "codeMapper", 'delRowDynamicDetails', obj );
    }

    return returnRst = true;
  } catch (e) {
    return returnRst = false;
  }
}


module.exports = {    
  getIndustryCdList,
  setDynamicDetails,
  setDelDynamicDetails
}