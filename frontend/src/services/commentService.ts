import axiosInstance from './axiosInstance';
import { Comment, CommentForViewPost } from '../types/comment';

export const getComments = async (
  postId: string,
  signal?: AbortSignal
): Promise<CommentForViewPost[]> => {
  try {
    const response = await axiosInstance.get<CommentForViewPost[]>(
      `/comments/${postId}`,
      {
        signal,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

export const addComment = async (
  postId: string,
  content: string,
  userId: string
): Promise<Comment> => {
  try {
    const response = await axiosInstance.post(`/comments/`, {
      postId,
      content,
      userId,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

export const deleteComment = async (commentId: string) => {
  try {
    await axiosInstance.delete(`/comments/${commentId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};
