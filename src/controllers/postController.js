const postService = require("../services/postService.js");
const BadgeService = require("../services/badgeService.js");
const s = require("superstruct");
const { CreatePost, PatchPost } = require("../struct/postStruct.js");

// 게시글 생성
const createPost = async (req, res) => {
  s.assert(req.body, CreatePost);
  const { groupId } = req.params;
  const post = await postService.createPost(groupId, req.body);
  await BadgeService.assert7DayBadge(groupId);
  await BadgeService.assert20PostBadge(groupId);
  res.status(201).json(post);
};

// 게시글 목록 조회
const postList = async (req, res) => {
  const { groupId } = req.params;
  const posts = await postService.getPosts(groupId, req.query);
  res.status(200).json(posts);
};

// 게시글 수정
const updatedPost = async (req, res) => {
  s.assert(req.body, PatchPost);
  const { postId } = req.params;
  const post = await postService.updatePost(postId, req.body);
  res.status(200).json(post);
};

// 게시글 삭제
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;
  await postService.deletePost(postId, postPassword);
  res.status(200).json({ message: "게시글 삭제 성공" });
};

// 게시글 상세 조회
const postDetail = async (req, res) => {
  const { postId } = req.params;
  const post = await postService.getPostById(postId);
  res.status(200).json(post);
};

// 게시글 비밀번호 확인
const verifyPassword = async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;
  await postService.verifyPostPassword(postId, postPassword);
  res.status(200).json({ message: "비밀번호가 확인되었습니다." });
};

// 게시글 공감
const likePost = async (req, res) => {
  const { postId } = req.params;
  await postService.likePost(postId);
  await BadgeService.assert10KPostLikesBadge(postId);
  res.status(200).json({ message: "게시글 공감하기 성공" });
};

// 게시글 공개 여부 확인
const checkPublic = async (req, res) => {
  const { postId } = req.params;
  const post = await postService.checkPostPublic(postId);
  res.status(200).json(post);
};

module.exports = {
  createPost,
  postList,
  updatedPost,
  deletePost,
  postDetail,
  verifyPassword,
  likePost,
  checkPublic,
};
