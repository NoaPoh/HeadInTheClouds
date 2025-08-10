import { useMutation, useQueryClient } from 'react-query';
import { updateUser } from '../../services/userService';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { UpdateUserVariables, User } from '../../types/user';
import { useAtom } from 'jotai';
import { loggedInUserAtom } from '../../context/LoggedInUserAtom';

export const useUpdateUser = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useAtom(loggedInUserAtom);
  const queryClient = useQueryClient();

  return useMutation<User, any, UpdateUserVariables>(updateUser, {
    onSuccess: (data: User) => {
      // Update the local state with the new user data
      if (loggedInUser) {
        setLoggedInUser({
          ...loggedInUser,
          username: data.username || loggedInUser.username,
          profilePicture: data.profilePicture || loggedInUser.profilePicture
        });
      }
      
      // Invalidate and refetch user data
      queryClient.invalidateQueries(['user', loggedInUser?.id]);
      
      toast.success('Profile updated successfully!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      navigate('/profile');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });
};
