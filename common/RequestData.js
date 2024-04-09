

const common = require('./common');
const util = require('./util');

//const {PAGING_DEFAULT}      = require("./Constant");
//const {NUMERIC}             = require("./Constant");
const {DATA_FIELD_NAME} = require("./Constant");
const PayloadData = require("./PayloadData");
const { MulterFileListHandler } = require('./MulterHelper');
const path = require('path');

/* date */
const sys_date = util.getDate();
const sys_time = util.getTime();

/**
 *  @summary
 *  요청 객체(요청된 값, db connect 정보)를 다루는 class
 *
 */
class RequestData{

  constructor(requestData = {}){

    // payload
    this.payload     = new PayloadData();

    // header
    this.header       = null;

    // body
    this.body         = null ;

    /**
     * files, multer에서 생성된 값
     * @type {MulterFileListHandler}
     */
    this.files        = null;

    // 커넥션을 가지고 있는지
    this.connected    = false ;

    // 입력된 값 설정
    this.initData(requestData);
  }

  /**
   * object 형을 입력 받아서 data 필드 전체 설정
   * @param {object} 입력 data
   */
  initData = (data) =>{    
    this.header = {      
      "TR_DATE": sys_date,
      "TR_TIME": sys_time,	
      "PAGE_NO": 0,
      "PAGE_SIZE": 0,
      "TOTAL_COUNT": 0,
      "USER_ID": "",
    }
    // payload 값이 있는 경우
    if(data.hasOwnProperty(DATA_FIELD_NAME.PAYLOAD)){
      this.payload.loadObject(data[DATA_FIELD_NAME.PAYLOAD]);
    }

    if(data.hasOwnProperty(DATA_FIELD_NAME.BODY)){
      this.body = util.copyObject(data[DATA_FIELD_NAME.BODY]);
    }

    if(data.hasOwnProperty(DATA_FIELD_NAME.FILES)){
      let files = data[DATA_FIELD_NAME.FILES];
      if(Array.isArray(files)){
        files = new MulterFileListHandler(files);
      }else{
        files = Object.keys(files).reduce((listHandler, name)=>{
          listHandler.push(...files[name]);
          return listHandler;
        }, new MulterFileListHandler())
      }      
      this.files = files;
    }
  }

  /**
   * 유저 아이디 조회
   * @returns {object} body 오브젝트
   */
  getUserID = () =>{
    return this.payload.getUserID();
  }

  /**
   * body object 전체 조회
   * @returns {object} body 오브젝트
   */
  getBody = () =>{
    return this.body ;
  }

  /**
   * 키와 값을 입력 받아서 body 필드에 설정
   * @param {string} 입력 키
   * @param {any}    입력 값
   */
  setBodyValue = (key, value)=> {
    this.body[key] = util.copyObject(value);
  }

  /**
   * 주어진 key로  body 값 구하기
   * @param {string} 입력 키
   * @param {string} 키에 해당하는 값이 없을 때 기본 값
   * @returns {any} 키에 해당하는 값
   */
  getBodyValue = (key, defaultValue = null) =>{
    if(this.body.hasOwnProperty(key)){
      return this.body[key];
    }
    return defaultValue ;
  }

  /**
   * data 필드에 해당 키가 존재하는지를 체크
   * @param {string} 입력 키
   * @returns {boolean} data 필드에 해당 키의 존재 여부
   */
  isBodyExist = (key) => {
    return this.body.hasOwnProperty(key);
  }

  /**
   * 필수 입력 필드 확인
   * @param {Array<string>} fieldList 필드 이름 배열
   * @returns {boolean} 누락된 필드가 있으면 `false`
   */
  hasAllMandatoryFields = (fieldList) => {
    let result = true;
    fieldList.forEach(fieldName => {
      if (result)
        result = result && (util.findProp(this.getBody(), fieldName) != null);
    });
    return result;
  }

  /**
   * Pagination
   * @returns {number} 현재 페이지 번호
   * @description 요청받은 URI의 Query String 중,
   *              `page`와 `pageSize`를 가지고 `pageSkip`을 계산해서 요청 데이터에 저장한다.
   *              `page`를 리턴한다.
   */
  paginate = () => {

    const DFN_PAGE = DATA_FIELD_NAME.PAGE;
    const DFN_SIZE = DATA_FIELD_NAME.PAGE_SIZE;
    const DFN_SKIP = DATA_FIELD_NAME.SKIP;

    const page      = Number(this.getBodyValue(DFN_PAGE) || PAGING_DEFAULT[DFN_PAGE]);
    const pageSize  = Number(this.getBodyValue(DFN_SIZE) || PAGING_DEFAULT[DFN_SIZE]);
    const pageSkip  = pageSize * (page > NUMERIC.ONE ? page - NUMERIC.ONE : NUMERIC.ZERO);

    // Model에서 사용할 Pagination 관련 값 설정
    this.setBodyValue(DFN_SIZE, pageSize);
    this.setBodyValue(DFN_SKIP, pageSkip);
    this.setBodyValue(DFN_PAGE, page);

    return page;
  };  

  /**
   * connect 여부
   * @returns {boolean}  database connected 여부
   */
    isConnected = () => {
      return this.connected ;
    };
}

module.exports = RequestData ;
