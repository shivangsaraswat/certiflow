'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTA() {
    return (
        <section className="py-24 px-6">
            <div className="container mx-auto">
                <div className="bg-foreground text-background rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                        <h2 className="text-4xl md:text-6xl font-serif font-medium tracking-tight">
                            Ready to issue your first certificate?
                        </h2>
                        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
                            Join thousands of organizations using CertifGen to recognize authentic achievements.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="/auth/login">
                                <Button size="lg" className="h-14 px-8 rounded-full text-base font-bold bg-background text-foreground hover:bg-zinc-200">
                                    Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="mailto:sales@certifgen.com">
                                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-base border-white/20 bg-transparent text-white hover:bg-white hover:text-black transition-colors">
                                    Contact Sales
                                </Button>
                            </Link>
                        </div>

                        <div className="pt-8 text-sm text-zinc-500">
                            No credit card required. Cancel anytime.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
