/**
 * file name   : src/batch/scrap/common/user/scrapBatchUser.js
 * description : 스크래핑 배치 진행 사용자 셋팅
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */
const { CUSTOM_ERROR } = require("../../../comm/error");
const { getDate, getFirstDate, getLastDate } = require('../../../comm/scrapCommon');
const dbMng = require('../../../../../config/dbInfo');

module.exports = {

    /**
     * 대상 회원 스크래핑 실행계획 세우기
     * @param {{
     * BATCH_HISTORY_SEQ:string,
     * NO_BIZ?:array,
     * TP_SITE:string,
     * CD_TRAN:array,
     * DT_STR:string,
     * DT_END:string,
     * ID_REG_USER?:string
     * }} param0 
     */
    setScrapUser : ({
        BATCH_HISTORY_SEQ
        , NO_BIZ = ''
        , TP_SITE
        , CD_TRAN
        , DT_STR
        , DT_END
        , ID_REG_USER = 'BATCH'
    }) => {
        // 해당 CD_TRAN별로 회원 INSERT
        return dbMng
            .insert(
                'scrapCommonBatchUser'
                , 'instScrapUser'
                , {
                    BATCH_HISTORY_SEQ
                    , NO_BIZ
                    , TP_SITE
                    , CD_TRAN
                    , DT_STR
                    , DT_END
                    , ID_REG_USER
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 일배치 대상 회원 스크래핑 실행계획 세우기
     * @param {{
     * BATCH_HISTORY_SEQ?:string,
     * TP_SITE:string,
     * }} param0 
     */
    setDaliyScrapUser : ({
        BATCH_HISTORY_SEQ
        , TP_SITE
        , ID_REG_USER = 'BATCH'
    }) => {
        
        let DT_STR = getDate('D', -3)
            , DT_END = getDate('D', -1)
            , CD_TRAN = [];
        switch(TP_SITE){
            case "baemin" : CD_TRAN = ['baemin_o', 'baemin_p']; break;
            case "yogiyo" : CD_TRAN = ['yogiyo_o', 'yogiyo_p']; break;
            case "coupang" : CD_TRAN = ['coupang_o', 'coupang_p']; break;
            case "yessin" : CD_TRAN = ['yessin1', 'yessin2', 'yessin3']; break;
        }

        // 스크래핑 회원 Table Insert
        return dbMng
            .insert(
                'scrapCommonBatchUser'
                , 'instDaliyScrapUser'
                , {
                    BATCH_HISTORY_SEQ
                    , TP_SITE
                    , CD_TRAN
                    , DT_STR
                    , DT_END
                    , ID_REG_USER
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 실행계획에 등록된 계정 전체 가져오기
     * @param {{
     * SCRP_USER_ACTION:string,
     * }} param0 
     * @returns {[{
     * SCRP_USER_ACCOUNT_SEQS:array,
     * NO_BIZS:array,
     * CD_TRANS:array,
     * ID_LOGIN:string,
     * PW_LOGIN:string,
     * }]} 회원정보
     */
    getScrapUsersAccount : ({BATCH_HISTORY_SEQ}) => {
        return dbMng
            .select(
                'scrapCommonBatchUser'
                , 'getScrapUsersAccount'
                , { BATCH_HISTORY_SEQ }
            )
            .then(res => 
                res.map(row=> {
                    row.SCRP_USER_ACCOUNT_SEQS = row.SCRP_USER_ACCOUNT_SEQS.split(','); 
                    row.NO_BIZS = row.NO_BIZS.split(','); 
                    row.CD_TRANS = row.CD_TRANS.split(','); 
                    return row;
                })
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 실행계획에 등록된 회원의 스크래핑 정보 가져오기
     * @param {{
     * BATCH_HISTORY_SEQ:string,
     * SCRP_USER_ACCOUNT_SEQ:string,
     * }} param0 
     * @returns {[{
     * SCRP_USER_ACTION_SEQ:string,
     * BATCH_HISTORY_SEQ:string,
     * AD_STORE_INFO_SEQ:string,
     * SCRP_USER_ACCOUNT_SEQ:string,
     * NO_BIZ:string,
     * TP_SITE:string,
     * CD_TRAN:string,
     * DT_STR:string,
     * DT_END:string,
     * ID_REG_USER:string
     * }]} 회원정보
     */
    getUserScrapInfo : async ({
        BATCH_HISTORY_SEQ
        , SCRP_USER_ACCOUNT_SEQ
    }) => {
        return await dbMng
            .select(
                'scrapCommonBatchUser'
                , 'getUserScrapInfo'
                , { 
                    BATCH_HISTORY_SEQ
                    , SCRP_USER_ACCOUNT_SEQ
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}