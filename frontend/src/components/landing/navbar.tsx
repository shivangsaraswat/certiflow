'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Zap, FileText, BarChart3, Shield, Layout, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        {
            name: 'Platform',
            id: 'platform',
            dropdown: (
                <div className="grid grid-cols-2 gap-4 w-[600px] p-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Capabilities</h3>
                        <Link href="#" className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                            <div className="bg-primary/10 p-2 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium group-hover:text-primary transition-colors">Certificate Editor</div>
                                <p className="text-sm text-muted-foreground mt-1">Drag-and-drop design builder</p>
                            </div>
                        </Link>
                        <Link href="#" className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                            <div className="bg-primary/10 p-2 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Layout className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium group-hover:text-primary transition-colors">Bulk Generation</div>
                                <p className="text-sm text-muted-foreground mt-1">Generate thousands in seconds</p>
                            </div>
                        </Link>
                    </div>
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">Features</h3>
                        <Link href="#" className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                            <div className="bg-primary/10 p-2 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <BarChart3 className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium group-hover:text-primary transition-colors">Analytics</div>
                                <p className="text-sm text-muted-foreground mt-1">Track views and downloads</p>
                            </div>
                        </Link>
                        <Link href="#" className="group flex items-start gap-4 p-3 rounded-lg hover:bg-muted transition-colors">
                            <div className="bg-primary/10 p-2 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Shield className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-medium group-hover:text-primary transition-colors">Security</div>
                                <p className="text-sm text-muted-foreground mt-1">Enterprise-grade protection</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )
        },
        {
            name: 'Solutions',
            id: 'solutions',
            dropdown: (
                <div className="grid grid-cols-1 gap-4 w-[300px] p-6">
                    <Link href="#" className="block p-2 -m-2 rounded-md hover:bg-muted text-sm font-medium">For Education</Link>
                    <Link href="#" className="block p-2 -m-2 rounded-md hover:bg-muted text-sm font-medium">For Corporate Training</Link>
                    <Link href="#" className="block p-2 -m-2 rounded-md hover:bg-muted text-sm font-medium">For Events</Link>
                    <Link href="#" className="block p-2 -m-2 rounded-md hover:bg-muted text-sm font-medium">For Healthcare</Link>
                </div>
            )
        },
        { name: 'Templates', id: 'templates' },
        { name: 'Pricing', id: 'pricing' },
    ];

    return (
        <>
            <motion.header
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    scrolled ? "bg-background/80 backdrop-blur-md border-b py-3" : "bg-transparent py-5"
                )}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <nav className="container mx-auto px-6 h-10 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 font-serif font-semibold text-xl z-50">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Zap className="h-4 w-4" fill="currentColor" />
                        </div>
                        <span>CertifGen</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <div
                                key={link.id}
                                className="relative group"
                                onMouseEnter={() => setActiveDropdown(link.id)}
                                onMouseLeave={() => setActiveDropdown(null)}
                            >
                                <button
                                    className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
                                >
                                    {link.name}
                                    {link.dropdown && (
                                        <ChevronDown className={cn(
                                            "h-4 w-4 transition-transform duration-200",
                                            activeDropdown === link.id ? "rotate-180" : ""
                                        )} />
                                    )}
                                </button>

                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {activeDropdown === link.id && link.dropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-1/2 -translate-x-1/2 pt-4 w-auto min-w-[200px]"
                                        >
                                            <div className="bg-card rounded-xl border shadow-xl overflow-hidden ring-1 ring-black/5">
                                                {link.dropdown}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/auth/login">
                            <Button variant="ghost" size="sm" className="font-medium">
                                Log in
                            </Button>
                        </Link>
                        <Link href="/auth/login">
                            <Button size="sm" className="px-6 rounded-full font-medium">
                                Sign up
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden z-50 p-2 -mr-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </nav>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 bg-background pt-24 px-6 md:hidden overflow-y-auto"
                    >
                        <div className="flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <div key={link.id} className="space-y-3">
                                    <div className="text-lg font-semibold">{link.name}</div>
                                    {link.dropdown && (
                                        <div className="pl-4 border-l-2 space-y-3">
                                            {/* Simplified mobile dropdown content - recreating specific links for mobile structure would be ideal, 
                                             but for now we simulate the structure */}
                                            {link.id === 'platform' && (
                                                <>
                                                    <Link href="#" className="block text-muted-foreground">Certificate Editor</Link>
                                                    <Link href="#" className="block text-muted-foreground">Bulk Generation</Link>
                                                    <Link href="#" className="block text-muted-foreground">Analytics</Link>
                                                </>
                                            )}
                                            {link.id === 'solutions' && (
                                                <>
                                                    <Link href="#" className="block text-muted-foreground">Education</Link>
                                                    <Link href="#" className="block text-muted-foreground">Corporate</Link>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <hr className="border-muted" />
                            <div className="grid gap-3">
                                <Link href="/auth/login" className="w-full">
                                    <Button variant="outline" className="w-full h-12 text-base">Log in</Button>
                                </Link>
                                <Link href="/auth/login" className="w-full">
                                    <Button className="w-full h-12 text-base">Sign up for free</Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
