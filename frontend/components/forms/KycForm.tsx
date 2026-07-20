/* eslint-disable */
"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload, X, FileText, CheckCircle2 } from "lucide-react";
import Image from "next/image";

import { kycSchema, type KycInput } from "@/lib/validators";
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
import { Card, CardContent } from "@/components/ui/card";

const FileUploadField = ({ 
  name, 
  label, 
  preview, 
  setPreview,
  control,
  isLoading,
  handleImageChange
}: { 
  name: "aadhaarFront" | "aadhaarBack" | "pan", 
  label: string,
  preview: string | null,
  setPreview: (url: string | null) => void,
  control: any,
  isLoading: boolean,
  handleImageChange: (file: File | undefined, setPreview: (url: string | null) => void) => void
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, value, ...rest } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="mt-2">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                ref={fileInputRef}
                disabled={isLoading}
                name={rest.name}
                onBlur={rest.onBlur}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  onChange(file);
                  handleImageChange(file, setPreview);
                }}
              />
              
              {!preview ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors h-40"
                >
                  <div className="bg-primary/10 p-3 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Click to upload document</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF (Max 5MB)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border h-40 bg-muted/30 group">
                  {preview === "pdf" ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <FileText className="h-10 w-10 text-primary mb-2" />
                      <span className="text-sm font-medium">PDF Document Selected</span>
                      <span className="text-xs text-muted-foreground mt-1 flex items-center">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" /> Ready to upload
                      </span>
                    </div>
                  ) : (
                    <Image 
                      src={preview} 
                      alt="Document preview" 
                      fill 
                      className="object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        onChange(undefined);
                        setPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export function KycForm() {
  const [isLoading, setIsLoading] = useState(false);
  
  // States for image previews
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);
  const [panPreview, setPanPreview] = useState<string | null>(null);

  const form = useForm<KycInput>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      aadhaarNumber: "",
      panNumber: "",
    },
  });

  const handleImageChange = (
    file: File | undefined, 
    setPreview: (url: string | null) => void
  ) => {
    if (file) {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreview(url);
      } else {
        // For PDF or other files
        setPreview("pdf");
      }
    } else {
      setPreview(null);
    }
  };

  async function onSubmit(data: KycInput) {
    setIsLoading(true);
    
    try {
      // Simulate API call for file upload and KYC submission
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      console.log("KYC Submission data:", {
        aadhaarNumber: data.aadhaarNumber,
        panNumber: data.panNumber,
        aadhaarFront: data.aadhaarFront.name,
        aadhaarBack: data.aadhaarBack.name,
        pan: data.pan.name
      });
      
      toast.success("KYC documents submitted successfully!", {
        description: "Your documents are now under review. This usually takes 24-48 hours.",
      });
      
      // In a real app, we might redirect or update UI state here
      // router.push("/dashboard");
      window.location.reload(); 
    } catch (error) {
      toast.error("Failed to submit KYC. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Aadhaar Section */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-lg flex items-center">
              <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
              Aadhaar Verification
            </h3>
            <p className="text-sm text-muted-foreground mt-1 ml-8">Provide your 12-digit Aadhaar number and upload both sides.</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="aadhaarNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aadhaar Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. 123456789012" 
                      maxLength={12}
                      disabled={isLoading} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploadField 
                name="aadhaarFront" 
                label="Aadhaar Front Image" 
                preview={aadhaarFrontPreview} 
                setPreview={setAadhaarFrontPreview} 
                control={form.control}
                isLoading={isLoading}
                handleImageChange={handleImageChange}
              />
              <FileUploadField 
                name="aadhaarBack" 
                label="Aadhaar Back Image" 
                preview={aadhaarBackPreview} 
                setPreview={setAadhaarBackPreview} 
                control={form.control}
                isLoading={isLoading}
                handleImageChange={handleImageChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* PAN Section */}
        <Card className="border-border/40 shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-6 py-4 border-b border-border/40">
            <h3 className="font-semibold text-lg flex items-center">
              <span className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
              PAN Verification
            </h3>
            <p className="text-sm text-muted-foreground mt-1 ml-8">Provide your 10-character PAN number and upload the front side.</p>
          </div>
          <CardContent className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PAN Number</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. ABCDE1234F" 
                      className="uppercase"
                      maxLength={10}
                      disabled={isLoading} 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploadField 
                name="pan" 
                label="PAN Card Image" 
                preview={panPreview} 
                setPreview={setPanPreview} 
                control={form.control}
                isLoading={isLoading}
                handleImageChange={handleImageChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="w-full sm:w-auto min-w-[200px]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting Documents...
              </>
            ) : (
              "Submit KYC for Review"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
