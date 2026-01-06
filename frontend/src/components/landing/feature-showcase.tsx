'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Wand2, Database, Send, BarChart, Shield, Layout, Zap, Users } from 'lucide-react';
import Image from 'next/image';

export function FeatureShowcase() {
    return (
        <section className="py-24 md:py-32 overflow-hidden">
            <div className="container mx-auto px-6 space-y-32">

                {/* Feature 1: Visual Editor */}
                <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-6">
                            <Wand2 className="h-4 w-4" />
                            <span>No-Code Builder</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-6">
                            Design certificates <br />
                            <span className="text-muted-foreground">without a designer.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 text-balance">
                            Our drag-and-drop editor gives you pixel-perfect control.
                            Use dynamic variables like <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{`{{name}}`}</code>
                            or <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">{`{{date}}`}</code>
                            to personalize every certificate instantly.
                        </p>
                        <ul className="space-y-4 mb-8">
                            {[
                                "Start from pro templates or a blank canvas",
                                "Upload your own fonts and brand assets",
                                "Smart alignment and grid snapping"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                        <ArrowRight className="h-3 w-3" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                        <Button size="lg" className="rounded-full">
                            Open Editor <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="aspect-square md:aspect-[4/3] bg-muted rounded-2xl border shadow-xl overflow-hidden relative group">
                            {/* Abstract Editor UI representation */}
                            <div className="absolute inset-0 bg-gradient-to-br from-card to-muted p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-8 border-b pb-4">
                                    <div className="flex gap-2">
                                        <div className="h-8 w-8 rounded bg-muted-foreground/20" />
                                        <div className="h-8 w-8 rounded bg-muted-foreground/20" />
                                    </div>
                                    <div className="h-8 w-24 rounded bg-primary/20" />
                                </div>
                                <div className="flex-1 bg-white rounded shadow-sm relative flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                                    <div className="text-center space-y-2 opacity-50">
                                        <Layout className="h-12 w-12 mx-auto text-muted-foreground" />
                                        <p>Drag elements here</p>
                                    </div>

                                    {/* Floaters */}
                                    <motion.div
                                        className="absolute top-1/4 left-1/4 bg-blue-600 text-white text-xs px-2 py-1 rounded shadow-lg"
                                        animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                                        transition={{ duration: 5, repeat: Infinity }}
                                    >
                                        Heading
                                    </motion.div>
                                    <motion.div
                                        className="absolute bottom-1/3 right-1/4 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg"
                                        animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                                    >
                                        Date
                                    </motion.div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feature 2: Bulk Generation */}
                <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
                    <motion.div
                        className="order-2 md:order-1 relative"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="aspect-[4/3] bg-zinc-900 rounded-2xl border shadow-2xl overflow-hidden p-6 md:p-12 flex flex-col justify-center">
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((row, i) => (
                                    <motion.div
                                        key={row}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/10"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-2 w-1/3 bg-white/20 rounded" />
                                            <div className="h-2 w-2/3 bg-white/10 rounded" />
                                        </div>
                                        <div className="h-6 w-16 bg-green-500/20 text-green-400 text-[10px] uppercase font-bold tracking-wider flex items-center justify-center rounded">
                                            Sent
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="order-1 md:order-2"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-sm font-medium mb-6">
                            <Database className="h-4 w-4" />
                            <span>Bulk Operations</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-serif font-medium tracking-tight mb-6">
                            From spreadsheet to <br />
                            <span className="text-muted-foreground">inbo in seconds.</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 text-balance">
                            Upload your CSV, Excel, or connect a Google Sheet. We map your columns to certificate fields automatically.
                            Generate 10 or 10,000 certificates with the same ease.
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                                <Zap className="h-6 w-6 text-orange-500 mb-2" />
                                <div className="font-semibold">Lightning Fast</div>
                                <div className="text-sm text-muted-foreground">Up to 500 certs/min</div>
                            </div>
                            <div className="p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                                <Send className="h-6 w-6 text-blue-500 mb-2" />
                                <div className="font-semibold">Auto-Email</div>
                                <div className="text-sm text-muted-foreground">Personalized delivery</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Feature Grid (Bento) */}
                <div className="space-y-8">
                    <div className="text-center max-w-2xl mx-auto space-y-4">
                        <h2 className="text-3xl md:text-4xl font-serif font-medium">Everything you need to scale</h2>
                        <p className="text-muted-foreground">Built for teams that demand quality and reliability.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Bento Card 1 */}
                        <div className="bg-muted/30 border p-8 rounded-2xl hover:border-primary/50 transition-colors group">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Enterprise Security</h3>
                            <p className="text-muted-foreground">Role-based access control, SSO, and audit logs keep your data safe.</p>
                        </div>

                        {/* Bento Card 2 */}
                        <div className="bg-muted/30 border p-8 rounded-2xl hover:border-primary/50 transition-colors group">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <BarChart className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Detailed Analytics</h3>
                            <p className="text-muted-foreground">See who opened your emails and downloaded their certificates.</p>
                        </div>

                        {/* Bento Card 3 */}
                        <div className="bg-muted/30 border p-8 rounded-2xl hover:border-primary/50 transition-colors group">
                            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Team Collaboration</h3>
                            <p className="text-muted-foreground">Invite your team, share templates, and manage workspaces together.</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
