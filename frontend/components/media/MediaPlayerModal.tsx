"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Lock, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { MediaItem } from "@/lib/mediaData";
import api from "@/lib/api";

interface MediaPlayerModalProps {
  item: MediaItem | null;
  isSubscribed: boolean;
  onClose: () => void;
}

export function MediaPlayerModal({ item, isSubscribed, onClose }: MediaPlayerModalProps) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);

  const isLocked = item ? item.isExclusive && !isSubscribed : false;

  useEffect(() => {
    let isActive = true;
    if (item && !isLocked) {
      if (item.videoUrl) {
        setStreamUrl(item.videoUrl);
        setIsLoadingStream(false);
      } else {
        setIsLoadingStream(true);
        api.get(`/media/stream/${item.id}`)
          .then((res) => {
            if (isActive) {
              setStreamUrl(res.data.data?.videoUrl || null);
            }
          })
          .catch(() => {
            if (isActive) {
              setStreamUrl(null);
            }
          })
          .finally(() => {
            if (isActive) {
              setIsLoadingStream(false);
            }
          });
      }
    } else {
      setStreamUrl(null);
      setIsLoadingStream(false);
    }
    return () => {
      isActive = false;
    };
  }, [item, isLocked]);

  if (!item) return null;

  const getAutoplayUrl = (url: string) => {
    try {
      const parsed = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      parsed.searchParams.set("autoplay", "1");
      return parsed.toString();
    } catch {
      return url.includes("?") ? `${url}&autoplay=1` : `${url}?autoplay=1`;
    }
  };

  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden bg-card border border-border">
        <DialogHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <span>{item.title}</span>
            {item.isExclusive && (
              <Badge className="bg-amber-500 text-black text-[10px]">VIP Content</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative aspect-video bg-black flex items-center justify-center">
          {isLocked ? (
            <div className="p-6 text-center space-y-4 max-w-md bg-black/90 backdrop-blur-md rounded-2xl border border-amber-500/30 m-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                <Lock className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-white">VIP Exclusive Content</h4>
                <p className="text-xs text-white/70">
                  This 4K Remastered Haryanvi Release is exclusively available for active Musica VIP Subscribers.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/invest"
                  onClick={onClose}
                  className={buttonVariants({
                    className: "w-full font-bold bg-amber-500 text-black hover:bg-amber-400",
                  })}
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Subscribe VIP Pass & Unlock
                </Link>
              </div>
            </div>
          ) : isLoadingStream ? (
            <div className="flex items-center gap-2 text-white text-sm">
              <Loader2 className="animate-spin h-6 w-6 text-amber-500" /> Authorizing playback...
            </div>
          ) : streamUrl ? (
            <iframe
              src={getAutoplayUrl(streamUrl)}
              title={item.title}
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="text-muted-foreground text-sm">Playback unavailable</div>
          )}
        </div>

        {/* Video Info Details */}
        <div className="p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">{item.artist}</p>
              <h3 className="font-bold text-lg">{item.title}</h3>
            </div>
            {!isLocked && item.category === "exclusive_audio" && streamUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                className="shrink-0 text-xs"
                onClick={() => {
                  window.open(streamUrl, "_blank");
                }}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download Lossless Audio
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.description}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
