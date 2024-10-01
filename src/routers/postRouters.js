const express = require('express');
const asyncHandler = require("../middlewares/asyncHandler");
const createPost = require('../controllers/postController');
const router = express.Router();

router.post("groups/:groupId/posts", asyncHandler(createPost));
/**
 * @swagger
 * /api/groups/{groupId}/posts:
 *   post:
 *     tags: [Post]
 *     summary: 게시글 등록
 *     description: 주어진 그룹에 게시글을 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *                 example: "홍길동"
 *               title:
 *                 type: string
 *                 example: "안녕하세요!"
 *               content:
 *                 type: string
 *                 example: "첫 게시글을 작성합니다."
 *               postPassword:
 *                 type: string
 *                 example: "password123"
 *               groupPassword:
 *                 type: string
 *                 example: "groupPassword123"
 *               imageURL:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "#exampleTag"
 *               location:
 *                 type: string
 *                 example: "서울"
 *               moment:
 *                 type: string
 *                 format: date
 *                 example: "2024-02-21"
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 게시글이 성공적으로 생성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "f1e45c9e-045b-4e61-8b4b-d88cbfb66a6c"
 *                 groupId:
 *                   type: string
 *                   example: "d3f9ae67-54ff-4e39-8f65-68e107d3e1a1"
 *                 nickname:
 *                   type: string
 *                   example: "홍길동"
 *                 title:
 *                   type: string
 *                   example: "안녕하세요!"
 *                 content:
 *                   type: string
 *                   example: "첫 게시글을 작성합니다."
 *                 imageUrl:
 *                   type: string
 *                   example: "https://example.com/image.jpg"
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: "#exampleTag"
 *                 location:
 *                   type: string
 *                   example: "서울"
 *                 moment:
 *                   type: string
 *                   format: date
 *                   example: "2024-02-21"
 *                 isPublic:
 *                   type: boolean
 *                   example: true
 *                 likeCount:
 *                   type: integer
 *                   example: 5
 *                 commentCount:
 *                   type: integer
 *                   example: 2
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-02-21T12:00:00Z"
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
 *       403:
 *         description: 비밀번호가 일치하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "비밀번호가 일치하지 않습니다."
 *       404:
 *         description: 존재하지 않는 데이터입니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "존재하지 않는 데이터입니다."
 */