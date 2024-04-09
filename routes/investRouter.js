/**
 * 창업지원 Router
 */

const express = require('express');
const router = express.Router();
const { makeRouterHandler, registerPostHandler } = require('./routerHandler');

// 창업지원
const PostHandlers = [
  // 창업투자 리스트 조회
  ['/api/v1/invest/consult/list', require("../src/invest/invest").getInvestCunsultList],  
  // 창업투자 상세 조회
  ['/api/v1/invest/consult/details', require("../src/invest/invest").getInvestCunsultDetails],  
  
  // 창업투자 수정
  ['/api/v1/invest/consult/save', require("../src/invest/invest").setInvestCunsult],  

  
];


// // 스크래핑
// PostHandlers.push(
//   // 스크래핑 사이트 계정 저장
//   ['/api/v1/store/site/account/save', require("../src/user/User").setSiteAccount],  
// )

// 항상 마지막 위치
registerPostHandler(router, PostHandlers);

module.exports = router;