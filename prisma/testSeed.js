const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const p = require("../src/util/passwordUtils");
async function main() {
  // 1. 테스트 그룹 생성 (생성일은 1년 전)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const password = await p.hashPassword("asdf1234");

  const group = await prisma.group.create({
    data: {
      name: "테스트 그룹",
      password: password, // 실제 환경에서는 해시된 비밀번호 사용
      imageUrl: "https://example.com/group.jpg",
      isPublic: true,
      introduction: "모든 조건을 만족하는 테스트 그룹입니다.",
      createdAt: oneYearAgo,
    },
  });

  // 2. 7일 연속 게시글 등록 (1주일 전부터 오늘까지 매일 게시글 생성)
  const posts = [];
  for (let i = 0; i < 6; i++) {
    const postDate = new Date();
    postDate.setDate(postDate.getDate() - (6 - i)); // 7일 전부터 오늘까지

    posts.push({
      groupId: group.id,
      nickname: `사용자${i + 1}`,
      title: `테스트 게시글 ${i + 1}`,
      content: `테스트 게시글 내용 ${i + 1}`,
      postPassword: password, // 실제 환경에서는 해시된 비밀번호 사용
      isPublic: true,
      moment: postDate,
      createdAt: postDate,
    });
  }

  // 추가로 13개의 게시글을 더 추가해 총 20개의 게시글 생성
  for (let i = 7; i < 20; i++) {
    posts.push({
      groupId: group.id,
      nickname: `사용자${i + 1}`,
      title: `추가 테스트 게시글 ${i + 1}`,
      content: `추가 테스트 게시글 내용 ${i + 1}`,
      postPassword: password,
      isPublic: true,
      moment: new Date(),
      createdAt: new Date(),
    });
  }

  await prisma.post.createMany({ data: posts });

  // 3. 그룹 공감 수 1만 개 추가
  await prisma.groupLike.createMany({
    data: Array.from({ length: 10000 }, () => ({
      groupId: group.id,
      createdAt: new Date(),
    })),
  });

  // 4. 첫 번째 게시글에 공감 1만 개 추가
  const firstPost = await prisma.post.findFirst({
    where: { groupId: group.id },
  });

  if (firstPost) {
    await prisma.postLike.createMany({
      data: Array.from({ length: 10000 }, () => ({
        postId: firstPost.id,
        createdAt: new Date(),
      })),
    });
  }

  console.log(
    "모든 조건을 만족하는 테스트 데이터가 성공적으로 추가되었습니다.",
  );
}

main()
  .catch((e) => {
    console.error("테스트 데이터 추가 중 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
