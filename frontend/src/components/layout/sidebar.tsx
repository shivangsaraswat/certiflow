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
    Database,
    FolderKanban,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"





export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;

    console.log("[Sidebar Debug] Current User:", user);

    const items = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutDashboard,
        },
        {
            title: 'Groups',
            href: '/groups',
            icon: FolderKanban,
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

    if (user?.role === 'admin') {
        items.push({
            title: 'Admin',
            href: '/admin',
            icon: Settings,
        });
    }

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground">
            {/* Logo */}
            <div className="flex h-16 items-center px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Zap className="h-4 w-4" fill="currentColor" />
                    </div>
                    <span>CertifGen</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {items.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

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


                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-accent cursor-pointer transition-colors">
                            <Avatar className="h-8 w-8 rounded-full">
                                <AvatarImage src={user?.image || ""} />
                                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden text-left">
                                <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
                                <div className="flex items-center gap-1">
                                    <p className="truncate text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                                    {user?.role && <span className="text-[10px] bg-primary/10 text-primary px-1 rounded uppercase font-bold">{user.role}</span>}
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => signOut()}>
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
