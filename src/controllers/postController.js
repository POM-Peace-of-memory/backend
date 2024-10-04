const { PrismaClient } = require('@prisma/client');
const s = require('superstruct');
const bcrypt = require('bcrypt');
const { ErrorCodes, CustomError } = require("../middlewares/errorHandler");
const { CreatePost, PatchPost } = require('../struct/postStruct');
const { formatDateToString, formatStringToDate } = require('../util/dateFormat');
const { hashPassword, comparePassword } = require("../util/passwordUtils.js");

const prisma = new PrismaClient();

// 게시글 등록
const createPost = async (req, res) => {
    const { groupId } = req.params;
    
    // 게시글 유효성 검사
    s.assert(req.body, CreatePost);

    const {
        nickname, title, content, postPassword, groupPassword,
        imageUrl, tags, location, moment, isPublic
    } = req.body;

    // groupId에 해당하는 그룹 존재 여부 확인
    const group = await prisma.group.findUniqueOrThrow({
        where: { id: groupId },
    });

    // 그룹 비밀번호 확인
    const passwordMatch = await bcrypt.compare(groupPassword, group.password);
    if (!passwordMatch) {
        throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
    };

    // 게시글 생성
    const newPost = await prisma.post.create({
        data: {
            nickname,
            title,
            content,
            postPassword,
            imageUrl,
            location,
            moment: formatStringToDate(moment),
            tags: {
                create: tags.map(tag => ({
                    tag: {
                        connectOrCreate: {
                            where: { content: tag },  // tag 이름을 기준으로 태그가 이미 있으면 연결하고, 없으면 새로 생성
                            create: { content: tag }, // 태그가 없을 경우 생성
                        },
                    },
                })),
            },
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
            location: true,
            moment: true,
            isPublic: true,
            tags: {
                select: {
                    tag: {
                        select: {
                            content: true
                        }
                    }
                }
            },
            createdAt: true,
        }
    });

    // 좋아요 수 계산
    const likeCount = await prisma.postLike.count({
        where: { postId: newPost.id }
    });

    // 댓글 수 계산
    const commentCount = await prisma.comment.count({
        where: { postId: newPost.id }
    });

    // 태그를 문자열 배열로 변환
    const tagsContent = newPost.tags.map(tag => tag.tag.content);
    
    // 최종 응답
    res.status(201).json({
        id: newPost.id,
        groupId: newPost.groupId,
        nickname: newPost.nickname,
        title: newPost.title,
        content: newPost.content,
        imageUrl: newPost.imageUrl,
        tags: tagsContent,
        location: newPost.location,
        moment: formatDateToString(newPost.moment), // 'YYYY-MM-DD' 형식으로 변환
        isPublic: newPost.isPublic,
        likeCount,
        commentCount,
        createdAt: formatDateToString(newPost.createdAt)
    });
};

// 게시글 목록 조회
const postList = async (req, res) => {
    const { groupId } = req.params;

    // query parameter default 값 설정
    const {
        page = 1,
        pageSize = 8,
        sortBy = 'latest',
        keyword = '',
        isPublic = 'true',
    } = req.query;

    // groupId에 해당하는 그룹 존재 여부 확인
    const group = await prisma.group.findUniqueOrThrow({
        where: { id: groupId },
    });

    // isPublic 문자열을 boolean으로 변환
    const isPublicValue = isPublic === 'true';

    // 게시글 keyword 포함 및 공개 조건 설정
    const where = {
        groupId: group.id,
        ...(isPublic !== undefined && { isPublic: isPublicValue }),
        ...(keyword && {
            OR: [
                { title: { contains: keyword } },
                {
                    tags: {
                        some: {
                            tag: {
                                content: {
                                    contains: keyword,
                                },
                            },
                        },
                    },
                },
            ],
        }),
    };

    // 게시글 조회
    const totalItemCount = await prisma.post.count({
        where,
    });

    const posts = await prisma.post.findMany({
        where,
        orderBy: {
            createdAt: 'desc',
        },
        skip: (page - 1) * pageSize,
        take: Number(pageSize),
        select: {
            id: true,
            nickname: true,
            title: true,
            imageUrl: true,
            isPublic: true,
            moment: true,
            createdAt: true,
            _count: {
                select: {
                    postLikes: true,   // 게시글의 좋아요 수
                    comments: true,    // 댓글 수
                },
            },
            tags: {
                select: {
                    tag: {
                        select: {
                            content: true, // 태그 내용을 가져옴
                        },
                    },
                },
            },
            location: true,
        },
    });

    // 페이지 계산
    const totalPages = Math.ceil(totalItemCount / pageSize);

    // 포맷팅 후 반환
    const formattedPosts = posts.map(post => ({
        id: post.id,
        nickname: post.nickname,
        title: post.title,
        imageUrl: post.imageUrl,
        tags: post.tags.map(tag => tag.tag.content), // 태그를 문자열 배열로 변환
        location: post.location,
        moment: formatDateToString(post.moment), // 포맷팅된 moment
        isPublic: post.isPublic,
        likeCount: post._count.postLikes, // 좋아요 수
        commentCount: post._count.comments, // 댓글 수
        createdAt: post.createdAt, // createdAt 그대로 반환
    }));

    res.status(200).json({
        currentPage: Number(page),
        totalPages,
        totalItemCount,
        data: formattedPosts,
    });
};



// 게시글 수정
const editPost = async (req, res) => {
    const { postId } = req.params;

    // 유효성 검사
    assert(req.body, PatchPost);

    // 비밀번호 제외 나머지 정보 저장
    const { postPassword, ...updateData } = req.body;

    // postId에 해당하는 게시글 존재 여부 확인
    const post = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    // 게시글 비밀번호 확인
    if (post.postPassword !== postPassword) {
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
};


// 게시글 삭제
const deletePost = async (req, res) => {
    const { postId } = req.params;
    const { postPassword } = req.body;

    const post = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    if (post.postPassword !== postPassword) {
        throw new CustomError(ErrorCodes.Forbidden, "비밀번호가 일치하지 않습니다.");
    };

    await prisma.post.delete({
        where: { id: postId }
    });

    res.status(200).json({ message: "게시글 삭제 성공" });    
};

// 게시글 상세 정보 조회
const postDetail = async (req, res) => {
    const { postId } = req.params;

    const post = await prisma.post.findUniqueOrThrow({
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

    res.status(200).json(post);
};


// 게시글 조회 권한 확인
const verifyPassword = async (req, res) => {
    const { postId } = req.params;
    const { postPassword } = req.body;

    const post = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    if (post.password !== postPassword) {
        throw new CustomError(ErrorCodes.Unauthorized, "비밀번호가 틀렸습니다.");
    }

    res.status(200).json({ message: "비밀번호가 확인되었습니다." })

};

// 게시글 공감
const likePost = async (req, res) => {
    const { postId } = req.params;
    
    const post = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });
    
    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { likeCount: post.likeCount + 1 },
    });

    return res.status(200).json({
        message: "게시글 공감하기 성공",
        likeCount: updatedPost.likeCount,
    });
};

// 그룹 공개 여부 확인
const checkPublic = async (req, res) => {
    const { postId } = req.params;

    const post = await prisma.post.findUniqueOrThrow({
        where: { id: postId }
    });

    return res.status(200).json({
        id: post.postId,
        isPublic: post.isPublic
    });
};

module.exports = {
    createPost,
    postList,
    editPost,
    deletePost,
    postDetail,
    verifyPassword,
    likePost,
    checkPublic
};