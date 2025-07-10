export interface Post {
  _id: string;
  bookTitle: string;
  content: string;
  imageUrl: string;
  createdAt: Date;
  userId: string;
  likes: string[];
  readingProgress?: number;
  authorName?: string;
}

export interface PostForFeed {
  _id: string;
  userId: string;
  imageUrl: string;
  bookTitle: string;
  content: string;
  likesCount: number;
  commentsCount: number;
}

export interface NewPostFormData {
  bookTitle: string;
  content?: string;
  readingProgress?: number;
  authorName?: string;
}

export interface NewPostData extends NewPostFormData {
  userId: string;
  imageUrl?: string;
  imageFile?: File;
}

export interface UpdatePostData extends NewPostFormData {
  _id: string;
  imageUrl?: string;
  imageFile?: File;
}

export interface PostsResponse {
  posts: Post[];
  totalPages: number;
}

export interface PostsForFeedResponse {
  posts: PostForFeed[];
  totalPages: number;
}
