/**
 * file name   : src/batch/comm/scrapHistoryHandler.js
 * description : 스크래핑 히스토리(결과) 핸들러
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const dbMng = require('../../../config/dbInfo');
const { CUSTOM_ERROR } = require("../comm/error");

module.exports = {

    /**
     * 성공 결과 저장
     * @param {{
     * SCRP_USER_ACTION_SEQ:string
     * message?:string
     * }} param0 
     */
    successScrapUser : async ({SCRP_USER_ACTION_SEQ, message = '성공'}) => {
        await dbMng.update(
                "scrapHistoryHandlerMapper"
                , 'udpSuccessScrapUser'
                , {
                    SCRP_USER_ACTION_SEQ
                    , message
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 성공이면서 데이터가 없음 결과 저장
     * @param {{
     * SCRP_USER_ACTION_SEQ:string
     * }} param0 
     */
    successScrapUserNoData : async ({SCRP_USER_ACTION_SEQ}) => {
        await dbMng.update(
                "scrapHistoryHandlerMapper"
                , 'udpSuccessScrapUser'
                , {
                    SCRP_USER_ACTION_SEQ
                    , message : '조회된 데이터가 없습니다.'
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
    
    /**
     * 실패 결과 저장
     * @param {{
     * BATCH_HISTORY_SEQ?:string,
     * SCRP_USER_ACTION_SEQ?:string,
     * CD_TRAN?:array,
     * code:string, 
     * message:string
     * }} param0 
     */
    failScrapUser : async ({
        BATCH_HISTORY_SEQ = ''
        , SCRP_USER_ACTION_SEQ = ''
        , SCRP_USER_ACCOUNT_SEQ = ''
        , CD_TRAN = []
        , code
        , message
    }) =>{
        if(!SCRP_USER_ACTION_SEQ && !(BATCH_HISTORY_SEQ && SCRP_USER_ACCOUNT_SEQ)) {
            throw new CUSTOM_ERROR({code : 'USER_UPDATE_NOT_FOUND_COLUMN', message : '결과저장 업데이트에 회원 조건이 누락되었습니다.'});
        }
        await dbMng.update(
                "scrapHistoryHandlerMapper"
                , 'udpFailScrapUser'
                , { 
                    SCRP_USER_ACTION_SEQ
                    , BATCH_HISTORY_SEQ
                    , SCRP_USER_ACCOUNT_SEQ
                    , CD_TRAN : (CD_TRAN.length > 0)? '' : CD_TRAN.join("','")
                    , code
                    , message
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 전체 실패 결과 저장
     * @param {{
     * BATCH_HISTORY_SEQ:string,
     * NO_BIZ:string,
     * code:string, 
     * message:string
     * }} param0 
     */
    failAllScrap : async ({BATCH_HISTORY_SEQ, code, message}) =>{
        await dbMng.update(
                "scrapHistoryHandlerMapper"
                , 'udpFailAllScrap'
                , {
                    BATCH_HISTORY_SEQ
                    , code
                    , message
                }
            )
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    /**
     * 스크래핑 실행중 확인
     * @param {{
     * BATCH_HISTORY_SEQ:string,
     * }} param0 
     * @returns {'Y'|'N'}
     */
    runningScrap : ({BATCH_HISTORY_SEQ}) => {
        return dbMng.select(
                "scrapHistoryHandlerMapper"
                , 'getRunningScrap'
                , {
                    BATCH_HISTORY_SEQ
                }
            )
            .then(([{RUN_COUNT}]) => Number(RUN_COUNT) > 0? 'Y' : 'N')
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },

    
    /**
     * 계정오류 저장
     * @param {{
     * SCRP_USER_ACCOUNT_SEQS:array,
     * code:string,
     * message:string
     * }} param0 
     */
    accountError : async ({SCRP_USER_ACCOUNT_SEQS, code, message}) =>{
        for(let SCRP_USER_ACCOUNT_SEQ of SCRP_USER_ACCOUNT_SEQS){
            try{
                let [{SCRP_USER_ACCOUNT_ERROR_SEQ}] = dbMng
                    .select(
                        "scrapHistoryHandlerMapper"
                        , 'getAccountErrorSequnes'
                        , {
                            SCRP_USER_ACCOUNT_SEQ
                            , code
                        }
                    );

                if(SCRP_USER_ACCOUNT_ERROR_SEQ){
                    await dbMng.update(
                        "scrapHistoryHandlerMapper"
                        , 'updAccountError'
                        , {
                            SCRP_USER_ACCOUNT_ERROR_SEQ
                            , code
                            , message
                        }
                    );
                }else{
                    await dbMng.insert(
                        "scrapHistoryHandlerMapper"
                        , 'updAccountError'
                        , {
                            SCRP_USER_ACCOUNT_SEQ
                            , code
                            , message
                        }
                    )
                    .catch((err) => {
                        if(err.code != 'ER_DUP_ENTRY'){
                            throw err;
                        }
                    });
                }
            }catch(err){
                throw new CUSTOM_ERROR({err});
            }
        }
    },
}