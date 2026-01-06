'use client';

import Link from 'next/link';
import { Zap, Twitter, Linkedin, Github } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-muted/10 border-t pt-20 pb-12">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">

                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <Zap className="h-4 w-4" fill="currentColor" />
                            </div>
                            <span>CertifGen</span>
                        </div>
                        <p className="text-muted-foreground max-w-xs">
                            The standard for digital credentials. Design, issue, and verify certificates with ease.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                                <Twitter className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                                <Github className="h-4 w-4" />
                            </Link>
                            <Link href="#" className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                                <Linkedin className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Links Columns */}
                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Product</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Templates</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Integrations</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Resources</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Developers</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Status</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 text-foreground">Company</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Legal</Link></li>
                            <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} CertifGen Inc. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
                        <Link href="#" className="hover:text-foreground">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
