/**
 * file name   : src/batch/scrap/yessin/common/batchScrapCommon.js
 * description : 여신금융협회 스크래핑 함수 모음
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

// 스크래핑 모듈
const {
    requestLoginAsync
    , requestSearchCompaniesAsync
    , requestApprovalsAsync
    , requestPurchasesAsync
    , requestDepositsAsync
} = {
    ...require('../user')
    , ...require('../appr')
    , ...require('../buy')
    , ...require('../depo')
}

/**
 * 여신금융협회 로그인 스크래핑
 * @param {{
 * ID_LOGIN:string,
 * PW_LOGIN:string,
 * SCRP_USER_ACCOUNT_SEQS:array,
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
        }

        throw err;
    })
}

/**
 * 여신금융협회 가맹점 고유 KEY 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * NO_BIZ:string,
 * SCRP_USER_ACCOUNT_SEQ:string,
 * SCRP_USER_ACTION_SEQ:string
 * }} param0 
 */
const scrapSearchCompaniesAsync = async ({
    response, NO_BIZ, SCRP_USER_ACCOUNT_SEQ, SCRP_USER_ACTION_SEQ
}) => {

    try{
        // 스크래핑
        let { result } = await requestSearchCompaniesAsync({
            response
            , businessNumber : NO_BIZ
        });

        // 기존 데이터 삭제
        await dbMng.delete(
            'scrapYessinMapper'
            , 'delYessinShopKey'
            , {
                SCRP_USER_ACCOUNT_SEQ
            }
        ).catch(err => { throw new CUSTOM_ERROR({err}) });

        if(result.store == null){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 가맹점 고유 KEY
            let { merGrpId : CD_KEY } = result.store;

            try{
                //데이터 INSERT
                await dbMng.insert(
                    'scrapYessinMapper'
                    , 'instYessinShopKey'
                    , {
                        SCRP_USER_ACCOUNT_SEQ
                        , CD_KEY
                    }
                );
            }catch(err){
                if(err.code != 'ER_DUP_ENTRY'){
                    throw new CUSTOM_ERROR({err});
                }
            }

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        err = new CUSTOM_ERROR({err});

        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, code : err.code, message : err.message});
    }
}

/**
 * 여신금융협회 승인내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:string,
 * SCRP_USER_ACCOUNT_SEQ:string,
 * CD_KEY:string,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * SCRP_USER_ACTION_SEQ:string
 * }} param0 
 */
const scrapApprovalsAsync = async ({
    response
    , AD_STORE_INFO_SEQ
    , SCRP_USER_ACCOUNT_SEQ
    , CD_KEY
    , DT_STR
    , DT_END
    , SCRP_USER_ACTION_SEQ
}) => {

    try{
        // 스크래핑
        let list = await requestApprovalsAsync({
            response
            , merGrpId : CD_KEY
            , fromDate : DT_STR
            , toDate : DT_END
        });

        // 기존 데이터 삭제
        await dbMng.delete(
            'scrapYessinMapper'
            , 'delYessinApprovals'
            , {
                AD_STORE_INFO_SEQ
                , SCRP_USER_ACCOUNT_SEQ
                , DT_STR
                , DT_END
            }
        ).catch(err => { throw new CUSTOM_ERROR({err}) });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 건 by 건 INSERT
            for(let data of list){
                try{
                    // 데이터 INSERT
                    await dbMng.insert(
                        'scrapYessinMapper'
                        , 'instYessinApprovals'
                        , {
                            AD_STORE_INFO_SEQ
                            , SCRP_USER_ACCOUNT_SEQ
                            , ...data
                        }
                    )
                }catch(err){
                    if(err.code != 'ER_DUP_ENTRY'){
                        throw new CUSTOM_ERROR({err});
                    }
                }
            }

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, code : err.code, message : err.message});
    }
}

/**
 * 여신금융협회 매입내역 스크래핑 & 장부생성 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:string,
 * SCRP_USER_ACCOUNT_SEQ:string,
 * CD_KEY:string,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * SCRP_USER_ACTION_SEQ:string
 * }} param0 
 */
const scrapPurchasesAsync = async ({
    response
    , AD_STORE_INFO_SEQ
    , SCRP_USER_ACCOUNT_SEQ
    , CD_KEY
    , DT_STR
    , DT_END
    , SCRP_USER_ACTION_SEQ
}) => {

    try{
        // 스크래핑
        let list = await requestPurchasesAsync({
            response
            , merGrpId : CD_KEY
            , fromDate : DT_STR
            , toDate : DT_END
        });

        // 기존 데이터 삭제
        await dbMng.delete(
            'scrapYessinMapper'
            , 'delYessinPurchases'
            , {
                AD_STORE_INFO_SEQ
                , SCRP_USER_ACCOUNT_SEQ
                , DT_STR
                , DT_END
            }
        ).catch(err => { throw new CUSTOM_ERROR({err}) });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 건 by 건 INSERT
            for(let data of list){
                try{
                    // 데이터 INSERT
                    await dbMng.insert(
                        'scrapYessinMapper'
                        , 'instYessinPurchases'
                        , {
                            AD_STORE_INFO_SEQ
                            , SCRP_USER_ACCOUNT_SEQ
                            , ...data
                        }
                    )
                }catch(err){
                    if(err.code != 'ER_DUP_ENTRY'){
                        throw new CUSTOM_ERROR({err});
                    }
                }
            }

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, code : err.code, message : err.message});
    }
}

/**
 * 여신금융협회 입금내역 스크래핑 & INSERT
 * @see scrapLoginAsync
 * @param {{
 * response:Response,
 * AD_STORE_INFO_SEQ:string,
 * SCRP_USER_ACCOUNT_SEQ:string,
 * CD_KEY:string,
 * DT_STR:'YYYYMMDD',
 * DT_END:'YYYYMMDD',
 * SCRP_USER_ACTION_SEQ:string
 * }} param0 
 */
const scrapDepositsAsync = async ({
    response
    , AD_STORE_INFO_SEQ
    , SCRP_USER_ACCOUNT_SEQ
    , CD_KEY
    , DT_STR
    , DT_END
    , SCRP_USER_ACTION_SEQ
}) => {

    try{
        // 스크래핑
        let list = await requestDepositsAsync({
            response
            , merGrpId : CD_KEY
            , fromDate : DT_STR
            , toDate : DT_END
        });

        // 기존 데이터 삭제
        await dbMng.delete(
            'scrapYessinMapper'
            , 'delYessinADeposits'
            , {
                AD_STORE_INFO_SEQ
                , SCRP_USER_ACCOUNT_SEQ
                , DT_STR
                , DT_END
            }
        ).catch(err => { throw new CUSTOM_ERROR({err}) });

        if(list.length == 0){
            // 성공 => 데이터 없을 때
            await successScrapUserNoData({SCRP_USER_ACTION_SEQ});
        }else{

            // 건 by 건 INSERT
            for(let data of list){
                try{
                    // 데이터 INSERT
                    await dbMng.insert(
                        'scrapYessinMapper'
                        , 'instYessinDeposits'
                        , {
                            AD_STORE_INFO_SEQ
                            , SCRP_USER_ACCOUNT_SEQ
                            , ...data
                        }
                    )
                }catch(err){
                    if(err.code != 'ER_DUP_ENTRY'){
                        throw new CUSTOM_ERROR({err});
                    }
                }
            }

            // 성공
            await successScrapUser({SCRP_USER_ACTION_SEQ});
        }
    }catch(err){
        // 개별 스크래핑 실패
        await failScrapUser({SCRP_USER_ACTION_SEQ, code : err.code, message : err.message});
    }
}

module.exports = {
    scrapLoginAsync
    , scrapSearchCompaniesAsync
    , scrapApprovalsAsync
    , scrapPurchasesAsync
    , scrapDepositsAsync
}