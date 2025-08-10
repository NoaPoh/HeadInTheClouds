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
  try {
    // First update the username if provided
    if (username) {
      console.log('Updating username for user:', userId);
      await axiosInstance.put(`/users/${userId}`, { username });
    }

    // Then handle profile picture upload if provided
    if (profilePictureFile) {
      console.log('Uploading profile picture for user:', userId);
      const formData = new FormData();
      formData.append('profilePicture', profilePictureFile);
      
      await axiosInstance.post(
        `/users/${userId}/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
    }

    // Finally, fetch the updated user data
    const response = await axiosInstance.get(`/users/${userId}`);
    console.log('User update completed successfully');
    return response.data;
  } catch (error: any) {
    console.error('Update failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};
