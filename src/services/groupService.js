const { PrismaClient } = require("@prisma/client");
const { hashPassword, comparePassword } = require("../util/passwordUtils.js");
const { CustomError, ErrorCodes } = require("../middlewares/errorHandler.js");

const prisma = new PrismaClient();

const createGroup = async (groupData) => {
  const { password, ...data } = groupData;
  const hashedPassword = await hashPassword(password);

  return await prisma.group.create({
    data: {
      ...data,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      isPublic: true,
      introduction: true,
      createdAt: true,
    },
  });
};

const getGroups = async (pagination, filters, sortBy) => {
  const { page, pageSize } = pagination;
  const { isPublic, keyword } = filters;
  
  const skip = (page - 1) * pageSize;
  const take = pageSize;

  // 정렬 조건
  let orderBy;
  switch (sortBy) {
    case "mostPosted":
      orderBy = { posts: { _count: "desc" } };
      break;
    case "mostLiked":
      orderBy = { groupLikes: { _count: "desc" } };
      break;
    case "mostBadge":
      orderBy = { groupBadges: { _count: "desc" } };
      break;
    case "latest":
    default:
      orderBy = { createdAt: "desc" };
  }
  
  // 조건에 따라 where절로 필터링
  const where = {
    OR: [
      { name: { contains: keyword, mode: "insensitive" } },
      { introduction: { contains: keyword, mode: "insensitive" } },
    ],
  };

  // 없으면 조건 x
  if (typeof isPublic !== "undefined") {
    // isPublic이 트루면 그대로 트루, 아니면 false로 조회
    where.isPublic = isPublic == "true";
  }

  const [groups, totalItemCount] = await prisma.$transaction([
    prisma.group.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        imageUrl: true,
        isPublic: true,
        introduction: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            groupLikes: true,
            groupBadges: true,
          },
        },
      },
    }),
    prisma.group.count({ where }),
  ]);

  return {
    currentPage: page,
    totalPages: Math.ceil(totalItemCount / pageSize),
    totalItemCount,
    data: groups.map(({ _count, ...group }) => ({
      ...group,
      postCount: _count.posts,
      likeCount: _count.groupLikes,
      badgesCount: _count.groupBadges,
    })),
  };
};

const updateGroup = async (groupId, updateData, password) => {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  const isPasswordValid = await comparePassword(password, group.password);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  return await prisma.group.update({
    where: { id: groupId },
    data: updateData,
    select: {
      id: true,
      name: true,
      imageUrl: true,
      isPublic: true,
      introduction: true,
      createdAt: true,
    },
  });
};

const deleteGroup = async (groupId, password) => {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  const isPasswordValid = await comparePassword(password, group.password);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  await prisma.group.delete({ where: { id: groupId } });
};

const getGroupById = async (groupId) => {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      isPublic: true,
      introduction: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          groupLikes: true,
        },
      },
      groupBadges: {
        select: {
          badge: {
            select: {
              content: true,
            },
          },
        },
      },
    },
  });

  return {
    ...group,
    postCount: group._count.posts,
    likeCount: group._count.groupLikes,
    badges: group.groupBadges.map((groupBadge) => groupBadge.badge.content),
  };
};

const verifyGroupPassword = async (groupId, password) => {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  const isPasswordValid = await comparePassword(password, group.password);
  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Unauthorized, "비밀번호가 틀렸습니다.");
  }
};

const likeGroup = async (groupId) => {
  await prisma.groupLike.create({
    data: { groupId },
  });
};

const isPublicGroup = async (groupId) => {
  return await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: { id: true, isPublic: true },
  });
};

module.exports = {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  getGroupById,
  verifyGroupPassword,
  likeGroup,
  isPublicGroup,
};