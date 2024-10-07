const { PrismaClient } = require("@prisma/client");
const s = require("superstruct");
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler.js");
const { CreateGroup, UpdateGroup } = require("../struct/groupStruct.js");
const { hashPassword, comparePassword } = require("../util/passwordUtils.js");

const prisma = new PrismaClient();

// 그룹 등록
const createGroup = async (req, res) => {
  s.assert(req.body, CreateGroup);

  const { password, ...groupData } = req.body;
  const hashedPassword = await hashPassword(password);

  const group = await prisma.group.create({
    data: {
      ...groupData,
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

  res.status(201).json(group);
};

// 그룹 목록 조회
const getGroups = async (req, res) => {
  // 퀴리 파라미터
  const {
    page = 1,
    pageSize = 10,
    sortBy = "latest",
    keyword = "",
    isPublic,
  } = req.query;

  //페이지네이션 처리
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

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

  // 이름과 소개에 키워드가 포함되는 조건
  const where = {
    OR: [
      { name: { contains: keyword, mode: "insensitive" } },
      { introduction: { contains: keyword, mode: "insensitive" } },
    ],
  };

  // 퀴리가 없으면 조건 x
  if (typeof isPublic !== "undefined") {
    // isPublic이 트루면 그대로 트루, 아니면 false로 조회
    where.isPublic = isPublic == "true";
  }

  // 데이터 베이스
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

  // 응답
  res.status(200).json({
    currentPage: Number(page),
    totalPages: Math.ceil(totalItemCount / Number(pageSize)),
    totalItemCount,
    data: groups.map(({ _count, ...group }) => ({
      ...group,
      postCount: _count.posts,
      likeCount: _count.groupLikes,
      badgesCount: _count.groupBadges,
    })),
  });
};

// 그룹 수정
const updateGroup = async (req, res) => {
  const { groupId } = req.params;
  s.assert(req.body, UpdateGroup);

  const { password, ...updateData } = req.body;

  // 해당 그룹 가져옴
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  if (!password) {
    throw new CustomError(ErrorCodes.BadRequest);
  }

  // 비밀번호를 비교하여 불일치시 수정 x
  const isPasswordValid = await comparePassword(password, group.password);

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  // 데이터 베이스 업데이트
  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
    // 아래의 속성만 조회
    select: {
      id: true,
      name: true,
      imageUrl: true,
      isPublic: true,
      introduction: true,
      createdAt: true,
    },
  });

  // 응답
  res.status(200).json(updatedGroup);
};

// 그룹 삭제
const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  const isPasswordValid = await comparePassword(password, group.password);

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 틀렸습니다");
  }

  await prisma.group.delete({ where: { id: groupId } });

  res.status(200).json({ message: "그룹 삭제 성공" });
};

// 그룹 상세 조회
const getGroupById = async (req, res) => {
  const { groupId } = req.params;

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
        // groupBadges를 통해 Badge 모델을 가져옵니다.
        select: {
          badge: {
            // Badge 모델을 통해 배지의 이름을 가져옵니다.
            select: {
              content: true, // 배지의 content(이름) 필드 선택
            },
          },
        },
      },
    },
  });

  const { _count, groupBadges, ...groupData } = group;

  const badges = groupBadges.map((groupBadge) => groupBadge.badge.content);

  res.status(200).json({
    ...groupData,
    postCount: _count.posts,
    likeCount: _count.groupLikes,
    badges: badges,
  });
};

// 그룹 조회 권한 확인
const verifyGroupPassword = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  const isPasswordValid = await comparePassword(password, group.password);

  if (!isPasswordValid) {
    throw new CustomError(ErrorCodes.Unauthorized, "비밀번호가 틀렸습니다.");
  }

  res.status(200).json({ message: "비밀번호가 확인되었습니다." });
};

// 그룹 공감하기
const likeGroup = async (req, res) => {
  const { groupId } = req.params;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
  });

  await prisma.groupLike.create({
    data: { groupId },
  });

  res.status(200).json({ message: "그룹 공감하기 성공" });
};

// 그룹 공개 여부 확인
const isPublicGroup = async (req, res) => {
  const { groupId } = req.params;

  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: { id: true, isPublic: true },
  });

  res.status(200).json(group);
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
