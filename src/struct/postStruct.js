const s = require("superstruct");

const Hashtag = s.refine(s.string(), "Hashtag", (value) =>
  value.startsWith("#"),
);

const CreatePost = s.object({
  nickname: s.string(),
  title: s.string(),
  content: s.string(),
  postPassword: s.string(),
  groupPassword: s.string(),
  imageUrl: s.string(),
  tags: s.array(Hashtag),
  location: s.string(),
  moment: s.string(),
  isPublic: s.boolean(),
});

const PatchPost = s.partial(CreatePost);

module.exports = { CreatePost, PatchPost };
