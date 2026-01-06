'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import Image from 'next/image';
import { MacWindowVideoPlayer } from '@/components/landing/video-showcase';

export function Hero() {
    // Mouse movement effect for the hero image
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;

        mouseX.set(x);
        mouseY.set(y);
    };

    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 });
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 150, damping: 20 });

    return (
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[#FDFCF8]" onMouseMove={handleMouseMove}>

            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px]" />
            </div>

            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 text-secondary-foreground text-sm font-medium mb-6 hover:bg-secondary cursor-pointer transition-colors"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        v2.0 is now live
                        <ArrowRight className="h-3 w-3" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-serif font-medium tracking-tight text-balance mb-6"
                    >
                        Issue <span className="text-primary italic">certificates</span> at <br className="hidden md:block" />
                        the speed of light.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance mb-8"
                    >
                        Design, bulk-generate, and email verified certificates in minutes.
                        The modern standard for digital credentials.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-4"
                    >
                        <Link href="/auth/login">
                            <Button size="lg" className="h-14 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                                Get Started for Free
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base gap-2 hover:bg-muted/50">
                            <Play className="h-4 w-4 fill-current" />
                            Watch Demo
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground"
                    >
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required</span>
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-primary" /> Free 100 certificates</span>
                    </motion.div>
                </div>

                {/* Perspective Mockup */}
                <div className="relative max-w-5xl mx-auto perspective-1000">
                    <motion.div
                        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
                        initial={{ opacity: 0, scale: 0.9, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                        className="relative"
                    >
                        <MacWindowVideoPlayer />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
