const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "Peace of Memory",
      description:
        "(POM) Peace of Memory : Node.js, express restful api project (CodeItPB-ToyProject)",
    },
    servers: [
      {
        url: "/",
        description: "API server",
      },
    ],
  },
  apis: ["./src/routers/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
