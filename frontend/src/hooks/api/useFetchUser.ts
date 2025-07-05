import { useQuery } from 'react-query';
import { getUser } from '../../services/userService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { GetUserResponse } from '../../types/user';

export const useFetchUser = (id: string | undefined) => {
  const navigate = useNavigate();

  return useQuery<GetUserResponse, any>(
    ['getUser', id],
    () => getUser(id || ''),
    {
      enabled: !!id,
      onError: (err: any) => {
        toast.error(
          err.response?.data?.message || 'Failed to fetch user. Redirecting...'
        );

        navigate('/login');
      },
    }
  );
};
