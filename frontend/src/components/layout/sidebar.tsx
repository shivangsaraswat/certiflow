'use client';

/**
 * Sidebar Navigation Component
 * Main navigation for the certificate generation dashboard
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileImage,
    FileOutput,
    Files,
    History,
    PenTool,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <FileOutput className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold">CertifGen</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                    <Settings className="h-5 w-5" />
                    <span>v1.0.0</span>
                </div>
            </div>
        </aside>
    );
}
