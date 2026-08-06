"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    // The JWT lives in an httpOnly cookie (M29), which JS cannot read. We probe
    // /user/profile instead: the 401 from that probe is silenced by the api
    // interceptor, so public pages don't get redirected or spammed with toasts.
    fetchUser();
  }, [fetchUser]);

  return <>{children}</>;
}
