/**
 * file name   : src/batch/scrap/yessin/user.js
 * description : 회원 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { yessin } = require('@taxfriends/scrape');

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
        return await yessin
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
     * 전체 가맹점 리스트
     * @param {{
     * response:Response?,
     * userData:Response['userData']?,
     * }} param0 
     * @returns {{
     * store:array,
     * detail:array
     * }} 
     */
    requestCompaniesAllAsync : async ({ response, userData = response?.userData }) => {
        nullCheck({userData});
        blankCheck({userData});

        return await yessin
            .auth
            .getCompaniesAsync({
                response
                , userData
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 가맹점 사업자번호로 검색
     * @param {{
     * response:Response?,
     * userData:Response['userData']?,
     * businessNumber:string
     * }} param0 
     * @returns {{
     * store:any|null,
     * detail:any|null
     * }} 
     */
    requestSearchCompaniesAsync : async ({ response, userData = response?.userData, businessNumber }) => {
        nullCheck({userData, businessNumber});
        blankCheck({userData, businessNumber});

        return await yessin
            .auth
            .getCompaniesAsync({
                response
                , userData
            })
            .then((response) => {
                let { result } = response;

                let store = null;
                for(let _store of result.store){
                    if(_store.regBuzNo == businessNumber){
                        store = _store;
                        break;
                    }
                }

                let detail = null;
                for(let _detail of result.detail){
                    if(_detail.regBuzNo == businessNumber){
                        detail = _detail;
                        break;
                    }
                }

                response.result = {store, detail};
                return response;
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    }
}
