const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const { assert } = require('superstruct');
const { CreatePost } = require('../struct/postStruct');
const { formatStringToDate } = require('../util/dateFormat');
const { create } = require('superstruct');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createPost = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    
    // 게시글 유효성 검사
    assert(req.body, CreatePost);

    const {
        nickname, title, content, postPassword, groupPassword,
        imageUrl, tags, location, moment, isPublic
    } = req.body;

    // groupId에 해당하는 그룹 존재 여부 확인
    const group = await prisma.group.findUniqueOrThrow({
        where: {id: groupId},
    });

    // 그룹 비밀번호 확인
    if (group.password !== groupPassword) {
        throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
    }

    // 게시글 생성
    const post = await prisma.post.create({
        data: {
            nickname,
            title,
            content,
            postPassword,
            imageUrl,
            location,
            moment: formatStringToDate(moment),
            tags,
            isPublic,
            groupId,
        },
        // Response 형식에 맞게 데이터 선택
        select: {
            id: true,
            groupId: true,
            nickname: true,
            title: true,
            content: true,
            imageUrl: true,
            tags: true,
            location: true,
            moment: true,
            isPublic: true,
            likeCount: {
                select: {
                    id: true,
                }
            },
            commentCount: {
                select: {
                    id: true,
                }
            },
            createdAt: true,
        }
    });

    // 좋아요 수 계산
    const likeCount = await prisma.postLike.count({
        where: { postId: post.id }
    });

    // 댓글 수 계산
    const commentCount = await prisma.comment.count({
        where: { postId: post.id }
    });

    res.status(201).json({
        ...newPost,
        likeCount,
        commentCount
    });
});

module.exports = createPost;