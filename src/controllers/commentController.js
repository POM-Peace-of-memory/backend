const commentService = require("../services/commentService.js");
const s = require("superstruct");
const { CreateComment, UpdateComment } = require("../struct/commentStruct.js");

// 댓글 생성
const createComment = async (req, res) => {
  s.assert(req.body, CreateComment);
  const { postId } = req.params;
  const newComment = await commentService.createComment(postId, req.body);
  res.status(201).json(newComment);
};

// 댓글 목록 조회
const commentList = async (req, res) => {
  const { postId } = req.params;
  const comments = await commentService.getComments(postId, req.query);
  res.status(200).json(comments);
};

// 댓글 수정
const updateComment = async (req, res) => {
  s.assert(req.body, UpdateComment);
  const { commentId } = req.params;
  const updatedComment = await commentService.updateComment(commentId, req.body);
  res.status(200).json(updatedComment);
};

// 댓글 삭제
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { password } = req.body;
  await commentService.deleteComment(commentId, password);
  res.status(200).json({ message: "답글 삭제 성공" });
};

module.exports = {
  createComment,
  commentList,
  updateComment,
  deleteComment,
};