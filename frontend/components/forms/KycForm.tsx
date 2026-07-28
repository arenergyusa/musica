"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Circle, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type DocField = "aadhaarFront" | "aadhaarBack" | "pan" | "selfieFront" | "selfieLeft" | "selfieRight" | "selfieUp";
type Capture = { name: DocField; label: string; instruction: string; facingMode: "environment" | "user" };

const fields: Capture[] = [
  { name: "aadhaarFront", label: "Aadhaar Front", instruction: "Keep Aadhaar front flat and fully inside the frame.", facingMode: "environment" },
  { name: "aadhaarBack", label: "Aadhaar Back", instruction: "Turn Aadhaar over and keep it fully inside the frame.", facingMode: "environment" },
  { name: "pan", label: "PAN Card", instruction: "Keep PAN card flat, clear, and fully inside the frame.", facingMode: "environment" },
  { name: "selfieFront", label: "Face Front", instruction: "Look straight at the camera.", facingMode: "user" },
  { name: "selfieLeft", label: "Face Left", instruction: "Slowly turn your face to the left.", facingMode: "user" },
  { name: "selfieRight", label: "Face Right", instruction: "Slowly turn your face to the right.", facingMode: "user" },
  { name: "selfieUp", label: "Face Up", instruction: "Raise your face slightly upwards.", facingMode: "user" },
];

export function KycForm() {
  const [captures, setCaptures] = useState<Partial<Record<DocField, File>>>({});
  const [sequence, setSequence] = useState<Capture[]>(fields);
  const [activeCapture, setActiveCapture] = useState<Capture | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [qualityReady, setQualityReady] = useState(false);
  const [qualityMessage, setQualityMessage] = useState("Checking camera quality…");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const closeCamera = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setActiveCapture(null);
    setCameraError("");
    setCountdown(null);
    setQualityReady(false);
  };

  useEffect(() => {
    if (!activeCapture) return;
    let localStream: MediaStream | null = null;
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: activeCapture.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    }).then((nextStream) => {
      localStream = nextStream;
      setStream(nextStream);
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    }).catch(() => setCameraError("Camera permission is required. File or gallery uploads are not accepted for KYC."));
    return () => localStream?.getTracks().forEach((track) => track.stop());
  }, [activeCapture]);

  useEffect(() => {
    if (!stream || !activeCapture || !videoRef.current || !canvasRef.current) return;
    const checkQuality = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;
      canvas.width = 160;
      canvas.height = 120;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let brightness = 0;
      let sharpness = 0;
      let samples = 0;
      for (let y = 1; y < 119; y += 4) for (let x = 1; x < 159; x += 4) {
        const index = (y * 160 + x) * 4;
        const luminance = (pixels[index] * 0.299) + (pixels[index + 1] * 0.587) + (pixels[index + 2] * 0.114);
        const previous = (pixels[index - 4] * 0.299) + (pixels[index - 3] * 0.587) + (pixels[index - 2] * 0.114);
        brightness += luminance;
        sharpness += Math.abs(luminance - previous);
        samples++;
      }
      const averageBrightness = brightness / samples;
      const averageSharpness = sharpness / samples;
      if (averageBrightness < 55) { setQualityReady(false); setQualityMessage("More light needed"); }
      else if (averageBrightness > 215) { setQualityReady(false); setQualityMessage("Reduce glare / bright light"); }
      else if (averageSharpness < 4) { setQualityReady(false); setQualityMessage("Hold camera steady and keep the full card in frame"); }
      else { setQualityReady(true); setQualityMessage("Frame looks clear — auto-capture ready"); }
    };
    const interval = window.setInterval(checkQuality, 400);
    checkQuality();
    return () => window.clearInterval(interval);
  }, [stream, activeCapture]);

  useEffect(() => {
    if (!stream || !activeCapture || !qualityReady) { setCountdown(null); return; }
    setCountdown(3);
    const interval = window.setInterval(() => setCountdown((value) => value && value > 1 ? value - 1 : value), 1000);
    const timer = window.setTimeout(() => capturePhoto(), 3000);
    return () => { window.clearInterval(interval); window.clearTimeout(timer); };
  // The timer deliberately begins only after frame-quality checks pass.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, activeCapture, qualityReady]);

  const capturePhoto = () => {
    if (!activeCapture || !videoRef.current || !canvasRef.current || !qualityReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (activeCapture.facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob || !activeCapture) return;
      const file = new File([blob], `${activeCapture.name}-${Date.now()}.jpg`, { type: "image/jpeg" });
      try {
        const checkData = new FormData();
        const checkField = { aadhaarFront: "aadhaar_front", aadhaarBack: "aadhaar_back", pan: "pan_front", selfieFront: "selfie_front", selfieLeft: "selfie_left", selfieRight: "selfie_right", selfieUp: "selfie_up" }[activeCapture.name];
        checkData.append("field", checkField);
        checkData.append("scan", file);
        await api.post("/user/kyc/check", checkData);
      } catch {
        setQualityReady(false);
        setQualityMessage("Keep the required item/face clearly inside the frame");
        return;
      }
      setCaptures((current) => ({ ...current, [activeCapture.name]: file }));
      const currentIndex = sequence.findIndex((field) => field.name === activeCapture.name);
      const next = sequence[currentIndex + 1];
      if (next) {
        setActiveCapture(next);
      } else {
        closeCamera();
        toast.success("All scans captured. You can retake any step before verification.");
      }
    }, "image/jpeg", 0.92);
  };

  const startGuidedCapture = () => {
    const nextSequence = [...fields.slice(0, 3), ...fields.slice(3).sort(() => Math.random() - 0.5)];
    setSequence(nextSequence);
    setActiveCapture(nextSequence.find((field) => !captures[field.name]) || nextSequence[0]);
  };

  const submit = async () => {
    if (sequence.some(({ name }) => !captures[name])) {
      toast.error("Capture all documents and the Front, Left, Right, and Up selfie sequence first.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("aadhaar_front", captures.aadhaarFront!);
      formData.append("aadhaar_back", captures.aadhaarBack!);
      formData.append("pan_front", captures.pan!);
      formData.append("selfie_front", captures.selfieFront!);
      formData.append("selfie_left", captures.selfieLeft!);
      formData.append("selfie_right", captures.selfieRight!);
      formData.append("selfie_up", captures.selfieUp!);
      await api.post("/user/kyc", formData);
      toast.success("KYC verified and approved.", { description: "Aadhaar and PAN names matched and the live selfie check passed." });
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "KYC verification failed. Retake clear camera scans and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Dialog open={Boolean(activeCapture)} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-[480px] border-slate-800 bg-slate-950 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm"><Camera className="h-4 w-4 text-blue-400" />Step {sequence.findIndex((field) => field.name === activeCapture?.name) + 1} of {sequence.length}: {activeCapture?.label}</DialogTitle>
            <DialogDescription className="text-slate-400">{activeCapture?.instruction}</DialogDescription>
          </DialogHeader>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-black">
            {cameraError ? <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-xs text-slate-300"><AlertTriangle className="h-7 w-7 text-amber-400" />{cameraError}</div> : <><video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${activeCapture?.facingMode === "user" ? "scale-x-[-1]" : ""}`} /><div className={`pointer-events-none absolute border-2 border-dashed border-blue-400/80 ${activeCapture?.facingMode === "user" ? "inset-x-1/4 inset-y-6 rounded-full" : "inset-5 rounded-xl"}`} /><span className={`absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold ${qualityReady ? "bg-emerald-600/90" : "bg-amber-600/90"}`}>{qualityReady ? `Auto-capturing in ${countdown ?? 3}s` : qualityMessage}</span></>}
          </div>
          <div className="flex justify-between"><Button type="button" variant="outline" onClick={closeCamera}>Cancel</Button>{!cameraError && <Button type="button" onClick={capturePhoto} disabled={!qualityReady}><Camera className="mr-2 h-4 w-4" />Capture now</Button>}</div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-slate-200 dark:border-slate-800"><CardContent className="p-6">
          <div className="mb-6 flex items-start gap-3"><div className="rounded-full bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-bold">Secure identity verification</p><p className="mt-1 text-xs text-muted-foreground">Camera scans only. Your ID values are read automatically and cannot be edited.</p></div></div>
          <div className="space-y-3">{sequence.map((field, index) => { const complete = Boolean(captures[field.name]); return <div key={field.name} className={`flex items-center gap-3 rounded-lg border p-3 ${complete ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-border"}`}><div className="shrink-0">{complete ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0"><p className="text-xs font-bold">{index + 1}. {field.label}</p><p className="truncate text-[11px] text-muted-foreground">{complete ? "Captured and locked" : field.instruction}</p></div></div>; })}</div>
          {!activeCapture && sequence.some(({ name }) => !captures[name]) && <Button type="button" className="mt-6 w-full" onClick={startGuidedCapture} disabled={isSubmitting}><Camera className="mr-2 h-4 w-4" />Continue secure verification</Button>}
        </CardContent></Card>
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800"><CardContent className="p-6">
          <p className="text-sm font-bold">Private capture mode</p><p className="mt-1 text-xs text-muted-foreground">Clear frames are captured automatically once and then securely locked.</p>
          <div className="mt-5 rounded-xl border border-dashed p-6 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-emerald-600" /><p className="text-sm font-semibold">No on-screen document preview</p><p className="mt-1 text-xs text-muted-foreground">Your captured images stay private and are verified securely on the server.</p></div>
          <Button type="button" className="mt-6 w-full" onClick={submit} disabled={isSubmitting || sequence.some(({ name }) => !captures[name])}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying identity…</> : "Verify identity automatically"}</Button>
        </CardContent></Card>
      </div>
    </>
  );
}
