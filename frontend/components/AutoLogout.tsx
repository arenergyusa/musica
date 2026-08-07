"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function AutoLogout() {
  const { logout, isAuthenticated } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  // Mirror showWarning into a ref so the timer callbacks never close over a
  // stale value (L12): without this, "Stay Logged In" left the timer
  // permanently disarmed because resetTimer saw the pre-setShowWarning value.
  const showWarningRef = useRef(showWarning);
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

  const resetTimer = useCallback(() => {
    if (showWarningRef.current) return; // Don't reset if warning is showing

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(60);
    }, INACTIVITY_LIMIT);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, resetTimer]);

  useEffect(() => {
    if (showWarning) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [showWarning]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    // logout() awaits the server-side cookie clear + blacklist before the full
    // navigation, then redirects to /login?session_expired=true (the HttpOnly
    // token cookie cannot be cleared from JS, so the server call must land
    // first or middleware bounces the user straight back to the dashboard).
    logout("/login?session_expired=true");
  }, [logout]);

  useEffect(() => {
    if (showWarning && countdown === 0) {
      handleLogout();
    }
  }, [showWarning, countdown, handleLogout]);

  const handleStayLoggedIn = () => {
    // Flip the ref synchronously BEFORE resetTimer runs. The effect that syncs
    // the ref only runs after the next render, so a bare setShowWarning(false)
    // leaves resetTimer reading the stale "warning showing" value and it early-
    // returns without re-arming the inactivity timer — the user would then
    // never be auto-logged-out again.
    showWarningRef.current = false;
    setShowWarning(false);
    resetTimer();
  };

  const handleOpenChange = (open: boolean) => {
    setShowWarning(open);
    // Dismissing the dialog (Escape / backdrop / X) must also re-arm the
    // inactivity timer, otherwise auto-logout is permanently disarmed.
    if (!open) {
      showWarningRef.current = false;
      if (isAuthenticated) resetTimer();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="border-warning/50 bg-card/95 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-warning flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-warning"></span>
            </span>
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground/80">
            For your security, your session will automatically expire in{" "}
            <strong className="text-foreground text-lg">{countdown}</strong> seconds due to inactivity. 
            Do you want to stay logged in?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={handleLogout}
            className="bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          >
            Logout Now
          </AlertDialogAction>
          <AlertDialogAction onClick={handleStayLoggedIn}>
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
