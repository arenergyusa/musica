"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, User, Phone } from "lucide-react";

import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/useAuthStore";

interface ProfileFormProps {
  initialData?: {
    name: string;
    phone: string;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuthStore();

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: initialData?.name || "",
      phone: initialData?.phone || "",
    },
  });

  async function onSubmit(data: UpdateProfileInput) {
    setIsLoading(true);
    try {
      await api.put("/user/profile", {
        name: data.name,
        phone: data.phone,
      });
      
      toast.success("Profile updated successfully!");
      await fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Full Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <Input 
                    placeholder="Enter full legal name" 
                    disabled={isLoading} 
                    className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">Mobile Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input 
                    placeholder="10-digit mobile number" 
                    type="tel"
                    maxLength={10}
                    disabled={isLoading} 
                    className="pl-9 h-10 text-xs rounded-lg border-slate-200 dark:border-slate-800 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all"
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage className="text-[11px]" />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isDirty}
            className="h-10 text-xs font-bold px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
