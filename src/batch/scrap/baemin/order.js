/**
 * file name   : src/batch/scrap/baemin/order.js
 * description : 주문내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { baemin } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 주문내역 스크래핑
     * @param {{
     * response?:Response?,
     * userData:any|Response.userData,
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestOrderHistoryAsync : ({ response, userData = response?.userData, fromDate, toDate }) => {
        // 스크래핑 요청
        return baemin
            .orders
            .getOrderHistoryAsync({
                response
                , userData
                , fromDate
                , toDate
            })
            .then(({result}) => {
                return result.list.reduce( (prev, {order}) => {
                    order.orderDateTime = order.orderDateTime.split('T');

                    let TP_PAY_CUSTOM = 'ONLINE';
                    if(order.payTypeDetail.indexOf('만나서') != -1){
                        TP_PAY_CUSTOM = 'OFFLINE_' + (order.payTypeDetail.indexOf('카드') != -1? 'CARD' : 'CASH');
                    }
                    
                    prev.push({
                        NO_SHOP : (order.shopNumber)                                                       // 개맹점 번호
                        , NO_ORDER : (order.orderNumber)                                                   // 주문번호
                        , DT_TRAN : (order.orderDateTime[0]).replace(/-/g, '')                             // 주문일자
                        , TM_TRAN : (order.orderDateTime[1]).replace(/:/g, '')                             // 주문시간
                        , CD_CAMPAIGN : (order.adCampaign.key)                                             // 캠페인코드(광고상품)
                        , TP_SERVICE : (order.serviceType)                                                 // 서비스 구분 (BAEMIN: 배달의민족, RIDERS: 배민1)
                        , TP_RECEIVE : (order.deliveryType)                                                // 수령방법
                        , TP_PAY : (order.payType)                                                         // 결제방법 (BARO: 바로결제, MEET: 만나서결제, RIDER: 라이더결제)
                        , TP_PAY_DETAIL : (order.payTypeDetail)                                            // 결제방법 상세
                        , TP_PAY_CUSTOM                                                                         // 결제방법 공통
                        , AM_DELIVERY : (order.deliveryTip)                                                // 배달비
                        , AM_TOTAL : (order.payAmount)                                                     // 결제금액
                        , MENU_LIST : order.items.map(({name, options, quantity, totalPrice}, idx) => {
                            return {
                                NO_ORD : idx + 1
                                , NM_ITEM : (name)
                                , NO_QTY : (quantity)
                                , AM_TOTAL : (totalPrice)
                                , JSON_ITEM_OPTIONS : JSON.stringify(
                                    options
                                        .map(({name, price}) => {
                                            return {
                                                name : (name == ''? '기본' : name)
                                                , price
                                            }
                                        })
                                        // 내림차순
                                        .sort((a, b) => {
                                            return b.price - a.price;
                                        })
                                )
                            }
                        })
                    });

                    return prev;
                }, []);
            })
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    },
}
