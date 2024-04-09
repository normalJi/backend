/**
 * file name   : src/batch/scrap/coupangeats/order.js
 * description : 주문내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { coupangeats } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 주문내역 스크래핑
     * @param {{
     * response?:Response,
     * userData:any|response.userData,
     * store:any|response.result.store,
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestOrderHistoryAsync : ({ 
        response
        , userData = response?.userData
        , store = response?.result?.store
        , fromDate
        , toDate 
    }) => {
        // 스크래핑 요청
        return coupangeats
            .orders
            .getOrderHistoryAsync({
                response
                , userData
                , store
                , fromDate
                , toDate
            })
            .then(async ({result}) => {
                return result.list
                    .reduce((prev, order) => {
                        order.createdAt = convertToLocalDateTimeString(order.createdAt).split(' ');
                        prev.push({
                            NO_SHOP : order.storeId                                                             // 개맹점 번호
                            , NO_ORDER : order.abbrOrderId                                                      // 주문번호
                            , SEQ_ORDER : order.uniqueOrderId                                                   // 고유주문번호
                            , DT_TRAN : order.createdAt[0].replace(/-/g, '')                                    // 주문일자
                            , TM_TRAN : order.createdAt[1].replace(/:/g, '')                                    // 주문시간
                            , TP_RECEIVE : order.type                                                           // 수령방법
                            , TP_PAY_CUSTOM : 'ONLINE'                                                          // 결제방법 공통
                            , AM_DELIVERY : order.orderSettlement?.deliverySupplyPrice?.basicSupplyPrice || 0   // 배달비
                            , AM_TOTAL : order.salePrice                                                        // 결제금액
                            , MENU_LIST : order.items.map(({name, itemOptions, quantity, subTotalPrice}, idx) => {
                                return {
                                    NO_ORD : idx + 1
                                    , NM_ITEM : name
                                    , NO_QTY : quantity
                                    , AM_TOTAL : subTotalPrice
                                    , JSON_ITEM_OPTIONS : JSON.stringify(
                                        itemOptions
                                            .map(({optionName : name, optionPrice : price}) => {
                                                return {
                                                    name : name.replace(/ㄴ/, '')
                                                    , price
                                                }
                                            })
                                    )
                                }
                            })
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