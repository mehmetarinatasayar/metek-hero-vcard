import { create } from "zustand";
import { authService } from "../services/authService";
import { ApiError, setUnauthorizedHandler } from "../api/client";
import type { User } from "../shared/schema";

export const useAuth = create<{
  user: User | null;
  ready: boolean;
  restoreError: string | null;
  setUser: (u: User) => void;
  restore: () => Promise<void>;
  logout: () => Promise<void>;
}>((set) => ({
  user: null,
  ready: false,
  restoreError: null,
  setUser: (user) => set({ user, ready: true, restoreError: null }),
  restore: async () => {
    set({ ready: false, restoreError: null });
    try {
      set({ user: await authService.restore(), ready: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        await authService.clear();
        set({ user: null, ready: true });
      } else
        set({
          restoreError:
            e instanceof Error ? e.message : "Oturum kontrol edilemedi.",
          ready: true,
        });
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null });
  },
}));
setUnauthorizedHandler(() => {
  void authService.clear();
  useAuth.setState({ user: null });
});
