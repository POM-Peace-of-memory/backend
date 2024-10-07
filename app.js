const express = require("express");
const api = require("./src/routers/index");
const app = express();
const { errorHandler } = require("./src/middlewares/errorHandler");
const cors = require("cors");

app.use(express.json());

// CORS 옵션 설정: 로컬 호스트에 대해서만 접근 허용
const corsOptions = {
  origin: "*", // 허용할 로컬 도메인
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // 허용할 HTTP 메서드
  credentials: true, // 쿠키와 같은 인증 정보 허용
};

// CORS 미들웨어 사용
app.use(cors(corsOptions));

app.use("/api", api);

const { swaggerUi, specs } = require("./docs/swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(errorHandler);
// 서버 시작
app.listen(3000, () => console.log("Server Started"));
