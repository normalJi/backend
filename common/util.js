const dateUtil = require("date-utils");
/**
 * 데이터가 비었는지 체크
 * @param {*} value 
 * @returns true: null, false: 데이터 있음
 */
const isEmpty = (value) => {
  if ( typeof value == "undefined"
      || value == null
      || value === ""
      || value === "null"
      || (value != null && typeof value === "object" && !Object.keys(value).length)
      || (value != null && Array.isArray(value) && value.length === 0)) {
    return true;
  } else {
    return false;
  }
};

/**
 * 
 * @param {*} str : 파라미터가 null 일때 
 * @returns str
 */
const nullToStr = (str) => {
  try {
    if (str === null || str === '') {
      if( str === 0 ) {
        return str;
      }
      return '';
    } else {
      return str;
    }

  } catch (e) {
    logger.error('nullToStr', e);
    return str;
  }
};

/**
 * Case -insensitive Property Getter
 * param {Object} obj 대상 객체
 * param {string} targetKey 프로퍼티 이름
 * returns {null|*} 해당 프로퍼티 값
 */
const findProp = (obj, targetKey) => {
  const t = String(targetKey).toLowerCase();
  for (const objectKey in obj) {
    if (obj.hasOwnProperty(objectKey)) {
      const o = String(objectKey).toLowerCase();
      if (o === t && !isEmpty(obj[objectKey]))
        return obj[objectKey];
    }
  }
  return null;
}

/**
 *  객체 깊은 복사
 *  param     {object | array} inObject  - object 또는 array
 *  returns   {object | array} 복사한 오브젝트
 */
const copyObject = function(inObject) {

  if(typeof inObject !== "object" || inObject === null) {
    return inObject;
  }

  let outObject = Array.isArray(inObject) ? [] : {}
  for (const key in inObject) {
    const value = inObject[key] ;
    outObject[key] = (typeof value === "object" && value !== null) ? copyObject(value) : value ;
  }

  return outObject ;
}

/**
 * 년, 월, 일 중에 요구한 수 만큼 추가 한 일자를 반환
 * strYMD : Y(년), M(월), D(일)
 * intAdd : 일자에서 추가 할 값
 * Format : YYYYMMDD
 */
const getDate = function (strYMD, intAdd, paramDt) {

  var date = new Date();
  if (paramDt) {
      date = new Date(paramDt.substr(0, 4), paramDt.substr(4, 2) - 1, paramDt.substr(6, 2));
  }

  var result = '';
  try {
      if (strYMD) {
          switch (strYMD) {
              case 'Y':
                  date.addYears(intAdd);
                  break;

              case 'M':
                  //date.addMonths(intAdd).addDays(-1);          
                  date.addMonths(intAdd);
                  break;

              case 'D':
                  date.addDays(intAdd);
                  break;
              default:
                  break;
          }
      }
  } catch (e) {
      log.error('Util getDate error', e);
  }

  return date.toFormat('YYYYMMDD');
};

/**
 * 시간을 반환
 * Format : HH24MISS
 */
const getTime = function () {
  var date = new Date();

  return date.toFormat('HH24MISS');
};

const isNull = function(v)  {
  return ( isEmpty(v) ) ? true : false;
}

/**
 * 날짜를 포맷에 맞게 변경하여 반환
 * @param {*} flag : ymd: YYYYMMDD, 
 *                   y-m-d: YYYY-MM-DD,
 *                   y.m.d: YYYY.MM.DD
 * @returns format date
 */
const getDateFormat = function(paramDt, flag) {
  
  let date = new Date();
  if (paramDt) {    
    if( paramDt.length === '8' ) {
      date = new Date(paramDt.substr(0, 4), paramDt.substr(4, 2), paramDt.substr(6, 2));
    } else {
      date = new Date(paramDt.substr(0, 4), paramDt.substr(5, 2), paramDt.substr(8, 2));
    }    
  }

  if( flag === 'ymd' ) {
    return date.toFormat('YYYYMMDD');
  } else if( flag === 'y-m-d' ) {
    return date.toFormat('YYYY-MM-DD');
  } else if( flag === 'y.m.d' ) {
    return date.toFormat('YYYY.MM.DD');
  }
};

module.exports = {
  isEmpty,
  nullToStr,
  findProp,
  copyObject,
  getDate,
  getTime,
  isNull,
  getDateFormat,
}