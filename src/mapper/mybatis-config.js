const path = require('path');

module.exports = {
  // Mybatis Mapper 설정
  mapper_info: [
    // 사용자
    { mapperNm: "userMapper", path: path.resolve(__dirname, "../mapper/user/userMapper.xml") },
    // 시스템 - 메뉴
    { mapperNm: "menuMapper", path: path.resolve(__dirname, "../mapper/system/menuMapper.xml") },
    // 시스템 - 권한
    { mapperNm: "authMapper", path: path.resolve(__dirname, "../mapper/system/authMapper.xml") },
    // // 공통코드
    // { mapperNm: "CommonMapper", path: path.resolve(__dirname, "../mapper/sys/CommonMapper.xml") },
    // 공통
    { mapperNm: "commMapper", path: path.resolve(__dirname, "../mapper/system/commMapper.xml") },
    // 창업투자
    { mapperNm: "investMapper", path: path.resolve(__dirname, "../mapper/invest/investMapper.xml") },
    // // 게시판
    // { mapperNm: "BoardMapper", path: path.resolve(__dirname, "../mapper/bod/BoardMapper.xml") },
    // // 창업지역 추천
    // { mapperNm: "RecommendMapper", path: path.resolve(__dirname, "../mapper/sup/RecommendMapper.xml") },
    // // 창업지역 추천
    // { mapperNm: "ManageCompMapper", path: path.resolve(__dirname, "../mapper/sys/ManageCompMapper.xml") },
    // ////[path.resolve(__dirname, "../src/mapper/usr/UserMapper.xml"),]
    // // 배달의 민족 스크래핑
    // { mapperNm: "DeliveryOrderMapper", path: path.resolve(__dirname, "../mapper/batch/DeliveryOrderMapper.xml") },
    // // 배치 HISTORY
    // { mapperNm: "BatchHistoryMapper", path: path.resolve(__dirname, "../mapper/batch/BatchHistoryMapper.xml") },
    // // 스크래핑 회원
    // { mapperNm: "ScrapBatchUserMapper", path: path.resolve(__dirname, "../mapper/batch/comm/ScrapBatchUserMapper.xml") },
    // // 스크래핑 진행 History
    // { mapperNm: "ScrapHistoryHandlerMapper", path: path.resolve(__dirname, "../mapper/batch/comm/ScrapHistoryHandlerMapper.xml") },
    // // 배달 데이터
    // { mapperNm: "DeliveryMapper", path: path.resolve(__dirname, "./deliv/DeliveryMapper.xml") },
    // // 배달 회원
    // { mapperNm: "DeliveryUserMapper", path: path.resolve(__dirname, "./deliv/DeliveryUserMapper.xml") },
    // 매장관리
    { mapperNm: "storeMapper", path: path.resolve(__dirname, "../mapper/store/storeMapper.xml") },
    // 거래처관리
    { mapperNm: "customerMapper", path: path.resolve(__dirname, "../mapper/store/customerMapper.xml") },
    // 계좌관리
    { mapperNm: "accountMapper", path: path.resolve(__dirname, "../mapper/store/accountMapper.xml") },
    // 투자내역관리
    { mapperNm: "investHisMapper", path: path.resolve(__dirname, "../mapper/store/investHisMapper.xml") },
    // 서류 (점주/계약)
    { mapperNm: "documentsMapper", path: path.resolve(__dirname, "../mapper/store/documentsMapper.xml") },
    // 매출정보관리
    { mapperNm: "salesInfoMapper", path: path.resolve(__dirname, "../mapper/store/salesInfoMapper.xml") },
    // 오픈준비
    { mapperNm: "openReadyMapper", path: path.resolve(__dirname, "../mapper/store/openReadyMapper.xml") },
    // 오픈준비
    { mapperNm: "codeMapper", path: path.resolve(__dirname, "../mapper/store/codeMapper.xml") },

    // 배치 > 배치 이력관련
    { mapperNm: "batchServerMapper", path: path.resolve(__dirname, "../mapper/batch/batchServerMapper.xml") },
    // 배치 > 스크래핑 이력관리 핸들러
    { mapperNm: "scrapHistoryHandlerMapper", path: path.resolve(__dirname, "../mapper/batch/scrapHistoryHandlerMapper.xml") },
    // 배치 > 공통 스크래핑 회원 관련
    { mapperNm: "scrapCommonBatchUser", path: path.resolve(__dirname, "../mapper/batch/scrapCommonBatchUser.xml") },
    // 배치 > 스크래핑 > 배달의민족
    { mapperNm: "scrapBaeminMapper", path: path.resolve(__dirname, "../mapper/batch/scrapBaeminMapper.xml") },
    // 배치 > 스크래핑 > 요기요
    { mapperNm: "scrapYogiyoMapper", path: path.resolve(__dirname, "../mapper/batch/scrapYogiyoMapper.xml") },
    // 배치 > 스크래핑 > 쿠팡이츠
    { mapperNm: "scrapCoupangeatsMapper", path: path.resolve(__dirname, "../mapper/batch/scrapCoupangeatsMapper.xml") },
    // 배치 > 스크래핑 > 여신금융협회
    { mapperNm: "scrapYessinMapper", path: path.resolve(__dirname, "../mapper/batch/scrapYessinMapper.xml") },
  ]
}