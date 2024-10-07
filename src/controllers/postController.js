const { PrismaClient } = require("@prisma/client");
const s = require("superstruct");
const bcrypt = require("bcrypt");
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const { CreatePost, PatchPost } = require("../struct/postStruct");
const {
  formatDateToString,
  formatStringToDate,
} = require("../util/dateFormat");
const { hashPassword, comparePassword } = require("../util/passwordUtils.js");

const prisma = new PrismaClient();

// 게시글 등록
const createPost = async (req, res) => {
  const { groupId } = req.params;

  // 게시글 유효성 검사
  s.assert(req.body, CreatePost);

  // 비밀번호와 나머지 데이터 분리
  const { postPassword, groupPassword, moment, tags, ...postData } = req.body;

  // groupId에 해당하는 그룹 존재 여부 확인
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  // 그룹 비밀번호 확인
  const passwordMatch = await comparePassword(groupPassword, group.password);

  if (!passwordMatch) {
    throw new CustomError(
      ErrorCodes.Forbidden,
      "비밀번호가 일치하지 않습니다.",
    );
  }

  const hashedPassword = await hashPassword(postPassword);

  // 게시글 생성
  const post = await prisma.post.create({
    data: {
      ...postData,
      postPassword: hashedPassword,
      moment: formatStringToDate(moment),
      groupId,
      tags: {
        create: tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { content: tag }, // tag 이름을 기준으로 태그가 이미 있으면 연결하고, 없으면 새로 생성
              create: { content: tag }, // 태그가 없을 경우 생성
            },
          },
        })),
      },
    },
    // Response 형식에 맞게 데이터 선택
    select: {
      id: true,
      groupId: true,
      nickname: true,
      title: true,
      content: true,
      imageUrl: true,
      location: true,
      moment: true,
      isPublic: true,
      tags: {
        select: {
          tag: {
            select: {
              content: true,
            },
          },
        },
      },
      createdAt: true,
      // 좋아요 수 및 댓글 수도 함께 선택
      _count: {
        select: {
          postLikes: true, // 게시글의 좋아요 수
          comments: true, // 댓글 수
        },
      },
    },
  });

  // 태그를 문자열 배열로 변환
  const tagsContent = post.tags.map((tag) => tag.tag.content);

  // 좋아요 수 및 댓글 수 추출
  const likeCount = post._count.postLikes;
  const commentCount = post._count.comments;

  // 최종 응답
  res.status(201).json({
    id: post.id,
    groupId: post.groupId,
    nickname: post.nickname,
    title: post.title,
    content: post.content,
    imageUrl: post.imageUrl,
    tags: tagsContent,
    location: post.location,
    moment: formatDateToString(post.moment), // 'YYYY-MM-DD' 형식으로 변환
    isPublic: post.isPublic,
    likeCount,
    commentCount,
    createdAt: post.createdAt,
  });
};

// 게시글 목록 조회
const postList = async (req, res) => {
  const { groupId } = req.params;

  // query parameter default 값 설정
  const {
    page = 1,
    pageSize = 8,
    sortBy = "latest",
    keyword = "",
    isPublic = "true",
  } = req.query;

  // groupId에 해당하는 그룹 존재 여부 확인
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  // isPublic 문자열을 boolean으로 변환
  const isPublicValue = isPublic === "true";

  // 게시글 keyword 포함
  const where = {
    OR: [
      { title: { contains: keyword, mode: "insensitive" } }, // 제목에서 keyword 검색
      {
        tags: {
          some: {
            tag: {
              content: {
                contains: keyword,
                mode: "insensitive", // 태그에서 keyword 검색
              },
            },
          },
        },
      },
    ],
  };

  // 공개 여부 조건 처리
  if (typeof isPublic !== "undefined") {
    where.isPublic = isPublic == "true"; // 공개 여부에 따른 조건 추가
  }

  // 게시글 조회
  const totalItemCount = await prisma.post.count({
    where,
  });

  const posts = await prisma.post.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * pageSize,
    take: Number(pageSize),
    select: {
      id: true,
      nickname: true,
      title: true,
      imageUrl: true,
      isPublic: true,
      moment: true,
      createdAt: true,
      _count: {
        select: {
          postLikes: true, // 게시글의 좋아요 수
          comments: true, // 댓글 수
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              content: true, // 태그 내용을 가져옴
            },
          },
        },
      },
      location: true,
    },
  });

  // 페이지 계산
  const totalPages = Math.ceil(totalItemCount / pageSize);

  // 포맷팅 후 반환
  const formattedPosts = posts.map((post) => ({
    id: post.id,
    nickname: post.nickname,
    title: post.title,
    imageUrl: post.imageUrl,
    tags: post.tags.map((tag) => tag.tag.content), // 태그를 문자열 배열로 변환
    location: post.location,
    moment: formatDateToString(post.moment), // 포맷팅된 moment
    isPublic: post.isPublic,
    likeCount: post._count.postLikes, // 좋아요 수
    commentCount: post._count.comments, // 댓글 수
    createdAt: post.createdAt, // createdAt 그대로 반환
  }));

  res.status(200).json({
    currentPage: Number(page),
    totalPages,
    totalItemCount,
    data: formattedPosts,
  });
};

// 게시글 수정
const updatedPost = async (req, res) => {
  const { postId } = req.params;

  // 유효성 검사 (Superstruct를 사용한 유효성 검증)
  s.assert(req.body, PatchPost);

  // 비밀번호 및 처리가 필요한 내용 분해 할당
  const { postPassword, tags, moment, ...updatedData } = req.body;

  // postId에 해당하는 게시글 존재 여부 확인
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
  });

  if (!postPassword) {
    throw new CustomError(ErrorCodes.BadRequest);
  }

  // 비밀번호를 비교하여 불일치시 수정 x
  const isPasswordValid = await comparePassword(
    postPassword,
    post.postPassword,
  );

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  const tagRecords = tags.map((tag) => ({
    tag: {
      connectOrCreate: {
        where: { content: tag }, // 태그가 존재하면 연결
        create: { content: tag }, // 태그가 없으면 생성
      },
    },
  }));

  // 게시글 업데이트
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      ...updatedData,
      moment: formatStringToDate(moment), // moment 포맷을 처리하는 함수
      tags: {
        deleteMany: {}, // 기존 태그를 모두 삭제
        create: tagRecords, // 새 태그로 업데이트
      },
    },
    select: {
      id: true,
      groupId: true,
      nickname: true,
      title: true,
      content: true,
      imageUrl: true,
      location: true,
      moment: true,
      isPublic: true,
      tags: {
        select: {
          tag: {
            select: {
              content: true,
            },
          },
        },
      },
      createdAt: true,
      _count: {
        select: {
          postLikes: true,
          comments: true,
        },
      },
    },
  });

  const formattedPost = {
    id: updatedPost.id,
    nickname: updatedPost.nickname,
    title: updatedPost.title,
    imageUrl: updatedPost.imageUrl,
    tags: updatedPost.tags.map((tag) => tag.tag.content), // 태그를 문자열 배열로 변환
    location: updatedPost.location,
    moment: formatDateToString(updatedPost.moment), // 포맷팅된 moment
    isPublic: updatedPost.isPublic,
    likeCount: updatedPost._count.postLikes, // 좋아요 수
    commentCount: updatedPost._count.comments, // 댓글 수
    createdAt: formatDateToString(updatedPost.createdAt), // createdAt 그대로 반환
  };

  // 응답 반환
  res.status(200).json(formattedPost);
};

// 게시글 삭제
const deletePost = async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
  });

  const isPasswordValid = await comparePassword(
    postPassword,
    post.postPassword,
  );

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  await prisma.post.delete({
    where: { id: postId },
  });

  res.status(200).json({ message: "게시글 삭제 성공" });
};

// 게시글 상세 정보 조회
const postDetail = async (req, res) => {
  const { postId } = req.params;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: {
      id: true,
      nickname: true,
      title: true,
      imageUrl: true,
      isPublic: true,
      moment: true,
      createdAt: true,
      _count: {
        select: {
          postLikes: true, // 게시글의 좋아요 수
          comments: true, // 댓글 수
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              content: true, // 태그 내용을 가져옴
            },
          },
        },
      },
      location: true,
    },
  });

  // 포맷팅된 데이터 생성
  const formattedPost = {
    ...post,
    moment: formatDateToString(post.moment), // 포맷팅된 moment
    createdAt: formatDateToString(post.createdAt), // 포맷팅된 createdAt
    tags: post.tags.map((tag) => tag.tag.content), // 태그 내용을 문자열 배열로 변환
  };

  res.status(200).json(formattedPost);
};

// 게시글 조회 권한 확인
const verifyPassword = async (req, res) => {
  const { postId } = req.params;
  const { postPassword } = req.body;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
  });

  const isPasswordValid = await comparePassword(
    postPassword,
    post.postPassword,
  );

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  res.status(200).json({ message: "비밀번호가 확인되었습니다." });
};

// 게시글 공감
const likePost = async (req, res) => {
  const { postId } = req.params;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
  });

  await prisma.postLike.create({
    data: { postId },
  });

  return res.status(200).json({
    message: "게시글 공감하기 성공",
  });
};

// 그룹 공개 여부 확인
const checkPublic = async (req, res) => {
  const { postId } = req.params;

  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
  });

  return res.status(200).json({
    id: post.id,
    isPublic: post.isPublic,
  });
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
