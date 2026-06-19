import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { apiError } from '@/lib/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [ids, setIds] = useState(new Set());

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'customer') return setIds(new Set());
    try {
      const { data } = await api.get('/wishlist/ids');
      setIds(new Set(data.data.ids));
    } catch {
      /* noop */
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (vehicleId) => {
      if (!user) return toast.error('Please sign in to save favorites');
      if (user.role !== 'customer') return toast.error('Only customers can save favorites');
      // optimistic
      setIds((prev) => {
        const next = new Set(prev);
        next.has(vehicleId) ? next.delete(vehicleId) : next.add(vehicleId);
        return next;
      });
      try {
        const { data } = await api.post(`/wishlist/${vehicleId}`);
        toast.success(data.message);
      } catch (err) {
        toast.error(apiError(err));
        refresh();
      }
    },
    [user, refresh],
  );

  const isSaved = useCallback((id) => ids.has(id), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, isSaved, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
