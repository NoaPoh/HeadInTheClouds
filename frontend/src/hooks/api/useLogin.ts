import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { loginUser } from '../../services/authService';
import { LoginData, LoginResponse } from '../../types/user';

const useLogin = (handleSetLoggedInUser?: (userId: string) => void) => {
  const { data: tokens, ...rest } = useMutation<
    LoginResponse,
    any,
    LoginData,
    unknown
  >(loginUser, {
    onSuccess: (data: LoginResponse) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      toast.success('Login successful! Welcome!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      handleSetLoggedInUser && handleSetLoggedInUser(data.userId);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  return { ...rest, tokens };
};
export default useLogin;
