'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const testimonials = [
    {
        name: "Sarah Chen",
        role: "Event Director @ TechConf",
        content: "We generated 5,000 certificates in under 10 minutes. The email open rates were incredible thanks to the customization.",
        initial: "SC"
    },
    {
        name: "Marcus Rho",
        role: "Head of L&D, FinCorps",
        content: "The editor is actually fun to use. It feels like Figma but for certificates. My team loves it.",
        initial: "MR"
    },
    {
        name: "Elena Rodriguez",
        role: "Program Manager, EduSmart",
        content: "Security was our #1 concern. CertiFlow's blockchain verification gave us the peace of mind we needed.",
        initial: "ER"
    },
    {
        name: "David Kim",
        role: "Community Lead",
        content: "Simply the best tool for hackathon certificates. No more manual merging in Word.",
        initial: "DK"
    },
    {
        name: "Priya Patel",
        role: "HR Director",
        content: "Automating our employee recognition program has saved us hours every month.",
        initial: "PP"
    },
    {
        name: "Tom W.",
        role: "Course Creator",
        content: "The seamless integration with my course platform made issuance automatic.",
        initial: "TW"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 md:py-32">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight mb-4">
                        Loved by thousands of <br />
                        <span className="text-primary">event organizers.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Join the community of creators who trust CertiFlow.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-muted/10 p-8 rounded-2xl border hover:border-primary/20 transition-colors"
                        >
                            <Quote className="h-8 w-8 text-primary/20 mb-4" />
                            <p className="text-lg mb-6 leading-relaxed">"{t.content}"</p>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {t.initial}
                                </div>
                                <div>
                                    <div className="font-semibold">{t.name}</div>
                                    <div className="text-sm text-muted-foreground">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
