/**
 * @description 파일관련 테스트
 * 작성자       날짜             수정 내용
 * --------------------------------------------------------------------------
 * jhj         2024.01.09       최초생성
 */

const dbMng = require('../../config/dbInfo');
const logger = require('../../logger/logger');
const common = require('../../common/common');
const CustomError = require('../../errors/CustomError');
const util = require('../../common/util');

const RequestData = require('../../common/RequestData');
const ResponseData = require('../../common/ResponseData');

const { RESPONSE_CODE, RESPONSE_FIELD } = require('../../common/ResponseConst');

const { uploader: uploadMiddleware } = require('../../common/MulterHelper');

/**
 * 파일 업로드 테스트
 * @param {*} req
 * @param {*} res
 */
const upload = [
  uploadMiddleware({ dest: 'temp' }).fields([
    { name: 'file1', maxCount: 1 },
    { name: 'file2', maxCount: 1 },
    { name: 'fileList', maxCount: 20 },
  ]),
  async (req, res) => {
    logger.debug(`${req.originalUrl} == START ==`);
    let requestData = new RequestData(req);
    let responseData = new ResponseData(requestData);

    try {
      let data = requestData.getBody();
      console.log('data', data);
      
      const file1 = requestData.getFile('file1');
      console.log('file1', file1);

      const file2 = requestData.getFileList('file2');
      console.log('file2', file2);
      
      const fileList = requestData.getFileList('fileList');
      console.log('fileList', fileList);
      
    } catch (e) {
      logger.debug(`${req.originalUrl} == ERROR == ${e.message}`);
    } finally {
      logger.debug(`${req.originalUrl} == END ==`);
      requestData.getFileList('fileList').remove();
      res.send(responseData);
    }
  },
];

module.exports = {
  upload,
};
