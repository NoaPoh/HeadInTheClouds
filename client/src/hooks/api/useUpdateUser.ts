import { useMutation } from 'react-query';
import { updateUser } from '../../services/userService';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { UpdateUserVariables, User } from '../../types/user';

export const useUpdateUser = () => {
  const navigate = useNavigate();

  return useMutation<User, any, UpdateUserVariables>(updateUser, {
    onSuccess: (data: User) => {
      toast.success('Update successful!!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      navigate('/profile');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed');
    },
  });
};
