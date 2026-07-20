"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token && !isAuthenticated) {
      fetchUser();
    } else if (!token && isLoading) {
      // If there's no token, we are not loading the user anymore
      useAuthStore.setState({ isLoading: false });
    }
  }, [fetchUser, isAuthenticated, isLoading]);

  return <>{children}</>;
}
