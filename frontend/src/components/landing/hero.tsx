'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Play } from 'lucide-react';
import Image from 'next/image';

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
                        className="relative rounded-xl bg-card border shadow-2xl overflow-hidden aspect-[16/9] group"
                    >
                        {/* Placeholder for actual product screenshot using CSS/HTML structure if no image available */}
                        <div className="absolute inset-0 bg-background flex flex-col">
                            {/* Fake Browser Top Bar */}
                            <div className="h-10 border-b bg-muted/30 flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                                </div>
                                <div className="mx-auto w-[40%] h-6 bg-background rounded-md border flex items-center justify-center text-[10px] text-muted-foreground">
                                    certifgen.com/editor
                                </div>
                            </div>

                            {/* Mock UI Body */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Sidebar */}
                                <div className="w-64 border-r bg-muted/10 p-4 space-y-4 hidden md:block">
                                    <div className="h-8 w-32 bg-primary/10 rounded animate-pulse" />
                                    <div className="space-y-2 pt-4">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-10 w-full bg-muted/50 rounded-lg" />
                                        ))}
                                    </div>
                                </div>

                                {/* Canvas Area */}
                                <div className="flex-1 bg-muted/5 p-8 flex items-center justify-center relative">
                                    {/* Certificate mock */}
                                    <div className="bg-white text-black aspect-[1.414] h-[80%] shadow-xl rounded-sm p-8 relative">
                                        <div className="absolute top-8 left-8 h-12 w-12 bg-gray-900 rounded-full" />
                                        <div className="absolute top-8 right-8 h-24 w-24 bg-gray-100" />

                                        <div className="text-center mt-12 space-y-4">
                                            <div className="h-4 w-32 bg-gray-200 mx-auto rounded" />
                                            <div className="h-12 w-3/4 bg-gray-900 mx-auto rounded opacity-80" />
                                            <div className="h-4 w-64 bg-gray-200 mx-auto rounded" />
                                        </div>

                                        <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end">
                                            <div className="h-16 w-32 bg-gray-100 rounded" />
                                            <div className="h-20 w-20 bg-gray-900/10 rounded-full" />
                                        </div>
                                    </div>

                                    {/* Floating specific elements */}
                                    <motion.div
                                        className="absolute top-1/4 right-10 bg-card p-3 rounded-lg shadow-lg border z-10"
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                                <CheckCircle2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold">Verified</div>
                                                <div className="text-[10px] text-muted-foreground">Blockchain secured</div>
                                            </div>
                                        </div>
                                    </motion.div>

                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
