/**
 * file name   : src/batch/scrap/yessin/buy.js
 * description : 여신 매입내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');

const { yessin } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 여신 매입내역 스크래핑
     * @param {{
     * response:Response?,
     * userData:Response['userData']?,
     * merGrpId:string,
     * fromDate:'YYYYMMDD', 
     * toDate:'YYYYMMDD', 
     * }} param0 
     */
    requestPurchasesAsync : async ({ response, userData = response?.userData, merGrpId, fromDate, toDate }) => {
        nullCheck({userData, merGrpId, fromDate, toDate});
        blankCheck({userData, merGrpId, fromDate, toDate});

        // 스크래핑 요청
        return await yessin
            .buy
            .getPurchasesAsync({
                response
                , userData
                , merGrpId
                , fromDate
                , toDate
            })
            .then(({result}) => {
                return result
                    .map( ({
                        pcaDate, trnsDate, cardNm, cardNo, authNo, authClss, pcaAmt
                    }) => {
                        return {
                            DT_PUCH: pcaDate        // 매입일자
                            , DT_TRAN: trnsDate     // 거래일자
                            , NM_CARD: cardNm       // 카드사
                            , NO_CARD: cardNo       // 카드번호
                            , NO_APRV: authNo       // 승인번호
                            , CD_PAY: authClss      // 결제구분(0: 승인, 1: 취소)
                            , AM_TOTAL: pcaAmt      // 매입금액
                        };
                    });
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
