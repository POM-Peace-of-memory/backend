const bcrypt = require("bcrypt");

// 비밀번호 해싱 함수
// 비동기 방식으로 처리하여 서버 성능을 최적화합니다.
// - 해싱 작업은 CPU 집약적 작업, 비동기로 처리하지 않으면
//   서버가 해당 작업을 기다리며 블로킹이 생길 수 있음
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// 비밀번호 비교 함수
async function comparePassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { hashPassword, comparePassword };
