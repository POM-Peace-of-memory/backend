const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword } = require("../util/passwordUtils.js");
const { CustomError, ErrorCodes } = require("../middlewares/errorHandler.js");
const { formatDateToString } = require("../util/dateFormat");

const prisma = new PrismaClient();

// 댓글 생성
const createComment = async (postId, commentData) => {
  const { nickname, content, password } = commentData;

  // 게시글 존재 여부 확인
  await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 비밀번호 해싱
  const hashedPassword = await hashPassword(password);

  // 댓글 생성
  const newComment = await prisma.comment.create({
    data: {
      nickname,
      content,
      password: hashedPassword,
      postId,
    },
    // 필요한 데이터 선택
    select: {
      id: true,
      nickname: true,
      content: true,
      createdAt: true,
    },
  });

  // 생성된 댓글 반환
  return {
    id: newComment.id,
    nickname: newComment.nickname,
    content: newComment.content,
    createdAt: formatDateToString(newComment.createdAt),
  };
};

// 댓글 목록 조회
const getComments = async (postId, queryParams) => {
  const { page = 1, pageSize = 8 } = queryParams;

  // 게시글 존재 여부 확인
  await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 총 댓글 수 조회
  const totalItemCount = await prisma.comment.count({
    where: { postId },
  });

  // 댓글 목록 조회
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: Number(pageSize),
    select: {
      id: true,
      nickname: true,
      content: true,
      createdAt: true,
    },
  });

  // 총 페이지 수 계산
  const totalPages = Math.ceil(totalItemCount / pageSize);

  // 포맷팅된 댓글 목록 반환
  const formattedComments = comments.map((comment) => ({
    id: comment.id,
    nickname: comment.nickname,
    content: comment.content,
    createdAt: formatDateToString(comment.createdAt),
  }));

  return {
    currentPage: Number(page),
    totalPages,
    totalItemCount,
    data: formattedComments,
  };
};

// 댓글 수정
const updateComment = async (commentId, updateData) => {
  const { password, ...data } = updateData;

  // 댓글 존재 여부 확인
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // 비밀번호 확인
  const isPasswordValid = await comparePassword(password, comment.password);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  // 댓글 업데이트
  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data,
    select: {
      id: true,
      nickname: true,
      content: true,
      createdAt: true,
    },
  });

  // 포맷팅된 업데이트된 댓글 반환
  return {
    id: updatedComment.id,
    nickname: updatedComment.nickname,
    content: updatedComment.content,
    createdAt: formatDateToString(updatedComment.createdAt),
  };
};

// 댓글 삭제
const deleteComment = async (commentId, password) => {
  // 댓글 존재 여부 확인
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // 비밀번호 확인
  const isPasswordValid = await comparePassword(password, comment.password);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  // 댓글 삭제
  await prisma.comment.delete({
    where: { id: commentId },
  });
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
