import * as s from 'superstruct';

const Hashtag = s.refine(s.string(), 'Hashtag', (value) => value.startsWith('#'));

export const CreatePost = s.object({
    nickname: s.string(),
    title: s.string(),
    content: s.string(),
    postPassword: s.string(),
    groupPassword: s.string(),
    imageUrl: s.string(),
    tags: s.array(Hashtag),
    location: s.string(),
    moment: s.string(),
    isPublic: s.boolean()
})