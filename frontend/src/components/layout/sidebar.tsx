'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FileImage,
    FileOutput,
    PenTool,
    ChevronDown,
    Zap,
    Database,
    FolderKanban,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CustomTooltip } from '@/components/ui/custom-tooltip';

interface SidebarProps {
    isCollapsed?: boolean;
    toggleCollapse?: () => void;
}

export function Sidebar({ isCollapsed = false, toggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;

    const items = [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Groups', href: '/groups', icon: FolderKanban },
        { title: 'Templates', href: '/templates', icon: FileImage },
        { title: 'Generate', href: '/generate', icon: FileOutput },
        { title: 'Signatures', href: '/signatures', icon: PenTool },
        { title: 'Data Vault', href: '/data-vault', icon: Database },
    ];

    if (user?.role === 'admin') {
        items.push({ title: 'Admin', href: '/admin', icon: Settings });
    }

    return (
        <aside className="flex h-full w-full flex-col text-sidebar-foreground">
            {/* Logo & Toggle */}
            <div className={cn(
                "flex h-16 items-center px-3 border-b border-sidebar-border/50",
                isCollapsed ? "justify-center" : "justify-between"
            )}>
                {!isCollapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2 font-bold tracking-tight px-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Zap className="h-4 w-4" fill="currentColor" />
                        </div>
                        <span className="truncate">CertifGen</span>
                    </Link>
                )}

                {/* Collapsed Logo (Icon Only) */}
                {isCollapsed && (
                    <Link href="/dashboard" className="flex items-center justify-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Zap className="h-4 w-4" fill="currentColor" />
                        </div>
                    </Link>
                )}

                {/* Toggle Button */}
                {!isCollapsed && toggleCollapse && (
                    <CustomTooltip content="Collapse Sidebar">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={toggleCollapse}
                        >
                            <PanelLeftClose className="h-4 w-4" />
                        </Button>
                    </CustomTooltip>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
                {items.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <div key={item.href}>
                            {isCollapsed ? (
                                <CustomTooltip content={item.title} side="right">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                                        )}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </Link>
                                </CustomTooltip>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                            : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto p-3 space-y-2">
                {/* Expand Button if Collapsed */}
                {isCollapsed && toggleCollapse && (
                    <CustomTooltip content="Expand Sidebar">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-full h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                            onClick={toggleCollapse}
                        >
                            <PanelLeftOpen className="h-5 w-5" />
                        </Button>
                    </CustomTooltip>
                )}

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {isCollapsed ? (
                            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent transition-colors overflow-hidden shrink-0">
                                <Avatar className="h-8 w-8 rounded-full border">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                            </button>
                        ) : (
                            <button className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 shadow-sm hover:bg-accent cursor-pointer transition-colors text-left overflow-hidden">
                                <Avatar className="h-8 w-8 rounded-full">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden min-w-0">
                                    <p className="truncate text-sm font-medium">{user?.name || "User"}</p>
                                    <div className="flex items-center gap-1">
                                        <p className="truncate text-xs text-muted-foreground">{user?.email || "user@example.com"}</p>
                                    </div>
                                </div>
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                            </button>
                        )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "bottom"} className="w-56">
                        <div className="flex items-center gap-2 p-2 border-b mb-1">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                            </div>
                        </div>
                        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}
