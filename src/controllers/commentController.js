const { PrismaClient } = require("@prisma/client");
const s = require("superstruct");
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const { CreateComment, UpdateComment } = require("../struct/commentStruct");
const {
  formatDateToString,
  formatStringToDate,
} = require("../util/dateFormat");

const prisma = new PrismaClient();

// 댓글 등록
const createComment = async (req, res) => {
  const { postId } = req.params;

  s.assert(req.body, CreateComment);

  const { nickname, content, password } = req.body;

  const hashedPassword = await hashPassword(password);

  await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  const newComment = await prisma.comment.create({
    data: {
      nickname,
      content,
      password: hashedPassword,
      postId,
    },
    // Response 형식에 맞게 데이터 선택
    select: {
      id: true,
      nickname: true,
      content: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    id: newComment.id,
    nickname: newComment.nickname,
    content: newComment.content,
    createdAt: formatDateToString(newComment.createdAt),
  });
};

// 댓글 목록 조회
const commentList = async (req, res) => {
  const { postId } = req.params;

  // query parameter default 값 설정
  const { page = 1, pageSize = 8 } = req.query;

  // postId에 해당하는 게시글 존재 여부 확인
  await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 댓글 개수 조회
  const totalItemCount = await prisma.comment.count({
    where: { postId: postId },
  });

  const comments = await prisma.comment.findMany({
    where: { postId: postId },
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

  // 페이지 계산
  const totalPages = Math.ceil(totalItemCount / pageSize);

  // 포맷팅 후 반환
  const formattedComments = comments.map((comment) => ({
    id: comment.id,
    nickname: comment.nickname,
    content: comment.content,
    createdAt: formatDateToString(comment.createdAt),
  }));

  res.status(200).json({
    currentPage: Number(page),
    totalPages,
    totalItemCount,
    data: formattedComments,
  });
};

// 게시글 수정
const updateComment = async (req, res) => {
  const { commentId } = req.params;

  // 유효성 검사
  s.assert(req.body, UpdateComment);

  // 비밀번호 제외 나머지 정보 저장
  const { password, ...updatedData } = req.body;

  // commentId에 해당하는 댓글 존재 여부 확인
  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // 비밀번호를 비교하여 불일치시 수정 x
  const isPasswordValid = await comparePassword(password, comment.password);

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: updatedData,
    select: {
      id: true,
      nickname: true,
      content: true,
      createdAt: true,
    },
  });

  const formattedComment = {
    id: updatedComment.id,
    nickname: updatedComment.nickname,
    content: updatedComment.content,
    createdAt: formatDateToString(updatedComment.createdAt),
  };

  res.status(200).json(formattedComment);
};

// 게시글 삭제
const deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { password } = req.body;

  const comment = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
  });

  // 비밀번호를 비교하여 불일치시 삭제 x
  const isPasswordValid = await comparePassword(password, comment.password);

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  res.status(200).json({ message: "답글 삭제 성공" });
};

module.exports = {
  createComment,
  commentList,
  updateComment,
  deleteComment,
};
