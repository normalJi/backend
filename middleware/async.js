/**
 * 
 * @param {*} fn 
 * @returns 
 * @Description async/await 구문에서 errorHandler를 위해 필수적으로 사용해야하는 try/catch문
 * @example const userId = asyncWrapper(async (req, res) => { ...})
 */
const asyncWrapper = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { asyncWrapper }; 