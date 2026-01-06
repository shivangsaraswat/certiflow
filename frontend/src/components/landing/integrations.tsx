'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export function Integrations() {
    return (
        <section className="py-24 bg-muted/20 border-y">
            <div className="container mx-auto px-6 text-center">
                <div className="space-y-4 max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-serif font-medium tracking-tight">
                        Connects with your <br />
                        <span className="text-primary">favorite tools.</span>
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Seamlessly integrate with the apps you use every day.
                        Trigger certificates from forms, spreadsheets, or your own API.
                    </p>
                </div>

                <div className="relative max-w-4xl mx-auto h-[400px] flex items-center justify-center">

                    {/* Central Hub */}
                    <div className="relative z-10 w-24 h-24 bg-background rounded-2xl shadow-xl flex items-center justify-center border-2 border-primary">
                        <div className="font-bold text-xl">CG</div>
                    </div>

                    {/* Orbiting Icons */}
                    {[
                        { name: 'Sheets', angle: 0, color: 'bg-green-500' },
                        { name: 'Zapier', angle: 60, color: 'bg-orange-500' },
                        { name: 'Slack', angle: 120, color: 'bg-purple-500' },
                        { name: 'Gmail', angle: 180, color: 'bg-red-500' },
                        { name: 'Airtable', angle: 240, color: 'bg-yellow-500' },
                        { name: 'Notion', angle: 300, color: 'bg-black' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            style={{ width: '100%', height: '100%' }}
                        >
                            <div
                                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-card rounded-xl shadow-lg border flex items-center justify-center"
                                style={{ transform: `rotate(${item.angle}deg) translateY(-150px) rotate(-${item.angle}deg)` }}
                            >
                                <div className={`w-8 h-8 rounded-full ${item.color} opacity-80`} />
                            </div>
                        </motion.div>
                    ))}

                    {/* Connecting Lines (Visuals) */}
                    <svg className="absolute inset-0 w-full h-full -z-0 opacity-20" viewBox="0 0 896 400">
                        <circle cx="50%" cy="50%" r="150" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                        <circle cx="50%" cy="50%" r="100" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                    </svg>

                </div>
            </div>
        </section>
    );
}
