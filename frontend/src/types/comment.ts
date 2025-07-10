export interface Comment {
  _id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface CommentForViewPost {
  _id: string;
  userId: string;
  username: string;
  content: string;
}
