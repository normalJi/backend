/**
 * file name   : src/batch/scrap/baemin/common/batchScrapCommon.js
 * description : 배달의 민족 스크래핑 함수 모음
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

// 배달의 민족 스크래핑 모듈
const {
    requestLoginAsync
    , requestSettleHistoryAsync
    , requestOrderHistoryAsync
} = {
    ...require('../user')
    , ...require('../order')
    , ...require('../settle')
}

/**
 * 배달의 민족 로그인 스크래핑
 * @param {{
 * ID_LOGIN:string,
 * PW_LOGIN:string,
 * SCRP_USER_ACCOUNT_SEQS:array
 * }} param0 
 */
const scrapLoginAsync = async({ID_LOGIN, PW_LOGIN, SCRP_USER_ACCOUNT_SEQS}) => {
    return await requestLoginAsync({
        id : ID_LOGIN,
        password : PW_LOGIN
    }).catch( async (err) => {
        // 계정오류시 table 저장
        if(err.code == 'ACCOUNT_ERROR'){
            await accountError({ SCRP_USER_ACCOUNT_SEQS, code : err.code, message : err.message });

            // 로그인 되는 아이디로 로그인하기(*캡챠를 피하기 위함)
            await requestLoginAsync({
                id : '3friends',
                password : 'tpclsrn1!2022'
            }).catch(()=>{});
        }

        throw err;
    });
}


/**
 * 배달의 민족 > 주문내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * BATCH_HISTORY_SEQ:number|string,
 * AD_STORE_INFO_SEQ:number|string,
 * SCRP_USER_ACCOUNT_SEQ:number|string,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * TP_SITE:string,
 * SCRP_USER_ACTION_SEQ:string,
 * ID_REG_USER:string
 * }} param0 
 */
const scrapOrderHistoryAsync = async ({
    response, AD_STORE_INFO_SEQ, SCRP_USER_ACCOUNT_SEQ, DT_STR, DT_END, SCRP_USER_ACTION_SEQ
}) => {

    // DB
    let connection = null;

    try{
        // 스크래핑
        let list = await requestOrderHistoryAsync({
            response
            , fromDate : DT_STR
            , toDate : DT_END
        });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 주문내역, 메뉴 삭제
            await dbMng.delete(
                'scrapBaeminMapper'
                , 'delBaeminOrder'
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
                        , 'scrapBaeminMapper'
                        , 'instBaeminOrder'
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
                            , 'scrapBaeminMapper'
                            , 'instBaeminOrderItem'
                            , {
                                AD_STORE_INFO_SEQ
                                , SCRP_USER_ACCOUNT_SEQ
                                , NO_SHOP : data.NO_SHOP
                                , NO_ORDER : data.NO_ORDER
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
 * 배달의 민족 > 정산내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:number|string,
 * SCRP_USER_ACCOUNT_SEQ:number|string,
 * SCRP_USER_ACTION_SEQ:number|string,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * }} param0 
 */
const scrapSettleHistoryAsync = async ({
    response, AD_STORE_INFO_SEQ, SCRP_USER_ACCOUNT_SEQ, SCRP_USER_ACTION_SEQ, DT_STR, DT_END
}) => {

    // DB
    let connection = null;

    try{
        // 스크래핑
        let list = await requestSettleHistoryAsync({
            response
            , fromDate : DT_STR
            , toDate : DT_END
        });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 주문내역, 메뉴 삭제
            await dbMng.delete(
                'scrapBaeminMapper'
                , 'delBaeminSettle'
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
                    , 'scrapBaeminMapper'
                    , 'instBaeminSettle'
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
        await failScrapUser({SCRP_USER_ACTION_SEQ, code : err.code, message : err.message});

        if(connection) await connection.rollback();
    }finally{
        if(connection) await connection.release();
    }
}

module.exports = {
    scrapLoginAsync
    , scrapOrderHistoryAsync
    , scrapSettleHistoryAsync
}