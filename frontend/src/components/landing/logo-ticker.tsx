'use client';

import { motion } from 'framer-motion';

const logos = [
    { name: 'Acme Corp', initial: 'AC' },
    { name: 'Global Bank', initial: 'GB' },
    { name: 'TechStart', initial: 'TS' },
    { name: 'EduLearn', initial: 'EL' },
    { name: 'HealthPlus', initial: 'HP' },
    { name: 'NextGen', initial: 'NG' },
    { name: 'FutureWorks', initial: 'FW' },
    { name: 'Innovate', initial: 'IN' },
];

export function LogoTicker() {
    return (
        <section className="py-12 border-y bg-muted/20 overflow-hidden">
            <div className="container mx-auto px-6 mb-8 text-center">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                    Trusted by forward-thinking teams
                </p>
            </div>

            <div className="flex overflow-hidden relative after:absolute after:left-0 after:top-0 after:w-32 after:h-full after:bg-gradient-to-r after:from-background after:to-transparent after:z-10 before:absolute before:right-0 before:top-0 before:w-32 before:h-full before:bg-gradient-to-l before:from-background before:to-transparent before:z-10">
                <motion.div
                    className="flex gap-16 items-center flex-nowrap min-w-full px-8"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30,
                    }}
                >
                    {[...logos, ...logos, ...logos].map((logo, idx) => (
                        <div key={idx} className="flex items-center gap-2 group cursor-default opacity-40 hover:opacity-100 transition-opacity duration-300 filter grayscale hover:grayscale-0">
                            {/* Placeholder Logo Graphic */}
                            <div className="h-8 w-8 bg-foreground/10 rounded flex items-center justify-center font-bold text-xs text-foreground/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                {logo.initial}
                            </div>
                            <span className="font-semibold text-lg">{logo.name}</span>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
