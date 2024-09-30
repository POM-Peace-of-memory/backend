const express = require('express');
const router = express.Router();
const testRouters = require("./testRouters")
const imageRouters = require("./imageRouters")
//라우터 패스 
/**
 * @swagger
 * tags:
 *   name: Test
 *   description: 테스트 API 관련 엔드포인트
 */
router.use("", testRouters);
/**
 * @swagger
 * tags:
 *   name: Image
 *   description: image API 관련 엔드포인트
 */
router.use("", imageRouters);

module.exports = router;