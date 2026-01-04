import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, FileOutput, Users, ArrowRight, LayoutDashboard, Database, PenTool } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between mx-auto px-6">
                    <div className="flex items-center gap-2 font-bold tracking-tight text-xl">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Zap className="h-4 w-4" fill="currentColor" />
                        </div>
                        <span>CertifGen</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost" size="sm">Sign In</Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button size="sm">Get Started</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden mx-auto px-6 container">
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <Badge variant="outline" className="px-3 py-1 rounded-full border-primary/20 bg-primary/5 text-primary">
                        v1.0 Public Beta
                    </Badge>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
                        Industrial Grade <br />
                        <span className="text-primary">Certificate Generation</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                        Automate your certification workflows with a powerful, minimalist, and developer-friendly platform. Built for scale, designed for precision.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link href="/auth/login">
                            <Button size="lg" className="h-12 px-8 text-base">
                                Start Generating <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-muted/30">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-card border p-6 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Bulk Processing</h3>
                            <p className="text-muted-foreground">Upload CSV or Sheets and generate thousands of certificates in seconds.</p>
                        </div>
                        <div className="bg-card border p-6 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <LayoutDashboard className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Visual Editor</h3>
                            <p className="text-muted-foreground">Design certificates with an intuitive drag-and-drop editor. No code required.</p>
                        </div>
                        <div className="bg-card border p-6 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Database className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">Dataset</h3>
                            <p className="text-muted-foreground">Securely store and manage your recipient data. Reuse it across campaigns.</p>
                        </div>
                        <div className="bg-card border p-6 rounded-xl space-y-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <PenTool className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-semibold">E-Signatures</h3>
                            <p className="text-muted-foreground">Integrate digital signatures seamlessly into your certificate templates.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t mt-auto">
                <div className="container mx-auto px-6 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} CertifGen. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
