/**
 * file name   : src/batch/scrap/yogiyo/order.js
 * description : 주문내역 스크래핑
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { CUSTOM_ERROR } = require('../../comm/error');
const { yogiyo } = require('@taxfriends/scrape');

module.exports = {
    /**
     * 주문내역 스크래핑
     * @param {{
     * response:Response?,
     * access_token:string|response.userData.access_token,
     * companys:[...company],
     * fromDate:'YYYYMMDD',
     * toDate:'YYYYMMDD',
     * }} param0 
     */
    requestOrderHistoryAsync : ({ 
        response
        , access_token = response?.userData?.access_token
        , companys = response?.userData?.companys
        , fromDate
        , toDate 
    }) => {
        // 스크래핑 요청
        return yogiyo
            .orders
            .getBatchOrderHistoryAsync({
                response
                , access_token
                , companys
                , fromDate
                , toDate
            })
            .then(async ({result}) => {
                return (await Promise.all(
                    result.list
                        .map(order => yogiyo
                            .orders
                            .getOrderHistoryDetailAsync({
                                response
                                , access_token
                                , order_number : order.order_number
                            })
                            .then(res => {
                                return {
                                    order
                                    , detail : res.result
                                }
                            })
                        )
                )).reduce((prev, {order, detail}) => {
                        let { payment, delivery_fee, items } = detail;

                        // 성공만 진행
                        if(order.transmission_status != 'ACCEPTED'){
                            return prev;
                        }
                        
                        order.submitted_at = order.submitted_at.split('T');

                        let TP_PAY_CUSTOM = payment.central_payment_type;
                        let TP_PAY = payment.central_payment_type;
                        if(TP_PAY == 'ONLINE'){
                            TP_PAY += `_${payment.payment_method}`;
                        }

                        if(order.delivery_method_code) order.delivery_method_code = `_${order.delivery_method_code}`;
                        else order.delivery_method_code = '';

                        prev.push({
                            NO_SHOP : order.restaurant_id                                                       // 개맹점 번호
                            , NO_ORDER : order.order_number                                                     // 주문번호
                            , DT_TRAN : order.submitted_at[0].replace(/-/g, '')                                 // 주문일자
                            , TM_TRAN : order.submitted_at[1].replace(/:/g, '')                                 // 주문시간
                            , TP_RECEIVE : `${order.purchase_serving_type}${order.delivery_method_code}`        // 수령방법
                            , TP_PAY                                                                            // 결제방법 (BARO: 바로결제, MEET: 만나서결제, RIDER: 라이더결제)
                            , TP_PAY_DETAIL : payment.payment_service                                           // 결제방법 상세
                            , TP_PAY_CUSTOM                                                                     // 결제방법 공통
                            , AM_DELIVERY : delivery_fee                                                // 배달비
                            , AM_TOTAL : order.order_price                                                      // 결제금액
                            , MENU_LIST : items.map(({name, options, quantity, total_price}, idx) => {
                                return {
                                    NO_ORD : idx + 1
                                    , NM_ITEM : name
                                    , NO_QTY : quantity
                                    , AM_TOTAL : total_price
                                    , JSON_ITEM_OPTIONS : JSON.stringify(
                                        options
                                            .map(({name, total_price : price}) => {
                                                return {
                                                    name
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
                throw new CUSTOM_ERROR({err});
            });
    },
}
