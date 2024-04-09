/**
 * file name   : src/batch/scrap/yessin/batch.js
 * description : 여신금융협회 배치
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */

const { nullCheck, blankCheck } = require('../../comm/scrapCommon.js');
const { decrypt } = require('../../../../common/common.js');

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

// 여신금융협회 스크래핑 & INSERT 함수
const { 
    scrapLoginAsync
    , scrapSearchCompaniesAsync
    , scrapApprovalsAsync
    , scrapPurchasesAsync
    , scrapDepositsAsync
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
            , TP_SITE : 'yessin'
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
            , TP_SITE : 'yessin'
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
        for(let { SCRP_USER_ACCOUNT_SEQS, NO_BIZS, ID_LOGIN, PW_LOGIN } of targets){

            // 배치 정지 이벤트
            await batchListener({BATCH_STATUS_LISTENER, BATCH_ERROR_FUNC : async (err) => {
                // 배치 정지시 스크래핑 "STOP:중지됨" 처리
                await failAllScrap({ BATCH_HISTORY_SEQ, ...err });
            }});

            try{
                // 로그인
                let response = await scrapLoginAsync({
                    ID_LOGIN : String(ID_LOGIN).trim()
                    , PW_LOGIN : String(decrypt(PW_LOGIN)).trim()
                    , SCRP_USER_ACCOUNT_SEQS    // 로그인 실패 시 해당 사업자 전체 업데이트용
                });

                for(let i = 0; i < SCRP_USER_ACCOUNT_SEQS.length; i++) {
                    let SCRP_USER_ACCOUNT_SEQ = SCRP_USER_ACCOUNT_SEQS[i];
                    let NO_BIZ = NO_BIZS[i];
                    
                    // 해당 사업자번호의 돌릴 스크래핑 정보 가져오기
                    let userScrapInfos = await getUserScrapInfo({ BATCH_HISTORY_SEQ, SCRP_USER_ACCOUNT_SEQ });

                    // CD_TRAN 기준 모듈 정리
                    let CD_TRANforScrapModules = userScrapInfos.reduce((prev, userScrapInfo) => {
                        let module = '';
                        switch(userScrapInfo.CD_TRAN){
                            case "yessin_key" : module = scrapSearchCompaniesAsync;     break;  // 가맹점 고유 키
                            case "yessin1" :    module = scrapApprovalsAsync;           break;  // 승인내역
                            case "yessin2" :    module = scrapPurchasesAsync;           break;  // 매입내역
                            case "yessin3" :    module = scrapDepositsAsync;            break;  // 입금(정산)내역
                            default : return prev;
                        }

                        if(!prev[userScrapInfo.CD_TRAN]) prev[userScrapInfo.CD_TRAN] = [];
                        prev[userScrapInfo.CD_TRAN].push({
                            module
                            , userScrapInfo
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
                                            await module({ response, ...userScrapInfo, NO_BIZ });
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
                // 계정오류 상태 업데이트
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