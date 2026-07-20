/* eslint-disable */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

import { z } from "zod";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuthStore } from "@/lib/store/useAuthStore";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { fetchUser } = useAuthStore();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });
      
      // Token is also set via HttpOnly cookie by the backend now!
      const { token, user } = response.data.data;
      
      // Store token in localStorage for Axios interceptor
      localStorage.setItem("token", token);
      
      // Client-side cookie fallback (though backend sets HttpOnly)
      const maxAge = data.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
       
      document.cookie = `token=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
      
      toast.success("Login successful!", {
        description: `Welcome back, ${user.name.split(' ')[0]}!`,
      });
      
      await fetchUser(); // Hydrate the store
      window.location.assign("/dashboard");
     
    } catch (error: any) {
      // Error is also handled by api interceptor which triggers toast
      const message = error.response?.data?.message || "Invalid email or password";
      form.setError("root", {
        type: "manual",
        message: message,
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
          
          {form.formState.errors.root && (
            <motion.div variants={itemVariants} className="p-3 bg-destructive/15 text-destructive font-medium text-sm rounded-md border border-destructive/30 text-center">
              {form.formState.errors.root.message}
            </motion.div>
          )}
          
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="name@example.com" 
                      type="email" 
                      disabled={isLoading} 
                      className="transition-all duration-200 focus-visible:ring-primary focus-visible:ring-offset-2"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link 
                      href="/forgot-password" 
                      className="text-sm text-primary hover:text-primary/80 transition-colors font-medium hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        disabled={isLoading}
                        className="transition-all duration-200 focus-visible:ring-primary focus-visible:ring-offset-2 pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground transition-colors group-hover:text-primary"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      className="data-[state=checked]:bg-primary transition-all duration-200"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer text-sm font-medium hover:text-primary transition-colors">
                      Remember me for 30 days
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit" 
              className="w-full h-12 text-base mt-4 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/40 relative overflow-hidden group" 
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 -translate-x-full group-hover:animate-shimmer" />
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In to Dashboard"
              )}
            </Button>
          </motion.div>
          
        </motion.div>
      </form>
    </Form>
  );
}
