import axiosInstance from './axiosInstance';
import {
  NewPostData,
  Post,
  PostsForFeedResponse,
  PostsResponse,
  UpdatePostData,
} from '../types/post';

export const createPost = async (data: NewPostData): Promise<Post> => {
  if (!data.imageFile) {
    const response = await axiosInstance.post<Post>('/posts', data);
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('bookTitle', data.bookTitle);
    formData.append('content', data.content || '');
    formData.append('readingProgress', (data.readingProgress || 0).toString());
    formData.append('authorName', data.authorName || '');
    formData.append('imageFile', data.imageFile);

    const response = await axiosInstance.post<Post>('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export const getPostsForFeed = async (
  page: number
): Promise<PostsForFeedResponse> => {
  const response = await axiosInstance.get<PostsForFeedResponse>(
    `/posts/feed?page=${page}`
  );
  return response.data;
};

export const getPost = async (
  id: string,
  signal?: AbortSignal
): Promise<Post> => {
  const response = await axiosInstance.get<Post>(`/posts/${id}`, { signal });
  return response.data;
};

export const updatePost = async (data: UpdatePostData): Promise<Post> => {
  if (!data.imageFile) {
    const response = await axiosInstance.put<Post>(`/posts/${data._id}`, data);
    return response.data;
  } else {
    const formData = new FormData();
    formData.append('bookTitle', data.bookTitle);
    formData.append('content', data.content || '');
    formData.append('readingProgress', (data.readingProgress || 0).toString());
    formData.append('authorName', data.authorName || '');
    formData.append('imageFile', data.imageFile);

    const response = await axiosInstance.put<Post>(
      `/posts/${data._id}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};

export const deletePost = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/posts/${id}`);
};

export const likePost = async (id: string): Promise<void> => {
  await axiosInstance.post(`/posts/${id}/like`);
};

export const getPostsByUserId = async (
  userId: string,
  page: number
): Promise<PostsResponse> => {
  const response = await axiosInstance.get(
    `/posts/user/${userId}?page=${page}`
  );
  return response.data;
};
