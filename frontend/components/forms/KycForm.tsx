"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2, Camera, X, CheckCircle2, ShieldCheck,
  UserCheck, ScanLine, RotateCcw, AlertTriangle, RefreshCw
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";

type DocField = "aadhaarFront" | "aadhaarBack" | "pan" | "selfie";

export function KycForm() {
  const [isLoading, setIsLoading] = useState(false);

  // File Previews (Object URLs)
  const [previews, setPreviews] = useState<{ [key in DocField]?: string }>({});

  // Camera Scanner Modal State
  const [activeCameraField, setActiveCameraField] = useState<{
    name: DocField;
    label: string;
    facingMode: "environment" | "user";
  } | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backFileInputRefs = useRef<{ [key in DocField]?: HTMLInputElement | null }>({});

  const form = useForm<KycInput>({
    resolver: zodResolver(kycSchema),
    defaultValues: {
      aadhaarNumber: "",
      panNumber: "",
    },
  });

  // Start Camera Stream when Modal opens
  useEffect(() => {
    if (!activeCameraField) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setCameraError(null);
      return;
    }

    async function initCamera() {
      setCameraError(null);
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: activeCameraField?.facingMode || "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err: any) {
        console.error("Camera Access Error:", err);
        setCameraError("Camera access denied or device camera unavailable. Use direct device capture.");
      }
    }

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCameraField]);

  // Capture Live Snapshot from Video Feed
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current || !activeCameraField) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera selfie
    if (activeCameraField.facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob],
          `kyc_${activeCameraField.name}_${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );

        const previewUrl = URL.createObjectURL(blob);
        setPreviews((prev) => ({ ...prev, [activeCameraField.name]: previewUrl }));
        form.setValue(activeCameraField.name, file, { shouldValidate: true });

        // Close Modal
        closeCameraModal();
        toast.success(`${activeCameraField.label} captured successfully!`);
      },
      "image/jpeg",
      0.9
    );
  };

  const closeCameraModal = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setActiveCameraField(null);
  };

  const handleNativeFileSelect = (field: DocField, file: File | undefined) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => ({ ...prev, [field]: url }));
      form.setValue(field, file, { shouldValidate: true });
    }
  };

  const removeCapturedDoc = (field: DocField) => {
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    form.setValue(field, undefined as any, { shouldValidate: true });
  };

  async function onSubmit(data: KycInput) {
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("aadhaar_number", data.aadhaarNumber);
      formData.append("pan_number", data.panNumber);
      formData.append("aadhaar_front", data.aadhaarFront);
      formData.append("aadhaar_back", data.aadhaarBack);
      formData.append("pan_front", data.pan);
      formData.append("selfie", data.selfie);

      await api.post("/user/kyc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("KYC documents & selfie submitted successfully!", {
        description: "Your verification request is under compliance review.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("KYC submission error:", error);
      toast.error(error.response?.data?.message || "Failed to submit KYC documents.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderScanButton = (
    field: DocField,
    label: string,
    facingMode: "environment" | "user"
  ) => {
    const preview = previews[field];

    return (
      <div className="space-y-2">
        <FormLabel className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {label}
        </FormLabel>

        {/* Hidden Fallback Input */}
        <input
          type="file"
          accept="image/*"
          capture={facingMode}
          className="hidden"
          ref={(el) => {
            backFileInputRefs.current[field] = el;
          }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleNativeFileSelect(field, file);
          }}
        />

        {!preview ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-blue-50/50 transition-colors h-44 group">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-full text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <Camera className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {facingMode === "user" ? "Take Live Selfie Photo" : "Scan Document"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 mb-3">
              {facingMode === "user" ? "Use Front Camera for face verification" : "Use Back Camera for live document scan"}
            </p>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-8 px-3 shadow-xs"
                onClick={() => setActiveCameraField({ name: field, label, facingMode })}
                disabled={isLoading}
              >
                <ScanLine className="h-3.5 w-3.5 mr-1.5" />
                Live Camera Scan
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs font-semibold rounded-lg h-8 px-3 border-slate-200 dark:border-slate-800"
                onClick={() => backFileInputRefs.current[field]?.click()}
                disabled={isLoading}
              >
                Upload File
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-44 bg-slate-900 group shadow-xs">
            <Image
              src={preview}
              alt={label}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="text-xs font-bold rounded-lg h-8"
                onClick={() => removeCapturedDoc(field)}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Retake / Remove
              </Button>
            </div>
            <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shadow-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Captured
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Hidden Canvas for Camera Snapshots */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Live Camera Scanner Modal */}
      <Dialog open={Boolean(activeCameraField)} onOpenChange={(open) => !open && closeCameraModal()}>
        <DialogContent className="sm:max-w-[480px] p-4 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-950 text-white">
          <DialogHeader className="pb-2 border-b border-slate-800">
            <DialogTitle className="text-sm font-bold flex items-center text-white">
              <Camera className="h-4 w-4 mr-2 text-blue-400" />
              {activeCameraField?.facingMode === "user" ? "Live Selfie Face Scan" : `Scan ${activeCameraField?.label}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {activeCameraField?.facingMode === "user"
                ? "Position your face clearly inside the frame and click Capture Selfie."
                : "Hold your document flat and clear inside the camera viewfinder."}
            </DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-black flex items-center justify-center my-2 border border-slate-800">
            {cameraError ? (
              <div className="p-4 text-center space-y-3">
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                <Button
                  type="button"
                  size="sm"
                  className="bg-blue-600 text-white font-bold text-xs rounded-lg"
                  onClick={() => activeCameraField && backFileInputRefs.current[activeCameraField.name]?.click()}
                >
                  Choose From Gallery / File
                </Button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${activeCameraField?.facingMode === "user" ? "scale-x-[-1]" : ""}`}
                />

                {/* Viewfinder Target Frame Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-blue-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="text-[10px] font-bold text-blue-300 bg-slate-950/80 px-3 py-1 rounded-full border border-blue-400/40">
                    {activeCameraField?.facingMode === "user" ? "Align Face Center" : "Align Document Borders"}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs font-bold border-slate-800 text-slate-300 hover:bg-slate-900 rounded-lg"
              onClick={closeCameraModal}
            >
              Cancel
            </Button>

            {!cameraError && (
              <Button
                type="button"
                size="sm"
                className="text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 shadow-sm"
                onClick={captureSnapshot}
              >
                <Camera className="h-4 w-4 mr-1.5" />
                Capture Snapshot
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Step 1: Aadhaar Verification (Back Camera Document Scan) */}
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-mono">1</span>
                Aadhaar Document Scan
              </h3>
            </div>
            <CardContent className="p-5 space-y-5">
              <FormField
                control={form.control}
                name="aadhaarNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">12-Digit Aadhaar Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234 5678 9012"
                        maxLength={12}
                        className="text-xs h-10 rounded-lg font-mono border-slate-200 dark:border-slate-800"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderScanButton("aadhaarFront", "Aadhaar Front Side", "environment")}
                {renderScanButton("aadhaarBack", "Aadhaar Back Side", "environment")}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: PAN Card Verification (Back Camera Document Scan) */}
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-mono">2</span>
                PAN Card Scan
              </h3>
            </div>
            <CardContent className="p-5 space-y-5">
              <FormField
                control={form.control}
                name="panNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold">10-Character PAN Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABCDE1234F"
                        className="uppercase text-xs h-10 rounded-lg font-mono border-slate-200 dark:border-slate-800"
                        maxLength={10}
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage className="text-[11px]" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderScanButton("pan", "PAN Card Front", "environment")}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Live Selfie Face Scan (Front Camera) */}
          <Card className="border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden bg-white dark:bg-slate-900">
            <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center">
                <span className="bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs mr-2 font-mono">3</span>
                Live Selfie Face Scan
              </h3>
            </div>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderScanButton("selfie", "Live Selfie Face Verification", "user")}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto min-w-[220px] bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs h-11 shadow-sm transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading &amp; Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Submit KYC Verification
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
