const express = require("express");
const groupController = require("../controllers/groupController");
const asyncHandler = require("../middlewares/asyncHandler");

const router = express.Router();

router.get("/groups", asyncHandler(groupController.getGroups));
/**
 * @swagger
 * /api/groups:
 *   get:
 *     tags: [Group]
 *     summary: 그룹 목록 조회
 *     description: 페이지네이션, 정렬, 검색 기능이 포함된 그룹 목록을 조회합니다.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: 페이지 번호
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [latest, mostPosted, mostLiked, mostBadge]
 *         description: 정렬 기준
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: 검색 키워드
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: 공개 여부
 *     responses:
 *       200:
 *         description: 성공적으로 그룹 목록을 조회했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 currentPage:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalItemCount:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Group'
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.get("/groups/:groupId", asyncHandler(groupController.getGroupById));
/**
 * @swagger
 * /api/groups/{groupId}:
 *   get:
 *     tags: [Group]
 *     summary: 그룹 상세 정보 조회
 *     description: 그룹 ID를 사용하여 특정 그룹의 상세 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 조회할 그룹의 ID
 *     responses:
 *       200:
 *         description: 성공적으로 그룹 정보를 조회했습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.post("/groups", asyncHandler(groupController.createGroup));
/**
 * @swagger
 * /api/groups:
 *   post:
 *     tags: [Group]
 *     summary: 그룹 등록
 *     description: 새로운 그룹을 생성합니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateGroup'
 *     responses:
 *       201:
 *         description: 그룹이 성공적으로 생성되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       400:
 *         description: 잘못된 입력 데이터입니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.patch("/groups/:groupId", asyncHandler(groupController.updateGroup));
/**
 * @swagger
 * /api/groups/{groupId}:
 *   patch:
 *     tags: [Group]
 *     summary: 그룹 수정
 *     description: 기존 그룹의 정보를 수정합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 그룹의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateGroup'
 *     responses:
 *       200:
 *         description: 그룹이 성공적으로 수정되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Group'
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.delete("/groups/:groupId", asyncHandler(groupController.deleteGroup));
/**
 * @swagger
 * /api/groups/{groupId}:
 *   delete:
 *     tags: [Group]
 *     summary: 그룹 삭제
 *     description: 특정 그룹을 삭제합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 삭제할 그룹의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       204:
 *         description: 그룹이 성공적으로 삭제되었습니다.
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.post(
  "/groups/:groupId/verify-password",
  asyncHandler(groupController.verifyGroupPassword),
);
/**
 * @swagger
 * /api/groups/{groupId}/verify-password:
 *   post:
 *     tags: [Group]
 *     summary: 그룹 조회 권한 확인
 *     description: 그룹의 비밀번호를 확인합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 그룹의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 비밀번호가 확인되었습니다.
 *       401:
 *         description: 잘못된 비밀번호입니다.
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.post("/groups/:groupId/like", asyncHandler(groupController.likeGroup));
/**
 * @swagger
 * /api/groups/{groupId}/like:
 *   post:
 *     tags: [Group]
 *     summary: 그룹 공감하기
 *     description: 특정 그룹에 좋아요를 추가합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 좋아요를 추가할 그룹의 ID
 *     responses:
 *       200:
 *         description: 그룹 좋아요가 성공적으로 추가되었습니다.
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

router.get("/groups/:groupId/is-public", asyncHandler(groupController.isPublicGroup));
/**
 * @swagger
 * /api/groups/{groupId}/is-public:
 *   get:
 *     tags: [Group]
 *     summary: 그룹 공개 여부 확인
 *     description: 특정 그룹의 공개 여부를 확인합니다.
 *     parameters:
 *       - in: path
 *         name: groupId
 *         required: true
 *         schema:
 *           type: string
 *         description: 확인할 그룹의 ID
 *     responses:
 *       200:
 *         description: 그룹의 공개 여부가 성공적으로 조회되었습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 isPublic:
 *                   type: boolean
 *       404:
 *         description: 그룹을 찾을 수 없습니다.
 *       500:
 *         description: 서버 오류가 발생했습니다.
 */

module.exports = router;

/**
 * @swagger
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         imageUrl:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         introduction:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         postCount:
 *           type: integer
 *         likeCount:
 *           type: integer
 *         badgesCount:
 *           type: integer
 *     CreateGroup:
 *       type: object
 *       required:
 *         - name
 *         - password
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         imageUrl:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         introduction:
 *           type: string
 *     UpdateGroup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         imageUrl:
 *           type: string
 *         isPublic:
 *           type: boolean
 *         introduction:
 *           type: string
 */
