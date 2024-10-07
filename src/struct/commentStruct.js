const s = require("superstruct");

const CreateComment = s.object({
  nickname: s.string(),
  content: s.string(),
  password: s.string(),
});

const UpdateComment = s.partial(CreateComment);

module.exports = { CreateComment, UpdateComment };
