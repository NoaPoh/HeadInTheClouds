import axiosInstance from './axiosInstance';
import { GetUserResponse, UpdateUserVariables, User } from '../types/user';

export const getUser = async (id: string): Promise<GetUserResponse> => {
  const response = await axiosInstance.get<GetUserResponse>(`/users/${id}`);
  return response.data;
};

export const updateUser = async ({
  userId,
  username,
  profilePictureFile,
}: UpdateUserVariables): Promise<User> => {
  const formData = new FormData();
  if (username) formData.append('username', username);
  if (profilePictureFile) formData.append('profilePicture', profilePictureFile);

  const response = await axiosInstance.put<User>(`/users/${userId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
