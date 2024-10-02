const { PrismaClient } = require('@prisma/client');

// 에러 코드 및 기본 메세지
// 필요에 따라 추가 및 수정
const ErrorCodes = {
    BadRequest: {
        code: 400,
        message: "잘못된 요청입니다"
    },
    NotFound: {
        code: 404,
        message: "존재하지 않습니다"
    },
    InternalServerError: {
        code: 500,
        message: "서버 내부 오류가 발생했습니다"
    },
    Unauthorized: {
        code: 401,
        message: "인증되지 않은 요청입니다"
    },
    Forbidden: {
        code: 403,
        message: "접근 권한이 없습니다"
    }
};

// 커스텀 에러 클래스
// 생성자의 인자가 하나일 경우 해당 에러 코드의 메세지 삽입
// 생성자의 인자가 두개일 경우 두번째 인자의 메세지 삽입
class CustomError extends Error {
    constructor(errorCode, message) {
        super(message || errorCode.message);
        this.code = errorCode.code;
    }
}

// errorHandler.js
// app.js 에러 핸들러로 모든 라우트 관리 
// 필요에 따라 에러 처리 추가
// 커스텀 에러가 아닌 에러에 대한 추가 필요!
const errorHandler = (err, req, res, next) => {
    console.error(err.message);

    if (err instanceof CustomError) {
        return res.status(err.code).json({
            message: err.message,
        });
    }
    
    if (err instanceof Error) {
        if (err.name === 'PrismaClientValidationError') {
            return res.status(400).json({ message: err.message });
        } else if (err.name === 'PrismaClientKnownRequestError') {
            if (err.code === 'P2025') {
                return res.status(404).json({ message: err.message });
            }
        }
    }

    // 예상치 못한 에러의 경우
    return res.status(500).json({
        message: "예상치 못한 오류가 발생했습니다"
    });
};

// 사용 예시

// // 기본 메시지 사용
// throw new CustomError(ErrorCodes.BadRequest);

// // 커스텀 메시지 사용
// throw new CustomError(ErrorCodes.NotFound, "사용자를 찾을 수 없습니다.");

module.exports = { ErrorCodes, CustomError, errorHandler };