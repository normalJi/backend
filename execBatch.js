/**
 * file name   : execBatch.js
 * description : 통합 배치 실행
 * notice      : 실행 명령문 참조 ( node ./execBatch.js -h )
 * Date         Developer        Description
 * ----------------------------------------------------------------
 * 2024.02.15   pch              최초생성
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

// 서버 경로
let DEFAULT_PATH = [
    '/home/taxfriends/service/backend/sogul_admin_v2'    // 개발 경로
    , '/home/taxfriends/sogul_admin/backend'    // 운영 경로
];

// 기본 배치 파일 경로
let batchPath = __dirname.replace(/\\/g, '/');               // 로컬 기본 배치 경로
for(let defaultPath of DEFAULT_PATH){
    if(fs.existsSync(`${defaultPath}/BATCH_LOAD_BALANCER_START.json`)){
        batchPath = `${defaultPath}/src/batch`;
        break;
    }
}

const { Command } = require('commander');
const program = new Command();


( async () => {
    program
        .name('newBatchExec.js (Batch Runner)')
        .description('=============================================================\n설명 : 통합 배치 실행')
        .helpOption('-h,        --help',                    '\t\t명령문 설명')
        .option('-p,        --PATH <path>',                 `\t[*필수] 파일경로    ex) /MASTER/TEST (기본경로: ${batchPath})`)
        .option('-f,        --FUNC <function>',             '\t[*필수] 실행함수    ex) TEST_FUNCTION')
        .option('-nb,       --NO_BIZ  <사업자번호>',        '[선택]  사업자번호  ex) 3793793701,...')
        .option('-ct,       --CD_TRAN <거래구분>',          '\t[선택]  거래구분    ex) home1in,...')
        .option('-sd,       --DT_STR  <시작일자>',          '\t[선택]  시작일자')
        .option('-ed,       --DT_END  <종료일자>',          '\t[선택]  종료일자')
        .option('-igu,      --ID_REG_USER  <실행자>',       '\t[선택]  실행자 ID')
        .option('-status,   --STATUS',                      '\t[선택]  진행 상태')
        .option('-pause,    --PAUSE  <일련번호>',           '\t[선택]  일시 정지')
        .option('-unpause,  --UNPAUSE  <일련번호>',         '\t[선택]  일시 정지 해제')
        .option('-stop,     --STOP  <일련번호>',            '\t[선택]  강제종료\n\n');

    program.parse();

    // ===============================================================

    // 인자 값
    let {
        PATH, FUNC, NO_BIZ, CD_TRAN, DT_STR, DT_END, ID_REG_USER
        , STATUS, PAUSE, UNPAUSE, STOP
    } = program.opts();

    let urlPath = '/run';
    let params = null;

    // 진행 상황 확인
    if(STATUS){
        urlPath = '/status'
    }
    // 강제종료
    else if(STOP){
        params = {BATCH_HISTORY_SEQ : STOP};
        urlPath = '/stop'
    }
    // 일시 정지
    else if(PAUSE){
        params = {BATCH_HISTORY_SEQ : PAUSE};
        urlPath = '/pause'
    }
    // 일시 정지 해제
    else if(UNPAUSE){
        params = {BATCH_HISTORY_SEQ : UNPAUSE};
        urlPath = '/unpause'
    }
    // 배치 실행 오류 체크
    else if(!PATH){
        console.error(`error: required option '-p, --PATH <path>' not specified`);
        return;
    }else if(!FUNC){
        console.error(`error: required option '-f, --FUNC <function>' not specified`);
        return;
    }
    // 배치 실행 준비
    else{
        params = {
            FUNC
            , PATH : path.join(batchPath, PATH.replace(/\\/g, '/').replace(batchPath, '')).replace(/\\/g, '/')
        };
        
        if(NO_BIZ != undefined) params = Object.assign(params, {NO_BIZ : NO_BIZ.replace(/-/g, '').split(',')});
        if(CD_TRAN != undefined) params = Object.assign(params, {CD_TRAN : CD_TRAN.split(',')});
        if(DT_STR != undefined) params = Object.assign(params, {DT_STR : DT_STR.replace(/-/g, '').substring(0, 8)});
        if(DT_END != undefined) params = Object.assign(params, {DT_END : DT_END.replace(/-/g, '').substring(0, 8)});
        if(ID_REG_USER != undefined) params = Object.assign(params, {ID_REG_USER});
    }

    // 배치 요청
    let options = {
        'hostname': 'localhost',
        'port': '9102',
        'method': 'post',
        'headers' : {
            "Content-Type": "application/json",
        },
        'path': urlPath
    };
    
    let request = http.request(options, (response)=>{
        let buff_arr = [];
        
        response.once('end', async ()=>{
            let obj;
            try{
                obj = JSON.parse(Buffer.concat(buff_arr).toString('utf8'));
            }catch(e){
                obj = Buffer.concat(buff_arr).toString('utf8');
            }

            console.log(obj);
        });
        response.on('data', data => {
            if(!data) return;
            buff_arr[buff_arr.length] = data;
        });
    });

    if(params){
        request.write(JSON.stringify(params));
    }

    request.end();
})();
