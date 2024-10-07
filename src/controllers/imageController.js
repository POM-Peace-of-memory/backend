const express = require("express");
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const path = require("path");

require("dotenv").config();

// S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

// Multer 설정
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// S3에 파일 업로드 함수
const uploadToS3 = async (file) => {
  const ext = path.extname(file.originalname);
  const key = `${Date.now()}-${uuidv4()}${ext}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3Client.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
};

const multerMiddleware = upload.single("image");

// 이미지 업로드 핸들러
const imageUpload = async (req, res) => {
  // upload.single에서 받아 req.file로 전달
  const file = req.file;

  if (!file) {
    throw new CustomError(ErrorCodes.BadRequest, "파일이 제공되지 않았습니다.");
  }

  const fileUrl = await uploadToS3(file);

  res.json({
    imageUrl: fileUrl,
  });
};

module.exports = { imageUpload, multerMiddleware };
