const groupService = require("../services/groupService.js");
const BadgeService = require("../services/badgeService.js");
const s = require("superstruct");
const { CreateGroup, UpdateGroup } = require("../struct/groupStruct.js");

// 그룹 등록
const createGroup = async (req, res) => {
  s.assert(req.body, CreateGroup);
  const group = await groupService.createGroup(req.body);
  res.status(201).json(group);
};

// 그룹 목록 조회
const getGroups = async (req, res) => {
  const groups = await groupService.getGroups(req.query);
  res.status(200).json(groups);
};

// 그룹 수정
const updateGroup = async (req, res) => {
  const { groupId } = req.params;
  s.assert(req.body, UpdateGroup);
  const { password, ...updateData } = req.body;
  const updatedGroup = await groupService.updateGroup(
    groupId,
    updateData,
    password,
  );
  res.status(200).json(updatedGroup);
};

// 그룹 삭제
const deleteGroup = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;
  await groupService.deleteGroup(groupId, password);
  res.status(200).json({ message: "그룹 삭제 성공" });
};

// 그룹 상세 조회
const getGroupById = async (req, res) => {
  const { groupId } = req.params;
  await BadgeService.assert1YearBadge(groupId);
  const group = await groupService.getGroupById(groupId);
  res.status(200).json(group);
};

// 그룹 조회 권한 확인
const verifyGroupPassword = async (req, res) => {
  const { groupId } = req.params;
  const { password } = req.body;
  await groupService.verifyGroupPassword(groupId, password);
  res.status(200).json({ message: "비밀번호가 확인되었습니다." });
};

// 그룹 공감하기
const likeGroup = async (req, res) => {
  const { groupId } = req.params;
  await groupService.likeGroup(groupId);
  await BadgeService.assert10KLikesBadge(groupId);
  res.status(200).json({ message: "그룹 공감하기 성공" });
};

// 그룹 공개 여부 확인
const isPublicGroup = async (req, res) => {
  const { groupId } = req.params;
  const group = await groupService.isPublicGroup(groupId);
  res.status(200).json(group);
};

module.exports = {
  createGroup,
  getGroups,
  updateGroup,
  deleteGroup,
  getGroupById,
  verifyGroupPassword,
  likeGroup,
  isPublicGroup,
};
