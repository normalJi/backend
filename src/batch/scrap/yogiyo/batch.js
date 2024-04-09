/**
 * file name   : src/batch/scrap/yogiyo/batch.js
 * description : 요기요 배치
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');
const { decrypt } = require('../../../../common/common.js');
const { CUSTOM_ERROR } = require('../../comm/error.js');

// 스크래핑 로그관리용
const { 
    runningScrap
    , failAllScrap
    , failScrapUser
} = require('../../comm/scrapHistoryHandler');

// 스크래핑 회원 작업
const { 
    setScrapUser
    , getScrapUsersAccount
    , setDaliyScrapUser
    , getUserScrapInfo
} = require('../common/user/scrapBatchUser.js');

// 요기요 스크래핑 & INSERT 함수
const { 
    scrapLoginCEOAsync
    , scrapLoginBOSSAsync
    , scrapOrderHistoryAsync
    , scrapSettleHistoryAsync
} = require('./common/batchScrapCommon');

module.exports = {

    // 수동 스크래핑 진행
    manual : async ({BATCH_HISTORY_SEQ, NO_BIZ, CD_TRAN, DT_STR, DT_END, ID_REG_USER}, BATCH_STATUS_LISTENER) => {

        // 인자값 체크
        nullCheck({BATCH_HISTORY_SEQ, CD_TRAN});
        blankCheck({BATCH_HISTORY_SEQ, CD_TRAN});

        // 스크래핑 실행계획 등록 및 시퀀스 값 가져오기
        await setScrapUser({ 
            BATCH_HISTORY_SEQ
            , NO_BIZ
            , TP_SITE : 'yogiyo'
            , CD_TRAN
            , DT_STR
            , DT_END
            , ID_REG_USER 
        });

        // 스크래핑 시작
        await scrapRun({ BATCH_HISTORY_SEQ, BATCH_STATUS_LISTENER });
    },

    // 일별 스크래핑
    daily : async ({BATCH_HISTORY_SEQ}, BATCH_STATUS_LISTENER) => {

        // 추가 스크래핑 요청(합계랑 같이 진행)
        await setDaliyScrapUser({
            BATCH_HISTORY_SEQ
            , TP_SITE : 'yogiyo'
        });

        // 스크래핑 시작
        await scrapRun({ BATCH_HISTORY_SEQ, BATCH_STATUS_LISTENER });
    },
}

// ====================================================================================

// 배치 이벤트 리스너
const batchListener = async ({BATCH_STATUS_LISTENER = null, STATUS = null, BATCH_ERROR_FUNC = null}) => {
    if(BATCH_STATUS_LISTENER){
        try{
            await BATCH_STATUS_LISTENER(STATUS);
        }catch(err){
            if (BATCH_ERROR_FUNC) await BATCH_ERROR_FUNC(err);
            throw err;
        }
    }
}

// ====================================================================================

// 스크래핑 실행
const scrapRun = async ({ BATCH_HISTORY_SEQ, BATCH_STATUS_LISTENER}) => {

    // 현재 동일 사이트 스크래핑 진행중인지 체크 > 진행중일시 : "순서대기중" 상태 변경
    let scrapRunYN = 'N';
    do{
        let currScrapRunYN = await runningScrap({BATCH_HISTORY_SEQ});
        if(scrapRunYN != currScrapRunYN){
            scrapRunYN = currScrapRunYN;
            await batchListener({BATCH_STATUS_LISTENER, STATUS : (scrapRunYN == 'Y'? 'STANDBY' : 'UNSTANDBY')});
        }
    }while(scrapRunYN == 'Y');

    // =================================================================================

    // 실행계획에 등록된 계정 전체 가져오기
    let targets = await getScrapUsersAccount({ BATCH_HISTORY_SEQ });
    do{

        // 사업자 번호별 스크래핑 진행
        for(let { SCRP_USER_ACCOUNT_SEQS, NO_BIZS, CD_TRANS, ID_LOGIN, PW_LOGIN } of targets){

            // 배치 정지 이벤트
            await batchListener({BATCH_STATUS_LISTENER, BATCH_ERROR_FUNC : async (err) => {
                // 배치 정지시 스크래핑 "STOP:중지됨" 처리
                await failAllScrap({ BATCH_HISTORY_SEQ, ...err });
            }});

            try{

                // CD_TRAN별 싸이트 로그인 구분
                const CD_TRAN_FOR_LOGIN = {
                    CEO : {
                        CD_TRAN : ['yogiyo_o']
                        , login : scrapLoginCEOAsync
                        , targets : []
                        , response : null
                    }
                    , BOSS : {
                        CD_TRAN : ['yogiyo_p']
                        , login : scrapLoginBOSSAsync
                        , targets : []
                        , response : null
                    }
                }
                for(let CD_TRAN of CD_TRANS){
                    if(CD_TRAN_FOR_LOGIN.CEO.CD_TRAN.includes(CD_TRAN)){
                        CD_TRAN_FOR_LOGIN.CEO.targets.push(CD_TRAN);
                    }else if(CD_TRAN_FOR_LOGIN.BOSS.CD_TRAN.includes(CD_TRAN)){
                        CD_TRAN_FOR_LOGIN.BOSS.targets.push(CD_TRAN);
                    }
                }

                for(let i = 0; i < SCRP_USER_ACCOUNT_SEQS.length; i++){
                    let SCRP_USER_ACCOUNT_SEQ = SCRP_USER_ACCOUNT_SEQS[i];
                    let NO_BIZ = NO_BIZS[i];

                    // 요청한 CD_TRAN별 로그인 > 계정에 사업장이 등록되어 있는지 체크
                    for(let LOGIN_SITE of Object.keys(CD_TRAN_FOR_LOGIN)){
                        let {targets, login} = CD_TRAN_FOR_LOGIN[LOGIN_SITE];
                        if(targets.length > 0){

                            let response = await login({
                                ID_LOGIN : String(ID_LOGIN).trim()
                                , PW_LOGIN : String(decrypt(PW_LOGIN)).trim()
                                , SCRP_USER_ACCOUNT_SEQS    // 로그인 실패 시 해당 사업자 전체 업데이트용
                            });

                            let useBusiness = false;
                            if(LOGIN_SITE == 'CEO'){
                                response.userData.companys = response.userData.companys.filter((v) => {
                                    return v.company_number.replace(/-/g, '') == NO_BIZ;
                                });
                                if(response.userData.companys.length <= 0) useBusiness = true;
                            }else if(LOGIN_SITE == 'BOSS'){
                                response.userData.company_numbers = response.userData.company_numbers.filter((v) => {
                                    return v.replace(/-/g, '') == NO_BIZ;
                                });
                                if(response.userData.company_numbers.length <= 0) useBusiness = true;
                            }
                            CD_TRAN_FOR_LOGIN[LOGIN_SITE].response = response;

                            if(useBusiness){
                                await failScrapUser({
                                    BATCH_HISTORY_SEQ
                                    , SCRP_USER_ACCOUNT_SEQ
                                    , CD_TRAN : targets
                                    , code : 'NO_BUSINESSNUMBER_FOR_STORE_REGISTER'
                                    , message : '사업자 번호에 해당하는 가맹점이 등록되지 않았습니다.'
                                });
                                continue;
                            }
                        }
                    }

                    // 해당 사업자번호의 돌릴 스크래핑 정보 가져오기
                    let userScrapInfos = await getUserScrapInfo({ BATCH_HISTORY_SEQ, SCRP_USER_ACCOUNT_SEQ });

                    // CD_TRAN 기준 모듈 정리
                    let CD_TRANforScrapModules = userScrapInfos.reduce((prev, userScrapInfo) => {
                        let module = '';
                        let response;
                        switch(userScrapInfo.CD_TRAN){
                            case "yogiyo_o" :   // 주문내역
                                module = scrapOrderHistoryAsync;
                                response = CD_TRAN_FOR_LOGIN.CEO.response;
                            break;
                            case "yogiyo_p" :   // 정산내역
                                module = scrapSettleHistoryAsync;
                                response = CD_TRAN_FOR_LOGIN.BOSS.response;
                            break;
                            default : return prev;
                        }

                        if(!prev[userScrapInfo.CD_TRAN]) prev[userScrapInfo.CD_TRAN] = [];
                        prev[userScrapInfo.CD_TRAN].push({
                            module
                            , userScrapInfo : {
                                ...userScrapInfo
                                , response
                                , NO_BIZ
                            }
                        })
                        return prev;
                    }, {});

                    // 모듈 완료될 때 까지 대기
                    await Promise.all([
                        new Promise( async (resolve) => {
                            let modules = [];
                            for(let CD_TRAN in CD_TRANforScrapModules){
                                modules.push(
                                    new Promise( async (_resolve) => {
                                        for(let {module, userScrapInfo} of CD_TRANforScrapModules[CD_TRAN]){
                                            await module(userScrapInfo);
                                        }
                                        _resolve();
                                    })
                                )
                            }
                            await Promise.all(modules);
                            resolve();
                        })
                    ]);
                }
            }catch(err){
                err = new CUSTOM_ERROR({err});
                // 계정 오류 > 오류 상태 업데이트 (NO_BIZS for문 정지)
                for(let SCRP_USER_ACCOUNT_SEQ of SCRP_USER_ACCOUNT_SEQS){
                    await failScrapUser({
                        BATCH_HISTORY_SEQ, SCRP_USER_ACCOUNT_SEQ, ...err
                    });
                }
            }
        }

        // 실행계획에 등록된 계정 더 있는지 확인 후 돌리기(추가건 돌리기 위함)
        targets = await getScrapUsersAccount({ BATCH_HISTORY_SEQ });

    }while(targets.length > 0);
}