/**
 * file name   : src/batch/scrap/yessin/depo.js
 * description : 여신 입금내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { toStr, toInt, nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { yessin } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 여신 입금내역 스크래핑
     * @param {{
     * response:Response?,
     * userData:Response['userData']?,
     * merGrpId:string,
     * fromDate:'YYYYMMDD', 
     * toDate:'YYYYMMDD', 
     * }} param0 
     */
    requestDepositsAsync : async ({ response, userData = response?.userData, merGrpId, fromDate, toDate }) => {
        nullCheck({userData, merGrpId, fromDate, toDate});
        blankCheck({userData, merGrpId, fromDate, toDate});
        
        // 스크래핑 요청
        return await yessin
            .depo
            .getDepositsAsync({
                response
                , userData
                , merGrpId
                , fromDate
                , toDate
            })
            .then(({result}) => {
                return result.map( ({
                    pymDate, cardNm, stlBankNm, stlAcctNo, pcaCnt, pcaAmt, rcpAmt
                }) => {
                    return {
                        DT_DEPOSIT: pymDate         // 입금일자
                        , NM_CARD: cardNm           // 카드사
                        , NM_BANK: stlBankNm        // 결제은행                                        
                        , NO_ACCOUNT: stlAcctNo     // 결제계좌
                        , CNT_SALES: pcaCnt         // 매출건수
                        , AM_SALES: pcaAmt          // 매출금액
                        , AM_TOTAL: rcpAmt          // 실입금액
                    };
                });
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
