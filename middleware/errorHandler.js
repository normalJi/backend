const { StatusCodes } = require("http-status-codes")

const errorHandler = (err, req, res, next) => {
  console.log(err.stack);
  // res.status(err.statusCode).json({code: err.statusCode, message: err.message});
  let error = {
		//* 에러가 발생했지만, 기본적인 에러 코드나 에러 메세지가 존재하지 않을 경우를 대비한
		//* default 에러 코드 및 에러 메세지
		statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
		message: err.message || "Internal server error",
	}

	if (error.statusCode && (error.message === "jwt malformed" || error.message === "invalid token")) {
		error = { statusCode: StatusCodes.UNAUTHORIZED, message: "유효하지 않은 링크입니다." }
	}

	// 에러 관련된 응답
	return res.status(error.statusCode).json({ code: error.statusCode, message: error.message })
}

module.exports = errorHandler;