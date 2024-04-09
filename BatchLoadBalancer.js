/**
 * file name   : BatchLoadBalancer.js
 * description : 배치 로드벨런서
 * notice      : 배치 fork로 다수 실행 할 수 있음
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초 생성
 */
const cluster = require('cluster');

// 클러스터 > fork로 Batch서버 실행
( async () => {

    if(cluster.isMaster){

        // 배치 시작 시 pid 정보 저장
        let BATCH_START_PID_INFO = {};

        // worker 모음
        let WORKERS = {};

        cluster.on('online', function (worker) {
            WORKERS[worker.process.pid] = {
                runCount : 0
                , id : worker.id
                , worker
            };
            console.log(`Worker ${worker.process.pid + ' : ' + worker.id} is online.`);
        });
        cluster.on('exit', (worker, code, signal) => {
            delete WORKERS[worker.process.pid];
            console.log(`worker ${worker.process.pid + ' : ' + worker.id} died`);
        });

        // fork 실행 파일 지정
        cluster.settings.exec = `${require('path').join(__dirname, 'BatchServer.js')}`;

        // fork 4개 실행
        for(let i = 0; i < 4; i++){
            cluster
                .fork({
                    SYSTEM : process.env.SYSTEM
                    , PORT : process.env.PORT
                })
                // fork로 부터온 메세지(진행상태)
                .on('message', (response) => {
                    let { BATCH_HISTORY_SEQ } = response;
                    switch(response?.code){

                        case "READY_OK" : // 준비 요청 완료
                            let {START_CODE} = response;

                            // 시작정보 QUEUE에 담기 > 기존 시작정보는 삭제
                            BATCH_QUEUE[BATCH_HISTORY_SEQ] = Object.assign({}, BATCH_START_PID_INFO[START_CODE]);
                            delete BATCH_START_PID_INFO[START_CODE];

                            // 해당 프로세스 진행 개수 증가 (프로세스 순차적으로 실행하기 위함)
                            WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].runCount++;

                            // 서버 전송(실행)
                            sendBatch({
                                code : 'RUN',
                                BATCH_HISTORY_SEQ, 
                                worker : WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].worker
                            });
                        break;

                        case "RUN" :            // 실행중 상태
                        case "RUN_OK" :         // 실행 요청 완료
                        case "STOPPING_OK" :    // 정지중 요청 완료
                        case "PAUSING_OK" :     // 일시정지 요청 완료
                        case "UNPAUSING_OK" :   // 일시정지 해제 요청 완료
                        case "PAUSE" :          // 일시정지 상태
                        case "STANDBY" :        // 순서대기중 상태
                            if(BATCH_QUEUE[BATCH_HISTORY_SEQ]){
                                BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS = (response.code.replace('_OK', '')).toUpperCase();
                            }
                        break;

                        case "COMPLETE" : case "ERROR" : case "STOP" : // 성공, 오류, 정지 상태 QUEUE 삭제
                            // 진행 개수 차감
                            WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].runCount--;

                            // 해당 진행 상태 삭제처리
                            delete BATCH_QUEUE[BATCH_HISTORY_SEQ];
                        break;
                    }
                });
        }

        // ===============================================================

        /**
         * 다음 실행 fork 가져오기
         */
        const getNextRunnerForkPid = () => {
            let runCount = 0;
            while(true){
                for(let pid in WORKERS){
                    if(WORKERS[pid].runCount == runCount){
                        return pid;
                    }
                }
                runCount++;
            };
        }

        /**
         * fork를 순차적으로 데이터 송수신
         * @param {{
         * code:string,
         * BATCH_HISTORY_SEQ?:string|integer
         * data?:any,
         * worker:cluster.Worker
         * }} param
         */
        const sendBatch = ({code, BATCH_HISTORY_SEQ = '', data = {}, worker}) => {
            return worker.send({code, data, BATCH_HISTORY_SEQ}, (error) => {
                if(error != null){
                    console.error(error)
                }
            });
        }

        const leftPad = (str, len, padd_str = '0') => {
            str = String(str);
            return str.length >= len ? str : new Array(len - str.length + 1).join(padd_str) + str;
        }

        // ===============================================================
        
        // 서버 실행
        const express = require('express');
        const app = express();
        const bodyParser = require('body-parser');
        require('date-utils');

        app.use(bodyParser.urlencoded({extended: true, limit:'50mb'}));
        app.use(bodyParser.json({limit:'50mb'}));

        let BATCH_QUEUE = {};
        let BATCH_STATUS_INFO = {
            'READY' : '설정 준비중'
            , 'RUN' : '진행중'
            , 'STOPPING' : '중지중...'
            , 'PAUSING' : '일시정지중...'
            , 'PAUSE' : '일시정지'
            , 'UNPAUSING' : '일시정지 해제중...'
            , 'STANDBY' : '순서 대기중...'
            , 'UNSTANDBY' : '실행 진행중...'
        }

        // 배치 실행
        app.post('/run', (req, res, next) => {
            let {PATH, FUNC} = req.body;
            delete req.body.PATH;
            delete req.body.FUNC;

            let WORKER_PID = getNextRunnerForkPid();
            // let SEQ = `${WORKERS[WORKER_PID].id}${leftPad(BATCH_RUN_SEQ++, 5)}`;
            let START_CODE = `${WORKERS[WORKER_PID].id}${leftPad(Math.floor(Math.random() * 10000), 5)}`;

            // 진행사항 체크용 정보
            BATCH_START_PID_INFO[START_CODE] = {
                STATUS : 'READY'
                , PATH
                , PARAMS : (JSON.stringify(req.body).length < 100)? JSON.stringify(req.body) : (JSON.stringify(req.body).substring(0, 100) + '...')
                , FUNCTION : FUNC
                , DATETIME : new Date().toFormat('YYYY-MM-DD HH24:MI:SS')
                , WORKER_PID
            };

            // 서버 전송(실행)
            sendBatch({
                code : 'READY',
                data : {
                    PARAMS : req.body,
                    PATH : PATH,
                    FUNCTION : FUNC,
                    START_CODE
                },
                worker : WORKERS[WORKER_PID].worker
            });

            res.send('배치를 실행하였습니다.');
        });

        // 스크래핑 진행상태
        app.post('/status', (req, res, next) => {
            let message = '';
            for(let BATCH_HISTORY_SEQ in BATCH_QUEUE){
                message += (message!= ''? ',\n' : '')
                    + '{\n'
                    + `\t시퀀스 : ${BATCH_HISTORY_SEQ}\n`
                    + `\t상태 : ${BATCH_STATUS_INFO[BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS]}\n`
                    + `\t경로 : ${BATCH_QUEUE[BATCH_HISTORY_SEQ].PATH}\n`
                    + `\t파라미터 : ${BATCH_QUEUE[BATCH_HISTORY_SEQ].PARAMS}\n`
                    + `\t함수 : ${BATCH_QUEUE[BATCH_HISTORY_SEQ].FUNCTION}\n`
                    + `\t요청일시 : ${BATCH_QUEUE[BATCH_HISTORY_SEQ].DATETIME}\n`
                    + '}';
            }
            if(message == ''){
                message = '요청한 배치가 없습니다.';
            }
            res.send(message);
        });
        
        // 중지 요청
        app.post('/stop', (req, res, next) => {
            let { BATCH_HISTORY_SEQ } = req.body;

            if(BATCH_QUEUE[BATCH_HISTORY_SEQ] == undefined){
                res.send('해당 일련번호가 조회가 되지 않습니다.');
                return;
            }
            else if(BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS == 'STOPPING'){
                res.send('이미 중지 요청이 되었입니다.');
                return;
            }

            // 서버 전송(중지요청)
            sendBatch({
                code : 'STOPPING',
                BATCH_HISTORY_SEQ,
                worker : WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].worker
            });

            res.send('중지 요청 되었습니다.');
        });

        // 일시 정지 요청
        app.post('/pause', (req, res, next) => {
            let { BATCH_HISTORY_SEQ } = req.body;
        
            if(BATCH_QUEUE[BATCH_HISTORY_SEQ] == undefined){
                res.send('해당 일련번호가 조회가 되지 않습니다.');
                return;
            }
            else if(BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS == 'PAUSING'){
                res.send('이미 일시 정지 요청이 되었입니다.');
                return;
            }
            else if(BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS == 'PAUSE'){
                res.send('이미 일시 정지 상태입니다.');
                return;
            }

            // 서버 전송(정지요청)
            sendBatch({
                code : 'PAUSING',
                BATCH_HISTORY_SEQ,
                worker : WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].worker
            });

            res.send('일시정지 요청 되었습니다.');
        });
        
        // 일시 정지 해재 요청
        app.post('/unpause', (req, res, next) => {
            let { BATCH_HISTORY_SEQ } = req.body;

            if(BATCH_QUEUE[BATCH_HISTORY_SEQ] == undefined){
                res.send('해당 일련번호가 조회가 되지 않습니다.');
                return;
            }
            else if(BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS != 'PAUSE'){
                res.send('일시정지 상태가 아닙니다.');
                return;
            }
            else if(BATCH_QUEUE[BATCH_HISTORY_SEQ].STATUS == 'UNPAUSING'){
                res.send('이미 일시정지 해재요청이 되었입니다.');
                return;
            }

            // 서버 전송(정지요청)
            sendBatch({
                code : 'UNPAUSING',
                BATCH_HISTORY_SEQ,
                worker : WORKERS[BATCH_QUEUE[BATCH_HISTORY_SEQ].WORKER_PID].worker
            });

            res.send('일시정지 요청 되었습니다.');
        });

        app.listen(process.env.PORT, function(){
            console.log(`BATCH LOAD BALANCER listen: ${process.env.PORT}`);
        });

    }
})();