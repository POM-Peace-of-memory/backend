const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const initializeBadges = async () => {
  const badgeContents = [
    "7일 연속 게시글 등록",
    "게시글 20개 달성",
    "1년 활동 달성",
    "공감 1만개 달성",
    "게시글 공감 1만개 달성",
  ];

  for (const content of badgeContents) {
    const existingBadge = await prisma.badge.findUnique({
      where: { content },
    });

    if (!existingBadge) {
      await prisma.badge.create({
        data: { content },
      });
      console.log(`뱃지 '${content}'를 생성했습니다.`);
    } else {
      console.log(`뱃지 '${content}'는 이미 존재합니다.`);
    }
  }
};

initializeBadges()
  .catch((error) => {
    console.error("뱃지 초기화 중 에러 발생:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(1);
  });
