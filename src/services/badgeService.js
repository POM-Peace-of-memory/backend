const { PrismaClient } = require("@prisma/client");
const { CustomError, ErrorCodes } = require("../middlewares/errorHandler.js");

const prisma = new PrismaClient();

// 뱃지 내용 객체
const BadgeContents = {
  SEVEN_DAYS_POST: "7일 연속 게시글 등록",
  TWENTY_POSTS: "게시글 20개 달성",
  ONE_YEAR_ACTIVITY: "1년 활동 달성",
  TEN_THOUSAND_LIKES: "공감 1만개 달성",
  TEN_THOUSAND_POST_LIKES: "게시글 공감 1만개 달성",
};

// 뱃지 ID 가져오기 (뱃지가 없을 경우 에러 발생)
const getBadgeId = async (content) => {
  const badge = await prisma.badge.findUniqueOrThrow({
    where: { content: content },
  });
  return badge.id;
};

// 7일 연속 게시글 등록 뱃지 검증
const assert7DayBadge = async (groupId) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 오늘 포함 7일간 확인
  sevenDaysAgo.setHours(0, 0, 0, 0); // 시간, 분, 초, 밀리초를 0으로 설정

  const postsCountByDay = await prisma.$queryRaw`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "Post"
    WHERE "groupId" = ${groupId}
    AND "createdAt" >= ${sevenDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC;
  `;

  const hasPostsEveryDay = postsCountByDay.length == 7;

  if (hasPostsEveryDay) {
    console.log("이 그룹은 7일 연속 게시글이 등록되었습니다.");
    const badgeId = await getBadgeId(BadgeContents.SEVEN_DAYS_POST);

    const existingGroupBadge = await prisma.groupBadge.findUnique({
      where: {
        groupId_badgeId: {
          groupId: groupId,
          badgeId: badgeId,
        },
      },
    });

    if (!existingGroupBadge) {
      await prisma.groupBadge.create({
        data: {
          groupId: groupId,
          badgeId: badgeId,
        },
      });
      console.log("그룹에 7일 연속 게시글 등록 뱃지를 추가했습니다.");
    }
  }
};

// 20개 이상의 게시글 등록 뱃지 검증
const assert20PostBadge = async (groupId) => {
  const totalPostsCount = await prisma.post.count({
    where: { groupId: groupId },
  });

  if (totalPostsCount >= 20) {
    console.log("이 그룹에는 20개 이상의 게시글이 등록되었습니다.");
    const badgeId = await getBadgeId(BadgeContents.TWENTY_POSTS);

    const existingGroupBadge = await prisma.groupBadge.findUnique({
      where: {
        groupId_badgeId: {
          groupId: groupId,
          badgeId: badgeId,
        },
      },
    });

    if (!existingGroupBadge) {
      await prisma.groupBadge.create({
        data: {
          groupId: groupId,
          badgeId: badgeId,
        },
      });
      console.log("그룹에 게시글 20개 달성 뱃지를 추가했습니다.");
    }
  }
};

// 1년 활동 뱃지 검증
const assert1YearBadge = async (groupId) => {
  const group = await prisma.group.findUniqueOrThrow({
    where: { id: groupId },
    select: { createdAt: true },
  });

  // 그룹 생성일에 1년을 더한 날짜 계산
  const oneYearLater = new Date(group.createdAt);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  // 현재 날짜가 그룹 생성일 + 1년 이후인지 확인
  const now = new Date();
  if (now >= oneYearLater) {
    console.log("이 그룹은 등록된 지 1년이 지났습니다.");
    const badgeId = await getBadgeId(BadgeContents.ONE_YEAR_ACTIVITY);

    const existingGroupBadge = await prisma.groupBadge.findUnique({
      where: {
        groupId_badgeId: {
          groupId: groupId,
          badgeId: badgeId,
        },
      },
    });

    if (!existingGroupBadge) {
      await prisma.groupBadge.create({
        data: {
          groupId: groupId,
          badgeId: badgeId,
        },
      });
      console.log("그룹에 1년 활동 달성 뱃지를 추가했습니다.");
    }
  }
};

// 1만개 이상의 그룹 공감 수 뱃지 검증
const assert10KLikesBadge = async (groupId) => {
  const groupLikesCount = await prisma.groupLike.count({
    where: { groupId: groupId },
  });

  if (groupLikesCount >= 10000) {
    console.log("이 그룹은 공감 수 1만개를 달성했습니다.");
    const badgeId = await getBadgeId(BadgeContents.TEN_THOUSAND_LIKES);

    const existingGroupBadge = await prisma.groupBadge.findUnique({
      where: {
        groupId_badgeId: {
          groupId: groupId,
          badgeId: badgeId,
        },
      },
    });

    if (!existingGroupBadge) {
      await prisma.groupBadge.create({
        data: {
          groupId: groupId,
          badgeId: badgeId,
        },
      });
      console.log("그룹에 공감 1만개 달성 뱃지를 추가했습니다.");
    }
  }
};

// 1만개 이상의 게시글 공감 수 뱃지 검증
const assert10KPostLikesBadge = async (postId) => {
  // 해당 게시글의 공감 수와 그룹 ID를 조회
  const post = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: {
      groupId: true,
      _count: {
        select: { postLikes: true },
      },
    },
  });

  const groupId = post.groupId;
  const postLikes = post._count.postLikes;

  // 공감 수가 1만 개 이상인지 확인
  if (postLikes >= 10000) {
    console.log("이 그룹의 게시글 공감 수 1만개를 달성했습니다.");
    const badgeId = await getBadgeId(BadgeContents.TEN_THOUSAND_POST_LIKES);

    // 그룹에 해당 뱃지가 있는지 확인
    const existingGroupBadge = await prisma.groupBadge.findUnique({
      where: {
        groupId_badgeId: {
          groupId: groupId,
          badgeId: badgeId,
        },
      },
    });

    // 뱃지가 없으면 추가
    if (!existingGroupBadge) {
      await prisma.groupBadge.create({
        data: {
          groupId: groupId,
          badgeId: badgeId,
        },
      });
      console.log("그룹에 게시글 공감 1만개 달성 뱃지를 추가했습니다.");
    }
  }
};

module.exports = {
  assert7DayBadge,
  assert20PostBadge,
  assert1YearBadge,
  assert10KLikesBadge,
  assert10KPostLikesBadge,
};
