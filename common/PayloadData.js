const {DB_FIELD_NAME} = require('./Constant');

/**
 *  @summary
 *  JWT의 payload 관련 데이터를 다루는 class
 */
class PayloadData {

  constructor(){
    this.userID   = null;
    this.userName = null;
    this.manageCd = null;
  }

  /**
   * object 형을 입력 받아서 클래스 필드에 설정
   * @param {object} 입력 object 형
   */
  loadObject(payload){

    /** 아이디가 있는 경우  */
    if(payload.hasOwnProperty(DB_FIELD_NAME.USER_ID)){
      this.userID = payload[DB_FIELD_NAME.USER_ID];
    }

    /** 이름이 있는 경우  */
    if(payload.hasOwnProperty(DB_FIELD_NAME.USER_NAME)){
      this.userName = payload[DB_FIELD_NAME.USER_NAME];
    }

    /** 업체 구분 있는 경우  */
    if(payload.hasOwnProperty(DB_FIELD_NAME.MANAGE_CD)){
      this.manageCd = payload[DB_FIELD_NAME.MANAGE_CD];
    }
  }

  /**
   * 클래스의 필드들을 object 형으로 반환
   * @returns {object} 필드들이 포함된 오브젝트
   */
  getObject(){
    const payload = {
      [DB_FIELD_NAME.USER_ID]: this.userID,
      [DB_FIELD_NAME.USER_NAME]: this.userName,
      [DB_FIELD_NAME.MANAGE_CD]: this.manageCd,
    };
    return payload;
  }

  /**
   * userID 조회
   * @returns {string} 유저 아이디
   */
  getUserID(){
    return this.userID;
  }

  /**
   * userName 조회
   * @returns {string} 유저 이름
   */
  getUserName(){
    return this.userName;
  }

  /**
   * manageCd 조회
   * @returns {string} 유저 업체 구분
   */
  getmanageCd(){
    return this.manageCd;
  }

}

module.exports = PayloadData ;