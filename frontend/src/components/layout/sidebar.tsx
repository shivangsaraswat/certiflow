'use client';

/**
 * Sidebar Navigation Component
 * Redesigned for Industrial Minimalist Theme
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileImage,
    FileOutput,
    Files,
    PenTool,
    ChevronDown,
    Zap,
    LifeBuoy,
    Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Templates',
        href: '/templates',
        icon: FileImage,
    },
    {
        title: 'Generate',
        href: '/generate',
        icon: FileOutput,
    },
    {
        title: 'Bulk Generate',
        href: '/generate/bulk',
        icon: Files,
    },
    {
        title: 'Signatures',
        href: '/signatures',
        icon: PenTool,
    },
    {
        title: 'Data Vault',
        href: '/data-vault',
        icon: Database,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            {/* Logo */}
            <div className="flex h-16 items-center px-6">
                <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" fill="currentColor" />
                    </div>
                    <span>CertifGen</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                    : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Stack */}
            <div className="mt-auto space-y-4 p-4">
                {/* Upgrade Card */}
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold">Starter Plan</span>
                        <span className="text-xs text-muted-foreground">Free</span>
                    </div>
                    <div className="mb-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Credential Usage</span>
                            <span>0/250</span>
                        </div>
                        <Progress value={0} className="h-1.5" />
                    </div>
                    <Button size="sm" className="w-full text-xs font-semibold" variant="default">
                        Upgrade
                    </Button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <span className="text-xs font-semibold">JD</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">John Doe</p>
                        <p className="truncate text-xs text-muted-foreground">john@example.com</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </aside>
    );
}
