'use client';

import { useRef } from 'react';
import Link from 'next/link';
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
                <Link href="/auth/login">
                    <Button variant="outline" className="hidden md:flex border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors">
                        View all templates <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="relative w-full">
                <div className="flex gap-6 overflow-x-auto pb-8 px-6 no-scrollbar snap-x snap-mandatory">
                    {[
                        "/cert/large_112_CPR_professional_blue_landscape_cc4f3a26b0.webp",
                        "/cert/large_55_participation_modern_pink_landscape_2e80d516ad.webp",
                        "/cert/large_Consistent_Professional_OSHA_30_Certificate_Template_Edit_Online_for_Free_Landscape_e01fdbae13.webp",
                        "/cert/large_Detailed_EMT_Certificate_Template_Landscape_46438e56e9.webp",
                        "/cert/large_Free_Classic_Stock_Certificate_Template_Edit_Online_with_Certifier_Landscape_cee42f0807.webp",
                        "/cert/large_Professional_Fire_Safety_Training_Certificate_Template_Edit_Online_with_Certifier_Landscape_2d8c84959f.webp"
                    ].map((src, i) => (
                        <motion.div
                            key={i}
                            className="min-w-[300px] md:min-w-[400px] aspect-[1.414] bg-zinc-800 rounded-xl overflow-hidden relative group cursor-pointer snap-center border border-white/10"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        >
                            <img
                                src={src}
                                alt={`Certificate Template ${i + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button className="bg-white text-black hover:bg-white/90">Use Template</Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 mt-8 md:hidden">
                <Link href="/auth/login">
                    <Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors">
                        View all templates
                    </Button>
                </Link>
            </div>
        </section>
    );
}
