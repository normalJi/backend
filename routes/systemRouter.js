const express = require('express');
const router = express.Router();
const { makeRouterHandler, registerPostHandler } = require('./routerHandler');

//router.post('/api/v1/men/getMenuList', authJWT, require("../src/system/menu").getMenuList);


const PostHandlers = [
  // 메뉴 리스트
  ['/api/v1/system/menu/getMenuList', require("../src/system/menu").getMenuList],
  // 메뉴 C/U/D
  ['/api/v1/system/menu/setMenu', require("../src/system/menu").setMenu],
  // 메뉴 정렬순서 조회
  ['/api/v1/system/menu/getMenuSort', require("../src/system/menu").getMenuSort],

  // 사용자 left Menu 리스트 조회
  ['/api/v1/user/menu/getUserMenuList', require("../src/system/menu").getUserMenuList],

  // 권한메뉴매핑할 메뉴 리스트 조회
  ['/api/v1/system/menu/getUseYMenuList', require("../src/system/menu").getUseYMenuList],
];

// 권한 관련
PostHandlers.push(
  // 권한 리스트 조회
  ['/api/v1/system/authority/getAuthorityList', require("../src/system/authority").getAuthorityList],
  // 권한 메뉴 매핑 저장
  ['/api/v1/system/authority/setAuthMenuMap', require("../src/system/authority").setAuthMenuMap],
  // 권한에 매핑된 사용자 리스트 조회
  ['/api/v1/system/authority/getAuthUserList', require("../src/system/authority").getAuthUserList],
  // 권한 저장
  ['/api/v1/system/authority/setAuthority', require("../src/system/authority").setAuthority],
  // 권한에 미매핑된 사용자 조회
  ['/api/v1/system/authority/getNonAuthUserList', require("../src/system/authority").getNonAuthUserList],
  // 권한에 사용자 매핑 저장
  ['/api/v1/system/authority/instAuthUserMap', require("../src/system/authority").instAuthUserMap],
  // 권한에 사용자 매핑 삭제
  ['/api/v1/system/authority/delAuthUserMap', require("../src/system/authority").delAuthUserMap],

)

// 공통코드
PostHandlers.push(
  ['/api/v1/com/getCommonCodeList', require("../src/system/code").getCommonCodeList],
  ['/api/v1/com/getCommonDetailList', require("../src/system/code").getCommonDetailList],
  ['/api/v1/com/getCommCodeVal', require("../src/system/code").getCommCodeVal],
  ['/api/v1/com/saveCommonCode', require("../src/system/code").saveCommonCode],
  // 카테고리 조회
  ['/api/v1/com/getCategoryList', require("../src/system/code").getCategoryList],
  // 개설프로세스 카테고리 조회
  ['/api/v1/com/getOpenCateList', require("../src/system/code").getOpenCateList],
) 

// 관리업체
PostHandlers.push(
  ['/api/v1/mnc/getManageCompList', require("../src/system/manageCompany").getManageCompList],
  ['/api/v1/mnc/saveManageComp', require("../src/system/manageCompany").saveManageComp],
)


// 일반 파일첨부
PostHandlers.push(
  ['/api/v1/com/attach/upload', require("../src/system/code").setAttachments],
  ['/api/v1/com/attach/delete', require("../src/system/code").setFileDelete],
  
)

// 항상 마지막 위치
//PostHandlers.forEach(handler => router.post(handler[0], makeRouterHandler(handler[1])));
registerPostHandler(router, PostHandlers);

module.exports = router;