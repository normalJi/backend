/**
 * file name   : src/batch/scrap/coupangeats/user.js
 * description : 회원 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { coupangeats } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 로그인 스크래핑
     * @param {{
     * id:string, 
     * password:string,
     * }} param0 
     */
    requestLoginAsync : async ({ id, password }) => {
        nullCheck({id, password});
        blankCheck({id, password});

        // 스크래핑 요청
        return await coupangeats
            .auth
            .loginBasicAsync({
                id
                , password
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 전체 상호정보 리스트
     * @param {{
     * response:Response,
     * userData?:any,
     * businessNumber:string,
     * }} param0 
     */
    getCompaniesAsync : async ({ response, userData = response?.userData, businessNumber }) => {
        nullCheck({userData, businessNumber});
        blankCheck({userData, businessNumber});

        return await coupangeats
            .auth
            .getCompaniesAsync({
                response
                , userData
                , businessNumber
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            })
    }
}
