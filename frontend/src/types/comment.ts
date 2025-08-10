export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface CommentForViewPost {
  id: string;
  userId: string;
  username: string;
  content: string;
}
