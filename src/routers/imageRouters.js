const express = require("express");
const asyncHandler = require("../middlewares/asyncHandler");
const router = express.Router();
const imageController = require("../controllers/imageController");

router.post("/image", imageController.multerMiddleware, asyncHandler(imageController.imageUpload));
/**
 * @swagger
 * /api/image:
 *   post:
 *     tags: [Image]
 *     summary: 이미지 업로드
 *     description: 파일을 S3 버킷에 업로드합니다.
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 파일이 성공적으로 업로드되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imageUrl:
 *                   type: string
 *                   example: "https://your-bucket-name.s3.amazonaws.com/your-file-name.jpg"
 *       400:
 *         description: 잘못된 요청입니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청입니다."
 *       500:
 *         description: 서버 내부 오류가 발생했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "파일 업로드 중 문제가 발생했습니다."
 */

module.exports = router;
