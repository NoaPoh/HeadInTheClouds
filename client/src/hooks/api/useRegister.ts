import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { registerUser } from '../../services/authService';
import { RegisterData } from '../../types/user';

const useRegister = () => {
  const navigate = useNavigate();

  return useMutation<void, any, RegisterData, unknown>(
    'register',
    registerUser,
    {
      onSuccess: () => {
        toast.success('Registration successful! Welcome!');
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        navigate('/login');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Registration failed');
      },
    }
  );
};

export default useRegister;
