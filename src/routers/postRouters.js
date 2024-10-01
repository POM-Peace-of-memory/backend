const express = require('express');
const asyncHandler = require("../middlewares/asyncHandler");
const { createPost, postList, editPost } = require('../controllers/postController');
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


router.get("groups/:groupId/posts", asyncHandler(postList));
/**
 * @swagger
 * /api/groups/{groupId}/posts:
 *   get:
 *     tags: [Post]
 *     summary: 게시글 목록 조회
 *     description: 그룹에 해당하는 게시글 목록을 조회합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         description: 그룹 ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         description: 현재 페이지 번호
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: pageSize
 *         description: 페이지당 아이템 수
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: sortBy
 *         description: 정렬 기준
 *         required: false
 *         schema:
 *           type: string
 *           enum: [latest, mostPosted, mostLiked]
 *       - in: query
 *         name: keyword
 *         description: 제목 및 태그 검색어
 *         required: false
 *         schema:
 *           type: string
 *           example: "추억"
 *       - in: query
 *         name: isPublic
 *         description: 공개 여부 (true/false)
 *         required: false
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *                 totalItemCount:
 *                   type: integer
 *                   example: 50
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "1"
 *                       nickname:
 *                         type: string
 *                         example: "사용자"
 *                       title:
 *                         type: string
 *                         example: "추억 제목"
 *                       imageUrl:
 *                         type: string
 *                         example: "https://your-image-url.com"
 *                       isPublic:
 *                         type: boolean
 *                         example: true
 *                       likeCount:
 *                         type: integer
 *                         example: 0
 *                       commentCount:
 *                         type: integer
 *                         example: 0
 *                       moment:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-22T07:47:49.803Z"
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: "#추억"
 *                       location:
 *                         type: string
 *                         example: "장소"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-02-22T07:47:49.803Z"
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
 */


router.patch("posts/:postId", asyncHandler(editPost));
/**
 * @swagger
 * /api/posts/{postId}:
 *   patch:
 *     tags: [Post]
 *     summary: 게시글 수정
 *     description: 게시글 정보를 수정합니다.
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: 게시글 ID
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname:
 *                 type: string
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               postPassword:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *               moment:
 *                 type: string
 *                 format: date
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: 게시글 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: number
 *                 groupId:
 *                   type: number
 *                 nickname:
 *                   type: string
 *                 title:
 *                   type: string
 *                 content:
 *                   type: string
 *                 imageUrl:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                 location:
 *                   type: string
 *                 moment:
 *                   type: string
 *                   format: date
 *                 isPublic:
 *                   type: boolean
 *                 likeCount:
 *                   type: number
 *                 commentCount:
 *                   type: number
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 요청 양식 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청입니다."
 *       403:
 *         description: 비밀번호 오류
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "비밀번호가 틀렸습니다."
 *       404:
 *         description: 게시글을 찾을 수 없습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "존재하지 않습니다."
 */


router.delete("posts/:postId", asyncHandler(deletePost));
/**
 * @swagger
 * /api/posts/{postId}:
 *   delete:
 *     tags: [Post]
 *     summary: 게시글 삭제
 *     description: 게시글을 삭제합니다.
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: 게시글 ID
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "게시글 삭제 성공"
 *       400:
 *         description: 잘못된 요청입니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "잘못된 요청입니다"
 *       403:
 *         description: 비밀번호가 틀렸습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "비밀번호가 틀렸습니다"
 *       404:
 *         description: 존재하지 않는 게시글입니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "존재하지 않습니다"
 */
