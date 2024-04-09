/**
 * file name   : src/batch/scrap/baemin/settle.js
 * description : 정산내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { baemin } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 정산내역 스크래핑
     * @param {{
     * response?:Response,
     * userData:any|Response.userData,
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestSettleHistoryAsync : ({ response, userData = response?.userData, fromDate, toDate }) => {
        // 스크래핑 요청
        return baemin
            .orders
            .getSettleHistoryAsync({
                response
                , userData
                , fromDate
                , toDate
            })
            .then(({result}) => {
                console.log(result)
                return result.list.map( (settle) => {
                    return {
                        DT_DEPOSIT: settle.giveDepositDate.replace(/-/g, ''),       // 정산일자
                        NM_SERVICE: settle.settleCodeName,                          // 서비스구분
                        DT_TRAN_ST: settle.giveStartDate.replace(/-/g, ''),         // 거래시작일자
                        DT_TRAN_ED: settle.giveEndDate.replace(/-/g, ''),           // 거래종료일자
                        AM_TOTAL: settle.giveAmount,                                // 정산금액
                    };
                });
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
