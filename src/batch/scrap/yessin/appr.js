/**
 * file name   : src/batch/scrap/yessin/appr.js
 * description : 여신 승인내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { yessin } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 여신 승인내역 스크래핑
     * @param {{
     * response:Response?,
     * userData:Response['userData']?,
     * merGrpId:string,
     * fromDate:'YYYYMMDD', 
     * toDate:'YYYYMMDD', 
     * }} param0 
     */
    requestApprovalsAsync : async ({ response, userData = response?.userData, merGrpId, fromDate, toDate }) => {
        nullCheck({userData, merGrpId, fromDate, toDate});
        blankCheck({userData, merGrpId, fromDate, toDate});

        // 스크래핑 요청
        return await yessin
            .appr
            .getApprovalsAsync({
                response
                , userData
                , merGrpId
                , fromDate
                , toDate
            })
            .then(({result}) => {
                return result
                    .map( ({
                        authClss, trnsDate, trnsTime, cardNm, affiCardNm
                        , cardNo, authNo, insTrm, authAmt
                    }) => {
                        return {
                            DT_TRAN: trnsDate               // 거래일자
                            , TM_TRAN: trnsTime             // 거래시간
                            , NM_CARD: cardNm               // 카드사
                            , NM_AFFI_CARD: affiCardNm       // 제휴카드사                                        
                            , NO_CARD: cardNo               // 카드번호
                            , NO_APRV: authNo               // 승인번호
                            , CD_PAY: authClss              // 결제구분(0: 승인, 1: 취소)
                            , NO_MONTH: Number(insTrm)      // 할부기간 
                            , AM_TOTAL: authAmt             // 승인금액
                        };
                    });
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
