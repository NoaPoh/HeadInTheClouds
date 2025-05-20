import mongoose from 'mongoose';

export interface CommentForViewPost {
  _id: string;
  userId: string;
  username: string;
  content: string;
}

export interface IComment
  extends mongoose.Document<mongoose.Schema.Types.ObjectId> {
  postId: mongoose.Schema.Types.ObjectId;
  content: string;
  userId: string;
}

export const commentSchema = new mongoose.Schema<IComment>({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  userId: { type: String, ref: 'User', required: true }, // Change from String to ObjectId
  content: { type: String, required: true },
});
