/**
 * file name   : src/batch/scrap/yogiyo/settle.js
 * description : 정산내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { yogiyo } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 정산내역 스크래핑
     * @param {{
     * response:Response?,
     * token:string|response.userData.token,
     * businessNumber:string,
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestSettleHistoryAsync : ({ 
        response
        , token = response?.userData?.token
        , businessNumber
        , fromDate
        , toDate 
    }) => {
        // 스크래핑 요청
        return yogiyo
            .orders
            .getBatchSettleHistoryAsync({
                response
                , token
                , businessNumber
                , fromDate
                , toDate
            })
            .then(({result}) => {
                return result.list
                    .map( (settle) => {
                        settle.sedate = settle.sedate.replace(/ /g, '').split('~');
                        return {
                            DT_DEPOSIT: settle.payment_date.replace(/-/g, ''),      // 정산일자
                            NM_SERVICE: settle.contract_type,                       // 서비스구분
                            DT_TRAN_ST: settle.sedate[0].replace(/-/g, ''),         // 거래시작일자
                            DT_TRAN_ED: settle.sedate[1].replace(/-/g, ''),         // 거래종료일자
                            AM_TOTAL: settle.fin_amount,                            // 정산금액
                        };
                    });
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
