const s = require("superstruct");

// 그룹 생성에 사용할 구조체
const CreateGroup = s.object({
  name: s.size(s.string(), 1, 50), // 이름은 최소 1자, 최대 50자
  password: s.size(s.string(), 8, 30), // 비밀번호는 최소 8자, 최대 30자
  imageUrl: s.string(), // 이미지 URL은 단순 문자열로 검증
  isPublic: s.boolean(), // 공개 여부는 불리언
  introduction: s.size(s.string(), 0, 200), // 소개는 최대 200자
});

// 그룹 수정에 사용할 구조체 (부분 수정 허용)
const UpdateGroup = s.partial(CreateGroup); // CreateGroup의 모든 필드를 부분적으로 허용

module.exports = { CreateGroup, UpdateGroup };
