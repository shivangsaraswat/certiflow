'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function TemplatesGallery() {
    return (
        <section className="py-24 bg-foreground text-background overflow-hidden">
            <div className="container mx-auto px-6 mb-12 flex items-end justify-between">
                <div className="space-y-4 max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight">
                        Start with a <br />
                        <span className="text-muted-foreground">world-class template.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Don't start from scratch. Choose from our library of professionally designed templates.
                    </p>
                </div>
                <Button variant="outline" className="hidden md:flex border-white/20 hover:bg-white hover:text-black">
                    View all templates <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="relative w-full">
                <div className="flex gap-6 overflow-x-auto pb-8 px-6 no-scrollbar snap-x snap-mandatory">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            className="min-w-[300px] md:min-w-[400px] aspect-[1.414] bg-zinc-800 rounded-xl overflow-hidden relative group cursor-pointer snap-center border border-white/10"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Mock Template Content */}
                            <div className="absolute inset-4 border border-white/10 flex flex-col items-center justify-center text-center p-4">
                                <div className="text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2">Certificate of Completion</div>
                                <div className="text-xl font-serif text-white mb-4">Awarded to Holder</div>
                                <div className="w-16 h-[1px] bg-white/30 my-2" />
                                <div className="text-[8px] text-white/40 max-w-[150px]">
                                    For successfully completing the Advanced Certification Program
                                </div>
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button className="bg-white text-black hover:bg-white/90">Use Template</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 mt-8 md:hidden">
                <Button variant="outline" className="w-full border-white/20 hover:bg-white hover:text-black">
                    View all templates
                </Button>
            </div>
        </section>
    );
}
