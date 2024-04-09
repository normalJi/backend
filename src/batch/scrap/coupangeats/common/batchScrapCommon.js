/**
 * file name   : src/batch/scrap/coupangeats/common/batchScrapCommon.js
 * description : 쿠팡이츠 스크래핑 함수 모음
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const dbMng = require('../../../../../config/dbInfo.js');
const { CUSTOM_ERROR } = require('../../../comm/error');

// 스크래핑 로그관리용
const { 
    successScrapUser
    , successScrapUserNoData
    , failScrapUser
    , accountError
} = require('../../../comm/scrapHistoryHandler');

// 쿠팡이츠 스크래핑 모듈
const {
    requestLoginAsync
    , getCompaniesAsync
    , requestOrderHistoryAsync
    , requestSettleHistoryAsync
} = {
    ...require('../user')
    , ...require('../order')
    , ...require('../settle')
}

/**
 * 쿠팡이츠 로그인 스크래핑
 * @param {{
 * ID_LOGIN:string,
 * PW_LOGIN:string,
 * SCRP_USER_ACCOUNT_SEQS:array,
 * }} param0 
 */
const scrapLoginAsync = ({ID_LOGIN, PW_LOGIN, SCRP_USER_ACCOUNT_SEQS}) => {
    return requestLoginAsync({
        id : ID_LOGIN,
        password : PW_LOGIN
    }).catch( async (err) => {
        // 계정오류시 table 저장
        if(err.code == 'ACCOUNT_ERROR'){
            await accountError({ SCRP_USER_ACCOUNT_SEQS, code : err.code, message : err.message });
        }
        throw err;
    });
}

/**
 * 쿠팡이츠 로그인 스크래핑
 * @param {{
 * response:any,
 * NO_BIZ:string,
 * BATCH_HISTORY_SEQ:string
 * SCRP_USER_ACCOUNT_SEQ:string,
 * }} param0 
 */
const scrapCompaniesAsync = ({response, NO_BIZ, BATCH_HISTORY_SEQ, SCRP_USER_ACCOUNT_SEQ}) => {
    return getCompaniesAsync({
        response
        , businessNumber : NO_BIZ
    })
    .catch( async (err) => {
        // 실패시 해당 사업자번호의 스크래핑 전체 실패
        await failScrapUser({BATCH_HISTORY_SEQ, SCRP_USER_ACCOUNT_SEQ, code : err.code, message : err.message});
        throw err;
    });
}


/**
 * 쿠팡이츠 > 주문내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:number|string,
 * SCRP_USER_ACCOUNT_SEQ:number|string,
 * SCRP_USER_ACTION_SEQ:string,
 * userData:any|response.userData,
 * store:any|response.result.store,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * }} param0 
 */
const scrapOrderHistoryAsync = async ({
    response
    , AD_STORE_INFO_SEQ
    , SCRP_USER_ACCOUNT_SEQ
    , SCRP_USER_ACTION_SEQ
    , userData = response?.userData
    , store = response?.result?.store
    , DT_STR
    , DT_END
}) => {

    // DB
    let connection = null;

    try{
        // 스크래핑
        let list = await requestOrderHistoryAsync({
            response
            , userData
            , store
            , fromDate : DT_STR
            , toDate : DT_END
        });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 주문내역, 메뉴 삭제
            await dbMng.delete(
                'scrapCoupangeatsMapper'
                , 'delCoupangeatsOrder'
                , {
                    AD_STORE_INFO_SEQ
                    , SCRP_USER_ACCOUNT_SEQ
                    , DT_STR
                    , DT_END
                }
            ).catch(err => { throw new CUSTOM_ERROR({err}) });

            // DB 트렌젝션
            connection = await dbMng.connection();
            await connection.beginTransaction();

            for(let data of list){
                try{
                    //데이터 INSERT
                    await dbMng.transExec(
                        connection
                        , 'scrapCoupangeatsMapper'
                        , 'instCoupangeatsOrder'
                        , {
                            AD_STORE_INFO_SEQ
                            , SCRP_USER_ACCOUNT_SEQ
                            , ...data
                        }
                    );

                    for(let menu of data.MENU_LIST){
                        //데이터 INSERT
                        await dbMng.transExec(
                            connection
                            , 'scrapCoupangeatsMapper'
                            , 'instCoupangeatsOrderItem'
                            , {
                                AD_STORE_INFO_SEQ
                                , SCRP_USER_ACCOUNT_SEQ
                                , NO_SHOP : data.NO_SHOP
                                , SEQ_ORDER : data.SEQ_ORDER
                                , ...menu
                            }
                        );
                    }
                }catch(err){
                    if(err.code != 'ER_DUP_ENTRY'){
                        throw new CUSTOM_ERROR({err});
                    }
                }
            }

            // 커밋
            await connection.commit();

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        err = new CUSTOM_ERROR({err});

        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, ...err});

        if(connection) await connection.rollback();
    }finally{
        if(connection) await connection.release();
    }
}

/**
 * 쿠팡이츠 > 정산내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:number|string,
 * SCRP_USER_ACCOUNT_SEQ:number|string,
 * SCRP_USER_ACTION_SEQ:string,
 * userData:any|response.userData,
 * store:any|response.result.store,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * }} param0 
 */
const scrapSettleHistoryAsync = async ({
    response
    , AD_STORE_INFO_SEQ
    , SCRP_USER_ACCOUNT_SEQ
    , SCRP_USER_ACTION_SEQ
    , userData = response?.userData
    , store = response?.result?.store
    , DT_STR
    , DT_END
}) => {

    // DB
    let connection = null;

    try{
        // 스크래핑
        let list = await requestSettleHistoryAsync({
            response
            , userData
            , store
            , fromDate : DT_STR
            , toDate : DT_END
        });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 주문내역, 메뉴 삭제
            await dbMng.delete(
                'scrapCoupangeatsMapper'
                , 'delCoupangeatsSettle'
                , {
                    AD_STORE_INFO_SEQ
                    , SCRP_USER_ACCOUNT_SEQ
                    , DT_STR
                    , DT_END
                }
            ).catch(err => { throw new CUSTOM_ERROR({err}) });

            // DB 트렌젝션
            connection = await dbMng.connection();
            await connection.beginTransaction();

            for(let data of list){
                //데이터 INSERT
                await dbMng.transExec(
                    connection
                    , 'scrapCoupangeatsMapper'
                    , 'instCoupangeatsSettle'
                    , {
                        AD_STORE_INFO_SEQ
                        , SCRP_USER_ACCOUNT_SEQ
                        , ...data
                    }
                )
                .catch((err) => {
                    if(err.code != 'ER_DUP_ENTRY'){
                        throw new CUSTOM_ERROR({err});
                    }
                });
            }

            // 커밋
            await connection.commit();

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        err = new CUSTOM_ERROR({err});

        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, ...err});

        if(connection) await connection.rollback();
    }finally{
        if(connection) await connection.release();
    }
}

module.exports = {
    scrapLoginAsync
    , scrapCompaniesAsync
    , scrapOrderHistoryAsync
    , scrapSettleHistoryAsync
}