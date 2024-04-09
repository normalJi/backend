/**
 * 테스트 코드를 위한 Router
 * 운영환경에서는 작동하지 않는다
 */
const express = require('express');
const router = express.Router();
const { registerPostHandler } = require('./routerHandler');

if (process.env.NODE_ENV !== 'production') {
  // 운영이 아닐때만 유효.
  const PostHandlers = [
    ['/api/v1/dev/file/upload', require('../src/dev/file').upload],
  ];

  // 항상 마지막 위치
  registerPostHandler(router, PostHandlers);
}

module.exports = router;
