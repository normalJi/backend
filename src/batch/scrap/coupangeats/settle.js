/**
 * file name   : src/batch/scrap/coupangeats/settle.js
 * description : 주문내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { coupangeats } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 정산내역 스크래핑
     * @param {{
     * response?:Response,
     * userData:any|response.userData,
     * store:any|response.result.store,
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestSettleHistoryAsync : ({ 
        response
        , userData = response?.userData
        , store = response?.result?.store
        , fromDate
        , toDate 
    }) => {
        // 스크래핑 요청
        return coupangeats
            .orders
            .getBatchSettleHistoryAsync({
                response
                , userData
                , store
                , fromDate
                , toDate
            })
            .then(async ({result}) => {
                return result.list
                    .filter( ({settlementManageType}) => settlementManageType == 'SETTLEMENT')
                    .reduce((prev, settle) => {
                        prev.push({
                            DT_DEPOSIT : settle.settlementDate.replace(/-/g, '')    // 정산일자
                            , AM_TOTAL : settle.amount                              // 정산금액
                        });

                        return prev;
                    }, []);
            })
            .catch((err) => {
                console.log(err);
                throw new CUSTOM_ERROR({err});
            });
    },
}

// 쿠팡이츠 DateTime to String
const convertToLocalDateTimeString = (date) => {
    if (!date) return null;
    const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
    let datetime = new Date(Number(date) + KR_TIME_DIFF);
    return datetime.getUTCFullYear() 
        + '-' + (datetime.getUTCMonth() < 9 ? '0' : '') + (datetime.getUTCMonth() + 1)
        + '-' + (datetime.getUTCDate() <= 9 ? '0' : '') + datetime.getUTCDate()
        + ' ' + (datetime.getUTCHours() <= 9 ? '0' : '') + datetime.getUTCHours()
        + ':' + (datetime.getUTCMinutes() <= 9 ? '0' : '') + datetime.getUTCMinutes()
        + ':' + (datetime.getUTCSeconds() <= 9 ? '0' : '') + datetime.getUTCSeconds()
    ;
};