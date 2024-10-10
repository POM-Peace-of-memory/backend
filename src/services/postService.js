const { PrismaClient } = require("@prisma/client");
const { comparePassword, hashPassword } = require("../util/passwordUtils.js");
const { CustomError, ErrorCodes } = require("../middlewares/errorHandler.js");
const {
  formatDateToString,
  formatStringToDate,
} = require("../util/dateFormat");

const prisma = new PrismaClient();

// 게시글 생성
const createPost = async (groupId, postData) => {
  const { postPassword, groupPassword, moment, tags, ...data } = postData;

  // groupId에 해당하는 그룹 존재 여부 확인
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  // 그룹 비밀번호 확인
  const passwordMatch = await comparePassword(groupPassword, group.password);
  if (!passwordMatch) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
  }

  // 게시글 비밀번호 해싱
  const hashedPassword = await hashPassword(postPassword);

  // 게시글 생성
  const post = await prisma.post.create({
    data: {
      ...data,
      postPassword: hashedPassword,
      moment: formatStringToDate(moment),
      groupId,
      tags: {
        create: tags.map((tag) => ({
          tag: {
            connectOrCreate: {
              where: { content: tag }, // 태그가 이미 존재하면 연결, 없으면 새로 생성
              create: { content: tag },
            },
          },
        })),
      },
    },
    // 필요한 데이터 선택
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
          postLikes: true, // 좋아요 수
          comments: true, // 댓글 수
        },
      },
    },
  });

  // 태그와 카운트된 좋아요 및 댓글 수를 포함한 결과 반환
  return {
    ...post,
    tags: post.tags.map((tag) => tag.tag.content),
    moment: formatDateToString(post.moment),
    likeCount: post._count.postLikes,
    commentCount: post._count.comments,
  };
};

// 게시글 목록 조회
const getPosts = async (groupId, queryParams) => {
  const { page = 1, pageSize = 8, sortBy = "latest", keyword = "", isPublic = "true" } = queryParams;

  // 공개 여부를 boolean 값으로 변환
  const isPublicValue = isPublic === "true";

  // 조건 생성
  const where = {
    groupId,
    isPublic: isPublicValue,
    OR: [
      { title: { contains: keyword, mode: "insensitive" } }, // 제목에서 키워드 검색
      {
        tags: {
          some: {
            tag: {
              content: { contains: keyword, mode: "insensitive" }, // 태그에서 키워드 검색
            },
          },
        },
      },
    ],
  };

  // 전체 게시글 개수 계산
  const totalItemCount = await prisma.post.count({ where });

  // 게시글 목록 조회
  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: sortBy === "latest" ? "desc" : "asc" },
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
          postLikes: true,
          comments: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              content: true,
            },
          },
        },
      },
      location: true,
    },
  });

  // 포맷팅된 결과 반환
  return {
    currentPage: Number(page),
    totalPages: Math.ceil(totalItemCount / pageSize),
    totalItemCount,
    data: posts.map((post) => ({
      ...post,
      tags: post.tags.map((tag) => tag.tag.content),
      moment: formatDateToString(post.moment),
      likeCount: post._count.postLikes,
      commentCount: post._count.comments,
    })),
  };
};

// 게시글 업데이트
const updatePost = async (postId, updateData) => {
  const { postPassword, tags, moment, ...data } = updateData;

  // postId에 해당하는 게시글 존재 여부 확인
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 비밀번호를 비교하여 불일치 시 업데이트 불가
  const isPasswordValid = await comparePassword(postPassword, post.postPassword);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  // 태그 데이터 생성
  const tagRecords = tags.map((tag) => ({
    tag: {
      connectOrCreate: {
        where: { content: tag }, // 태그가 존재하면 연결, 없으면 생성
        create: { content: tag },
      },
    },
  }));

  // 게시글 업데이트
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      ...data,
      moment: formatStringToDate(moment),
      tags: {
        deleteMany: {}, // 기존 태그 삭제
        create: tagRecords, // 새 태그로 업데이트
      },
    },
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
          postLikes: true,
          comments: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              content: true,
            },
          },
        },
      },
      location: true,
    },
  });

  // 업데이트된 게시글 반환
  return {
    ...updatedPost,
    tags: updatedPost.tags.map((tag) => tag.tag.content),
    moment: formatDateToString(updatedPost.moment),
    likeCount: updatedPost._count.postLikes,
    commentCount: updatedPost._count.comments,
  };
};

// 게시글 삭제
const deletePost = async (postId, postPassword) => {
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 비밀번호 확인
  const isPasswordValid = await comparePassword(postPassword, post.postPassword);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  // 게시글 삭제
  await prisma.post.delete({ where: { id: postId } });
};

// 게시글 상세 조회
const getPostById = async (postId) => {
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
          postLikes: true,
          comments: true,
        },
      },
      tags: {
        select: {
          tag: {
            select: {
              content: true,
            },
          },
        },
      },
      location: true,
    },
  });

  // 포맷팅된 게시글 데이터 반환
  return {
    ...post,
    moment: formatDateToString(post.moment),
    createdAt: formatDateToString(post.createdAt),
    tags: post.tags.map((tag) => tag.tag.content),
  };
};

// 게시글 비밀번호 확인
const verifyPostPassword = async (postId, postPassword) => {
  const post = await prisma.post.findUniqueOrThrow({ where: { id: postId } });

  // 비밀번호 확인
  const isPasswordValid = await comparePassword(postPassword, post.postPassword);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }
};

// 게시글 공감
const likePost = async (postId) => {
  await prisma.postLike.create({ data: { postId } });
};

// 게시글 공개 여부 확인
const checkPostPublic = async (postId) => {
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: { id: true, isPublic: true },
  });
  return post;
};

module.exports = {
  createPost,
  getPosts,
  updatePost,
  deletePost,
  getPostById,
  verifyPostPassword,
  likePost,
  checkPostPublic,
};