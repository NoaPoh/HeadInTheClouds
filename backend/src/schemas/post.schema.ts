import mongoose from 'mongoose';

export interface IPostForFeed {
  _id: string;
  userId: string;
  imageUrl: string;
  bookTitle: string;
  content: string;
  likesCount: number;
  commentsCount: number;
}

export interface INewPost {
  bookTitle: string;
  content: string;
  imageUrl: string;
  userId: string;
}

export interface IPost
  extends mongoose.Document<mongoose.Schema.Types.ObjectId> {
  bookTitle: string;
  content: string;
  userId: string;
  imageUrl: string;
  createdAt: Date;
  likes: string[];
  comments: string[];
  readingProgress?: number;
  authorName?: string;
}

export const postSchema = new mongoose.Schema<IPost>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  bookTitle: { type: String, required: true },
  content: { type: String, required: false },
  userId: { type: String, required: true, ref: 'User' },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, required: true, default: () => new Date() },
  likes: { type: [String], required: true, default: [] },
  readingProgress: { type: Number }, // Optional field
  authorName: { type: String },
});
