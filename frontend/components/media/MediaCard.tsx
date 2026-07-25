"use client";

import { Play, Lock, Sparkles, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MediaItem } from "@/lib/mediaData";

interface MediaCardProps {
  item: MediaItem;
  isSubscribed: boolean;
  onPlay: (item: MediaItem) => void;
}

export function MediaCard({ item, isSubscribed, onPlay }: MediaCardProps) {
  const isLocked = item.isExclusive && !isSubscribed;

  return (
    <Card 
      role="button"
      tabIndex={0}
      className="group cursor-pointer overflow-hidden border border-border/50 bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
      onClick={() => onPlay(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPlay(item);
        }
      }}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/* Image Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={item.thumbnail} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Play / Lock Icon Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`p-3.5 rounded-full transition-transform duration-300 group-hover:scale-110 shadow-lg ${
            isLocked ? "bg-amber-500 text-black" : "bg-primary text-primary-foreground"
          }`}>
            {isLocked ? <Lock className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.isExclusive && (
            <Badge className="bg-amber-500 text-black font-bold text-[10px] px-2 py-0.5 border-none shadow">
              <Sparkles className="h-3 w-3 mr-1 fill-current" /> VIP Exclusive
            </Badge>
          )}
        </div>

        {/* Bottom Bar Info */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-white/80 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {item.duration}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> {item.views}
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-1">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {item.artist}
        </p>
      </CardContent>
    </Card>
  );
}
