"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VIDEOS = [
    "https://res.cloudinary.com/certifier/video/upload/v1738145893/DESIGN_xqa4nc.mp4",
    "https://res.cloudinary.com/certifier/video/upload/v1738145892/BULK_bnins2.mp4",
    "https://res.cloudinary.com/certifier/video/upload/v1738145893/SEND_b6q5fw.mp4",
    "https://res.cloudinary.com/certifier/video/upload/v1738145893/SHARE_ha9ujw.mp4",
    "https://res.cloudinary.com/certifier/video/upload/v1738145893/VERIFY_wxvvto.mp4",
    "https://res.cloudinary.com/certifier/video/upload/v1738145892/ANALIZE_zijajy.mp4",
];

export function MacWindowVideoPlayer({ className }: { className?: string }) {
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleVideoEnded = () => {
        setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [currentVideoIndex]);

    return (
        <div className={cn("w-full max-w-5xl mx-auto", className)}>
            <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-gray-50 dark:bg-zinc-900">
                {/* Mac Window Header */}
                <div className="h-8 bg-gray-100 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 space-x-2">
                    <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                        <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                        <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                    </div>
                    <div className="flex-1 text-center">
                        <div className="inline-flex items-center px-3 py-0.5 rounded-md bg-white dark:bg-black/50 border border-black/5 text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 font-sans shadow-sm">
                            certifgen.com/demo
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video bg-black">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        onEnded={handleVideoEnded}
                        className="w-full h-full object-cover"
                    // poster={POSTERS[currentVideoIndex]} // Optional: Add posters if available for smoother loading
                    >
                        <source src={VIDEOS[currentVideoIndex]} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </div>
        </div>
    );
}
