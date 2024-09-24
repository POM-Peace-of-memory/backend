const express = require('express');
const api = require("./src/routers/index")
const app = express();
const {errorHandler} = require("./src/middlewares/errorHandler")

app.use("/api", api);

const { swaggerUi, specs } = require("./docs/swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(errorHandler);
// 서버 시작
app.listen(3000, () => console.log('Server Started'));