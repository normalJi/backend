/**
 * file name   : src/batch/scrap/baemin/user.js
 * description : 회원 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { baemin } = require('@taxfriends/scrape');

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
        return await baemin
            .auth
            .loginBasicAsync({
                id
                , password
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
