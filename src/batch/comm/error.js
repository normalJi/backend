/**
 * file name   : src/batch/comm/error.js
 * description : 에러 커스텀 예외처리
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

module.exports.CUSTOM_ERROR = class CUSTOM_ERROR extends Error {
    /**
     * 공통 에러 메세지
     * @param {{
     * err?:Error,
     * code?:string,
     * message?:string,
     * }} parmas0
     */
    constructor({
        err
        , code = 'SERVER_ERROR'
        , message = '알 수 없는 오류가 발생하였습니다.'
    }){
		code = (code != '')? code : 'SERVER_ERROR';
        message = (message != '')? message : '알 수 없는 오류가 발생하였습니다.';
        super(); // 삭제 금지
        this.code = (err?.code)? err.code : code;
        this.message = (err?.message)? ((err?.sqlMessage)? err.sqlMessage : err.message) : message;
        this.stackString = (err?.stackString)? err.stackString : (err?.stack? err.stack : this.stack);
		this.stack = this.stackString;
    }
};