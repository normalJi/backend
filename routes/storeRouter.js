/**
 * 매장관리 Router
 */

const express = require('express');
const router = express.Router();
const { makeRouterHandler, registerPostHandler } = require('./routerHandler');

// 매장관리
const PostHandlers = [
  // 메장현황 - 매장정보 리스트
  ['/api/v1/store/list', require("../src/store/store").getStoreList],  
  // 매장정보 상세조회
  ['/api/v1/store/details', require("../src/store/store").getStoreDetails],
  // 매장정보 저장
  ['/api/v1/store/save', require("../src/store/store").setStoreInfo], 
  // 매장사진 조회
  ['/api/v1/store/picture/list', require("../src/store/store").getStorePictures],  
  // 매장사진 업로드
  ['/api/v1/store/picture/upload', require("../src/store/store").addStorePicture],
  // 매장사진 삭제
  ['/api/v1/store/picture/remove', require("../src/store/store").removeStorePicture],
  // 매장정보 - 임차조건 수정
  ['/api/v1/store/lease/save', require("../src/store/store").setLease], 
  // 매장 정보 - 주소 저장 & 수정 
  ['/api/v1/store/addr/save', require("../src/store/store").setAddr], 
  ['/api/v1/store/lease/save', require("../src/store/store").setLease],
];

// 매장관리에 대한 코드성
PostHandlers.push(
  // 업종코드
  ['/api/v1/industry/code/list', require("../src/store/code").getIndustryCdList],

  // 동적 상세 건별 삭제
  ['/api/v1/store/comm/save', require("../src/store/code").setDelDynamicDetails],
  
  
) ;

// 거래처관리
PostHandlers.push(
  // 거래처관리 조회
  ['/api/v1/customer/list', require("../src/store/customer").getCustomerMngList],
  // 거래처관리 상세조회
  ['/api/v1/customer/details', require("../src/store/customer").getCustomerMngDetails],
  // 거래처관리 저장
  ['/api/v1/customer/save', require("../src/store/customer").setCustomerMng],
) ;

// 계좌정보
PostHandlers.push(
  // 계좌정보 조회
  ['/api/v1/account/list', require("../src/store/account").getAccountList],
  // 계좌정보 상세조회
  ['/api/v1/account/details', require("../src/store/account").getAccountDetails],
  // 계좌정보 저장
  ['/api/v1/account/save', require("../src/store/account").setAccountInfo],
) ;

// 투자내역
PostHandlers.push(
  // 투자내역 조회
  ['/api/v1/invest/history/list', require("../src/store/investHis").getInvestHisList],  
  // 투자내역 저장
  ['/api/v1/invest/history/save', require("../src/store/investHis").setInvestHis],
) ;

// 서류 (점주/계약)
PostHandlers.push(
  // 서류(점주/계약) 조회
  ['/api/v1/store/doc/list', require("../src/store/documents").getDocumentsList],    
  // 서류별(점주/계약) 입력 기본 항목 불러오기
  ['/api/v1/store/doc/detail', require("../src/store/documents").setDocumentsDetail],
  // 서류(점주/계약) 서류별 업데이트
  ['/api/v1/store/doc/save', require("../src/store/documents").setDocuments],
  // 서류(점주/계약) 삭제
  ['/api/v1/store/doc/delete', require("../src/store/documents").setDocumentsDel],
) ;

// // 점주서류
// PostHandlers.push(
//   // 점주서류 조회
//   ['/api/v1/invest/owner/list', require("../src/store/ownerDoc").getOwnerDocList],  
//   // 점주서류 저장
//   // ['/api/v1/invest/owner/save', require("../src/store/ownerDoc").setOwnerDoc],
//   // 점주 서류별 입력 기본 항목 불러오기
//   ['/api/v1/invest/owner/detail', require("../src/store/ownerDoc").setOwnerDetail],
//   // 점주 서류 서류별 업데이트
//   ['/api/v1/invest/owner/docIns', require("../src/store/ownerDoc").setOwnerIns],
//   // 점주 서류 삭제
//   ['/api/v1/invest/owner/delete', require("../src/store/ownerDoc").setOwnerDel],
// ) ;


// // 계약서류
// PostHandlers.push(
//   // 계약서류 조회
//   ['/api/v1/store/contract/list', require("../src/store/contractDoc").getContractDocList],    
//   // 계약 서류별 입력 기본 항목 불러오기
//   ['/api/v1/store/contract/detail', require("../src/store/contractDoc").setContractDetail],
//   // 계약 서류 서류별 업데이트
//   ['/api/v1/store/contract/docIns', require("../src/store/contractDoc").setContractIns],
//   // 계약 서류 삭제
//   ['/api/v1/store/contract/delete', require("../src/store/contractDoc").setContractDel],
// ) ;



// 매출정보
PostHandlers.push(
  // 매출정보 조회
  ['/api/v1/sales/info/list', require("../src/store/salesInfo").getSalesInfoList],
  // 매출정보 저장
  ['/api/v1/sales/info/save', require("../src/store/salesInfo").setSalesInfo],
  // 매출정보 지출 조회
  ['/api/v1/sales/spend/list', require("../src/store/salesInfo").getSpendInfoList],
  // 매출정보 지출 저장
  ['/api/v1/sales/spend/save', require("../src/store/salesInfo").setSpendInfo],
  // 매출정보 - 매출현황
  ['/api/v1/sales/status/list', require("../src/store/salesInfo").getSalesStatusList],
  // 매출정보 - 일자별매출
  ['/api/v1/sales/date/list', require("../src/store/salesInfo").getSalesDateList],
  // 매출정보 - 매출분석
  ['/api/v1/sales/analy/list', require("../src/store/salesInfo").getSalesAnalyList],

) ;

// 오픈준비
PostHandlers.push(
  // 개설프로세스 리스트 조회
  ['/api/v1/open/process/list', require("../src/store/openReady").getOpenProcessList],  
  // 개설프로세스 상세 조회
  ['/api/v1/open/process/Details', require("../src/store/openReady").getOpenProcessDetails],  
  // 개설프로세스 저장
  ['/api/v1/open/process/save', require("../src/store/openReady").setOpenProcess],
  // 개설프로세스 개설유형 조회
  ['/api/v1/open/process/category', require("../src/store/openReady").getOpenProcessCateList],  


  // 스케줄관리 리스트 조회
  ['/api/v1/open/schedule/list', require("../src/store/openReady").getScheduleMngList],
  // 스케줄관리 상세 조회
  ['/api/v1/open/schedule/Details', require("../src/store/openReady").getScheduleMngDetails],
  // 스케줄관리 저장
  ['/api/v1/open/schedule/save', require("../src/store/openReady").setScheduleMng],
    
) ;

// 스크래핑
PostHandlers.push(
  // 스크래핑 사이트 계정 저장
  ['/api/v1/store/site/account/save', require("../src/user/User").setSiteAccount],
  // 스크래핑 사이트 계정 조회
  ['/api/v1/store/site/account/list', require("../src/user/User").getSiteAccount],
  
)

// 항상 마지막 위치
registerPostHandler(router, PostHandlers);

module.exports = router;