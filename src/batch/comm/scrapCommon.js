/**
 * file name   : src/batch/comm/scrapCommon.js
 * description : 스크래핑에 사용하는 공통 함수
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require("./error");

/**
 * 앞에 String 붙이기
 * @param leng 문자열 길이
 * @param str 문자열
 * @returns Date String
 */
const leftPad = (leng, str) => {
    str = String(str);
    return str.length >= leng ? str:new Array(leng-str.length+1).join('0')+str;//남는 길이만큼 0으로 채움
}

/**
 * 현재 날짜 및 계산한 날짜 가져오기
 * @param {{
 * type?:"D"|"M"|"Y"|null
 * add?:int,
 * date?:string,
 * }} param0
 * @returns Date String
 */
const getDate = (type = "", add = 0, date = "") => {
    var d = new Date();
    if(date != "") { 
        date = date.replace(/[^0-9]/g, '');
        d = new Date(date.substring(0, 4), Number(date.substring(4,6))-1, date.substring(6,8));
    }
    switch(type){
        case "D" : 
            d.setDate(d.getDate() + add);
        break;
        case "M" : 
            d.setMonth(d.getMonth() + add);
        break;
        case "Y" : 
            d.setFullYear(d.getFullYear() + add);
        break;
    }
	var str = `${d.getFullYear()}${leftPad(2, d.getMonth()+1)}${leftPad(2, d.getDate())}`;
	return str;
}


/**
 * 첫 날짜 구하기
 * @param {{
 * type?:"D"|"M"|"Y"|null
 * add?:int,
 * date?:string,
 * format?:string
 * }} param0
 * @returns Date String
 */
const getFirstDate = (type = "", add = 0, date = "") => {
    return getDate(type, add, (getDate('', '', date).substring(0, 6) + "01")).substring(0, 6) + '01';
}

/**
 * 마지막 날짜 구하기
 * @param {{
 * type?:"D"|"M"|"Y"|null
 * add?:int,
 * date?:string,
 * format?:string
 * }} param0
 * @returns Date String
 */
const getLastDate = (type = "", add = 0, date = "") => {
    return getDate(type, Number(add) + 1, (getDate('', '', date).substring(0, 6) + "01").substring(0, 6) + '00');
}

/**
 * 공백 체크 함수
 * @param {{[string]:any}} datas 데이터
 */
const blankCheck = (datas) => {
	let blankDatas = [];
	for(let key of Object.keys(datas)){
		if(String(datas[key]).trim() == ''){
			blankDatas.push(key);
		}
	}

	if(blankDatas.length > 0){
		throw new CUSTOM_ERROR({code : 'BALNK_COLUMN', message : `[${blankDatas.join(",")}] 공백`});
	}
}

/**
 * null 체크 함수
 * @param {{[string]:any}} datas 데이터
 */
const nullCheck = (datas) => {
	let nullDatas = [];
	for(let key of Object.keys(datas)){
		if(datas[key] == null){
			nullDatas.push(key);
		}
	}

	if(nullDatas.length > 0){
		throw new CUSTOM_ERROR({code : 'NULL_COLUMN', message : `[${nullDatas.join(",")}] 존재하지 않음`});
	}
}

/**
 * 현재 일시 가져오기
 * @returns DateTime String
 */
const getCurrentDateTime = () => {
    let d = new Date();
    return `${d.getFullYear()}${leftPad(2, d.getMonth()+1)}${leftPad(2, d.getDate())}${leftPad(2, d.getHours())}${leftPad(2, d.getMinutes())}${leftPad(2, d.getSeconds())}`;
}

// String 변환
const toStr = (str) => {
    return (str == undefined || str == null)? '' : String(str).replace(/\t/g, " ")
        .replace(/\r\n/g, ' ')
		.replace(/\n/g, ' ')
        .replace(/\\/g, '\\\\')
		.replace(/'/g, '\\\'')
        .replace(/"/g, '\\\"')
		.replace(/\f/g, '\\f')
		.replace(/\r/g, '\\r')
		.replace(/{/g, '(')
		.replace(/}/g, ')')
		.trim();
}

const toInt = (int)=>{
    if(!int) return 0;
    return Number(String(int).replace(/[^0-9\.\-]/g, ''));
}

module.exports = {
    getDate,
    getFirstDate,
    getLastDate,
    getCurrentDateTime,
    blankCheck,
    nullCheck,
    toStr,
    toInt,
}
