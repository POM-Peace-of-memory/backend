const express = require('express');
const asyncHandler = require('../middlewares/asyncHandler');
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const { assert } = require('superstruct');
const { CreatePost, PatchPost } = require('../struct/postStruct');
const { formatStringToDate } = require('../util/dateFormat');
const { create } = require('superstruct');
const { PrismaClient } = require('@prisma/client');
const { formatDateToString, formatStringToDate } = require('../utill/dateFormat');
const prisma = new PrismaClient();

// 게시글 등록
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


// 게시글 목록 조회
const postList = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    // query parameter default 값 설정
    const {
        page = 1,
        pageSize = 8,
        sortBy = 'latest',
        keyword = '',
        isPublic = 'true'
    } = req.query;

    // groupId에 해당하는 그룹 존재 여부 확인
    const group = await prisma.group.findUniqueOrThrow({
        where: { id: groupId },
    });

    // 게시글 keyword 포함 및 공개 조건 설정
    const where = {
        groupId: group.id,
        ...(isPublic !== undefined && { isPublic }),
        ...(keyword && {
            OR: [
                { title: { contains: keyword } },
                { tags: { some: { name: { contains: keyword } } } },
            ],
        }),
    };
    
    // 정렬 조건 설정
    const orderBy = sortBy === 'mostLiked' ? { likeCount: 'desc' } :
                    sortBy === 'mostCommented' ? { commentCount: 'desc' } :
                    { createdAt: 'desc' };

    // 게시글 조회
    const [totalItemCount, posts] = await Promise.all([
        prisma.post.count({ where }),
        prisma.post.findMany({
            where,
            orderBy,
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                nickname: true,
                title: true,
                imageUrl: true,
                isPublic: true,
                likeCount: true,
                commentCount: true,
                moment: formatDateToString(moment),
                tags: true,
                location: true,
                createdAt: formatDateToString(createdAt),
            },
        }),
    ]);

    // 페이지 계산
    const totalPages = Math.ceil(totalItemCount / pageSize);

    res.status(200).json({
        currentPage: page,
        totalPages,
        totalItemCount,
        data: posts,
    });
});


// 게시글 수정
const editPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    // 유효성 검사
    assert(req.body, PatchPost);

    // 비밀번호 제외 나머지 정보 저장
    const { postPassword, ...updateData } = req.body;

    // postId에 해당하는 게시글 존재 여부 확인
    const foundPost = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    // 게시글 비밀번호 확인
    if (foundPost.postPassword !== postPassword) {
        throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
    }

    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: updateData,
        select: {
            id: true,
            groupId: true,
            nickname: true,
            title: true,
            content: true,
            imageURL: true,
            tags: true,
            location: true,
            moment: formatStringToDate(moment),
            isPublic: true,
            likeCount: true,
            commentCount: true,
            createdAt: true
        }
    });
    res.status(200).json(updatedPost);
})


// 게시글 삭제
const deletePost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { postPassword } = req.body;

    const foundPost = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    if (foundPost.postPassword !== postPassword) {
        throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
    };

    await prisma.post.delete({
        where: { id: postId }
    });

    res.status(200).json({ message: "게시글 삭제 성공" });    
});

// 게시글 상세 정보 조회
const postDetail = asyncHandler(async (req, res) => {
    const { postId } = req.params;

    const foundPost = await prisma.post.findUniqueOrThrow({
        where: { id: postId },
        select: {
            id: true,
            groupId: true,
            nickname: true,
            title: true,
            content: true,
            imageURL: true,
            tags: true,
            location: true,
            moment: formatDateToString(moment),
            isPublic: true,
            likeCount: true,
            commentCount: true,
            createdAt: formatDateToString(createdAt)
        }
    });

    res.status(200).json(foundPost);
});


// 게시글 조회 권한 확인
const verifyPassword = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { postPassword } = req.body;

    const foundPost = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    if (foundPost.password !== postPassword) {
        throw new CustomError(ErrorCodes.Unauthorized, "비밀번호가 틀렸습니다.");
    }

    res.status(200).json({ message: "비밀번호가 확인되었습니다." })

})

module.exports = { createPost, postList, editPost, deletePost, postDetail, verifyPassword };