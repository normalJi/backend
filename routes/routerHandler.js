const logger = require('../logger/logger');
const common = require('../common/common');
const CustomError = require('../errors/CustomError');
const RequestData = require('../common/RequestData');
const ResponseData = require('../common/ResponseData');
/**
 * 일반적인 router 등록 핸들러 처리시 사용
 */
const makeRouterHandler = (func) => {
  return async (req, res, next) => {
    logger.debug(`${req.method} ${req.url}`);
    const requestData = new RequestData(req);
    const responseData = new ResponseData(requestData);
    try {
      //let reqData = common.initRequest(req);
      await func(req, res, requestData);
      //await func(req, res);
    } catch (e) {
      logger.error(`app exec error(${req.url})`, e);
      let res_data = new CustomError('시스템오류가 발생하였습니다.', 9999); //ERROR.setError(req, 'DB_PROCESSING_ERR');
      //COMMON.sendResponse(res, res_data);
      res.send(res_data);
    }
  };
};

/**
 * router에 post 핸들러를 등록
 * @param {*} router
 * @param {[string, ...(req, res, next)=>{}][]} handlers [[경로, handler1, handler2, handler3 ...]...] 마지막 핸들러에만 makeRouterHandler가 적용됨
 */
const registerPostHandler = (router, handlers) => {
  handlers.forEach((handlerInfo) => {
    if (handlerInfo.length < 2) {
      logger.error(
        `invalid hander ${handlerInfo.length > 0 ? handlerInfo[0] : 'null'}`
      );
      return;
    }
    const [path, handler] = handlerInfo;
    if (!Array.isArray(handler)) {
      router.post(path, makeRouterHandler(handler));
    } else {
      let _handler = handler.map((h, index) => {
        if (index < handler.length - 1) {
          return h;
        }
        return makeRouterHandler(h);
      });
      router.post(path, ..._handler);
    }
  });
};

module.exports = {
  makeRouterHandler,
  registerPostHandler,
};
