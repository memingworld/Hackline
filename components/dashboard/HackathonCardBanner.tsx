"use client";

import * as React from "react";

interface HackathonCardBannerProps {
  bannerUrl: string;
  title: string;
}

export function HackathonCardBanner({ bannerUrl, title }: HackathonCardBannerProps) {
  const [hasError, setHasError] = React.useState(false);

  if (hasError || !bannerUrl) return null;

  return (
    <div className="relative w-full h-24 sm:h-28 bg-[#100d0a] overflow-hidden border-b border-[rgba(229,169,60,0.15)] shrink-0">
      <img
        src={bannerUrl}
        alt={title}
        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        onError={() => setHasError(true)}
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16] via-transparent to-black/30 pointer-events-none" />
    </div>
  );
}
