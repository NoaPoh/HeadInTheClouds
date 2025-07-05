import {
  AccessToken,
  LoginData,
  LoginResponse,
  RegisterData,
} from '../types/user';
import axiosInstance from './axiosInstance';

export const registerUser = async (data: RegisterData): Promise<void> => {
  await axiosInstance.post('/auth/register', data);
};

export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<string> => {
  const response = await axiosInstance.post<AccessToken>('/auth/refresh', {
    refreshToken,
  });
  return response.data.accessToken;
};

export const logoutUser = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

export const googleLogin = async (
  credential: string
): Promise<LoginResponse> => {
  const response = await axiosInstance.post<LoginResponse>('/auth/google', {
    credential,
  });
  return response.data;
};
