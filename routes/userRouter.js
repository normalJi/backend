const express = require('express');
const router = express.Router();
const { makeRouterHandler } = require('./routerHandler');

// router.post('/api/v1/login', require("../src/user/User").login);
// router.post('/api/v1/auth/refresh', require("../src/user/User").refresh);

const PostHandlers = [
  // 토큰 유효 확인
  //['/api/v1/tokenCheck', require("../../src/user/user").tokenCheck],
  // 로그인
  ['/api/v1/login', require("../src/user/User").login],
  ['/api/v1/auth/refreshVerify', require("../src/user/User").refreshVerify],
  
];

// 일반 회원 관리
PostHandlers.push(
  // 일반 회원 조회
  ['/api/v1/user/mem/list', require("../src/user/User").getMemberList],
  // 일반 회원 상세 정보
  ['/api/v1/user/mem/detail', require("../src/user/User").getMemberDetail],  
) ;

// 관리자 회원 관리
PostHandlers.push(  
  // 관리자 회원 조회
  ['/api/v1/user/adm/list', require("../src/user/User").getAdminList],
  // 관리자 비밀번호 초기화
  ['/api/v1/user/adm/setPassReset', require("../src/user/User").setPasswordReset],  
  // 관리자 회원정보 등록 및 수정
  ['/api/v1/user/adm/save', require("../src/user/User").setAdminSave],
  // 관리자 회원정보 조회
  ['/api/v1/user/adm/detail', require("../src/user/User").getAdminDetail],
) ;




// 매장관리 - 사용자
PostHandlers.push(
  // 매장관리 - 사용자 조회
  ['/api/v1/store/user/details', require("../src/user/User").getStoreUserInfo],
) ;

// 항상 마지막 위치
PostHandlers.forEach(handler => router.post(handler[0], makeRouterHandler(handler[1])));

module.exports = router;