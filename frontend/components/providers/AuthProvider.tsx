"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { fetchUser, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetchUser();
    } else {
      // If there's no token, we are not loading the user anymore
      useAuthStore.setState({ isLoading: false });
    }
  }, [fetchUser]); // Run only once on mount (fetchUser is stable)

  return <>{children}</>;
}
