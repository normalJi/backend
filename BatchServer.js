/**
 * file name   : BatchServer.js
 * description : 배치 실행에 실질적인 소스
 * notice      : 배치 fork 하나당 실행 수행
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초 생성
 */

// Database
const dbMng = require('./config/dbInfo');
const { CUSTOM_ERROR } = require('./src/batch/comm/error');
require('date-utils');

( async () => {

    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(() => {resolve()}, ms));
    }

    const sendLoadBalancerMessage = (code, BATCH_HISTORY_SEQ, START_CODE = '') => {
        process.send({
            code
            , BATCH_HISTORY_SEQ
            , START_CODE
        });
    }

    let BATCH_QUEUE_STATUS = {};

    //마스터와 송수신
    process.on('message', (request) => {
        batchStatus({
            ...request  // BatchLoadBalancer에서 보내주는 값 들
            , SEND_STATUS : `${request.code.toUpperCase()}_OK`
        });
    });

    const batchStatus = async ({ BATCH_HISTORY_SEQ, code, message, data, SEND_STATUS, endFlag = 'N' }) => {
        switch(code){
            case "READY" : 
                message = '준비중';
                let { PARAMS, PATH, FUNCTION } = data;
                BATCH_HISTORY_SEQ = await insertBatchHistory({PARAMS, PATH, FUNCTION});
            break;

            case "RUN" :
                message = '진행중';
                // 배치 실행
                await BatchStartAsync({
                    BATCH_HISTORY_SEQ
                });
                // 실행 중 오류가 있으면
                if(BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] != 'RUN'){
                    return;
                }
            break;

            case "STOPPING" : 
                message = '중지중...';
            break;

            case "STOP" : 
                message = '중지됨';
            break;

            case "PAUSING" :
                message = '일시정지중...';
            break;

            case "PAUSE" :
                message = '일시정지';
            break;

            case "STANDBY" :
                message = '순서대기중...';
            break;

            case "UNPAUSING" : 
                message = '일시정지 해제중...';
            break;

            case "UNPAUSE" : 
            case "UNSTANDBY" :
                code = 'RUN';
                message = '진행중';
            break;
        }

        // 중지는 이벤트에서 처리
        if(code != 'READY'){ // 이미 INSERT 할 때 ready 상태로 설정됨
            // 배치 상태 업데이트
            await updateBatchHistoryStatus({
                BATCH_HISTORY_SEQ
                , endFlag
                , code
                , message
            });
        }
        // 처리 완료 MASTER에게 전달
        sendLoadBalancerMessage(SEND_STATUS || code, BATCH_HISTORY_SEQ, data?.START_CODE);

        BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] = code;
        return BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] + '';
    }

    // 배치 히스토리 INSERT
    const insertBatchHistory = ({PARAMS, PATH, FUNCTION}) => {
        return dbMng
            .insert(
                'batchServerMapper'
                , 'instBatchHistory'
                , {
                    DC_PATH : PATH
                    , DC_FUNCTION : FUNCTION
                    , DC_PARAMS : (Object.keys(PARAMS).length > 0)? JSON.stringify(PARAMS) : ''
                }
            )
            .then(value => value.insertId)
            .catch((err) => {
                throw new CUSTOM_ERROR({err});
            });
    }

    const updateBatchHistoryStatus = ({BATCH_HISTORY_SEQ, endFlag = 'N', code, message}) => {
        return dbMng
            .update(
                'batchServerMapper'
                , (endFlag == 'N')? 'updBatchHistoryStatus' : 'updBatchHistoryClose'
                , {
                    CD_RESULT : code,
                    DC_RESULT : message,
                    BATCH_HISTORY_SEQ
                }
            )
            .catch((err) => {
                console.log(err);
            });
    }

    // 배치 실행 Promise
    const BatchStartAsync = ({BATCH_HISTORY_SEQ}) => {      
        const healthCheckInterval = setInterval(async ()=>{
            try{
                await dbMng.update(
                    'batchServerMapper'
                    , 'updBatchHistoryRunningTime'
                    , { BATCH_HISTORY_SEQ }
                )
            }catch(error){}
        }, 5000);
        
        return new Promise(async (resolve, reject) => {
            try{
                // 배치 정보 가져오기
                let {DC_PATH, DC_FUNCTION, DC_PARAMS} = await dbMng
                    .select(
                        'batchServerMapper'
                        , 'getBatchHistoryInfo'
                        , { BATCH_HISTORY_SEQ }
                    )
                    .then(value => {
                        if(value[0].DC_PARAMS){
                            value[0].DC_PARAMS = JSON.parse(value[0].DC_PARAMS.replace(/\\/g, ''));
                        }
                        return value[0];
                    })
                    .catch((err) => {
                        throw new CUSTOM_ERROR({err});
                    });

                // ===============================================================

                let PREV_BATCH_STATUS = BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] = 'RUN';
                // 해당 배치 파일 찾아가서 파일 함수 불러오기
                let requireFunc = require(DC_PATH)[DC_FUNCTION];
                resolve();

                // 해당 함수 실행
                await requireFunc(
                    {
                        ...DC_PARAMS
                        , BATCH_HISTORY_SEQ
                    }
                    // 배치 상태에 변경 및 이벤트
                    , async (STATUS = null) => {
                        
                        // 소스상에서 상태를 변경 할 때
                        if(STATUS && !(BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] == 'RUN' && STATUS == 'UNSTANDBY')){
                            BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] = STATUS;
                        }

                        do{
                            // 서버에서 상태변경 요청일 때
                            if(PREV_BATCH_STATUS != BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ]){
                                switch(BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ]){
                                    case "STOPPING" :   throw new CUSTOM_ERROR({code : 'STOP', message : '중지됨'});
                                    case "PAUSING" :    BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] = 'PAUSE';        break;
                                    case "UNPAUSING" :  BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] = 'UNPAUSE';      break;
                                }

                                // 서버에서 요청한 상태로 변경 완료 처리
                                PREV_BATCH_STATUS = await batchStatus({
                                    BATCH_HISTORY_SEQ, 
                                    code : BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ]
                                });
                            }

                            // 상태별 타임아웃
                            switch(BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ]){
                                case "PAUSE" : 
                                    await sleep(5000);
                                continue;

                                case "STANDBY" : 
                                    await sleep(30000);
                                break;
                            }

                            break;
                        }while(true);
                    }
                );
            }catch(err){
                console.log(err)
                err = new CUSTOM_ERROR({err});

                // 상태 업데이트
                await batchStatus({
                    BATCH_HISTORY_SEQ, 
                    endFlag : 'Y',
                    code : (err.code == 'STOP' ? 'STOP' : 'ERROR'),
                    message : err.message,
                })
            }finally{
                clearInterval(healthCheckInterval);
                if(BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ] == 'RUN'){
                    // 완료 상태 업데이트
                    await batchStatus({
                        BATCH_HISTORY_SEQ, 
                        endFlag : 'Y',
                        code : 'COMPLETE',
                        message : '완료'
                    });
                }

                // QUEUE 삭제
                delete BATCH_QUEUE_STATUS[BATCH_HISTORY_SEQ];
            }
        });
    }
})();
