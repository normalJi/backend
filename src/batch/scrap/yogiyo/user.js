/**
 * file name   : src/batch/scrap/yogiyo/user.js
 * description : 회원 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { yogiyo } = require('@taxfriends/scrape');

module.exports = {
    /**
     * CEO페이지 로그인 스크래핑
     * @param {{
     * id:string, 
     * password:string,
     * }} param0 
     */
    requestLoginCEOAsync : async ({ id, password }) => {
        nullCheck({id, password});
        blankCheck({id, password});

        // 스크래핑 요청
        return await yogiyo
            .auth
            .loginCEOAsync({
                id
                , password
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * BOSS 페이지 로그인 스크래핑
     * @param {{
     * id:string, 
     * password:string,
     * }} param0 
     */
    requestLoginBOSSAsync : async ({ id, password }) => {
        nullCheck({id, password});
        blankCheck({id, password});

        // 스크래핑 요청
        return await yogiyo
            .auth
            .loginBOSSAsync({
                id
                , password
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
