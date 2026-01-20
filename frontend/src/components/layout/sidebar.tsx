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
    LogOut,
    Moon,
    Sun,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession, signOut } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export function Sidebar({ forceExpand = false }: { forceExpand?: boolean }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user;
    const { isCollapsed: sidebarCollapsed, toggleSidebar } = useSidebar();
    const { theme, setTheme } = useTheme();
    const [isHoveringLogo, setIsHoveringLogo] = useState(false);

    const isCollapsed = forceExpand ? false : sidebarCollapsed;

    const items = [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { title: 'Groups', href: '/groups', icon: FolderKanban },
        { title: 'Templates', href: '/templates', icon: FileImage },
        { title: 'Generate', href: '/generate', icon: FileOutput },
        { title: 'Signatures', href: '/signatures', icon: PenTool },
        { title: 'Dataset', href: '/data-vault', icon: Database },
    ];

    const toggleTheme = () => {
        setTheme(theme === "dark" ? "light" : "dark");
    };

    return (
        <TooltipProvider>
            <aside className="flex h-full w-full flex-col text-sidebar-foreground">
                {/* Logo & Toggle - Fixed at top */}
                <div
                    className={cn(
                        "relative flex h-16 items-center px-4 shrink-0 group/header",
                        isCollapsed ? "justify-center" : "justify-between"
                    )}
                    onMouseEnter={() => setIsHoveringLogo(true)}
                    onMouseLeave={() => setIsHoveringLogo(false)}
                >
                    <Link href="/dashboard" className="flex items-center gap-3 font-bold tracking-tight outline-none group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                            <img src="/certiflow-logo1.png" alt="CertiFlow" className="h-9 w-9 object-contain" />
                        </div>
                        <AnimatePresence mode="wait">
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="truncate text-lg bg-clip-text text-foreground overflow-hidden whitespace-nowrap"
                                >
                                    CertiFlow
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>

                    {/* Desktop Toggle Button */}
                    <AnimatePresence>
                        {!isCollapsed ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="hidden lg:block shrink-0"
                            >
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 rounded-lg transition-colors"
                                            onClick={toggleSidebar}
                                        >
                                            <PanelLeftClose className="h-4.5 w-4.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Close sidebar</TooltipContent>
                                </Tooltip>
                            </motion.div>
                        ) : (
                            // ChatGPT-style expand button that appears on hover when collapsed
                            isHoveringLogo && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="absolute left-full top-1/2 -translate-y-1/2 ml-4 z-50 hidden lg:block"
                                >
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg shadow-lg border border-primary/20 bg-background hover:bg-accent text-primary transition-all duration-200"
                                                onClick={toggleSidebar}
                                            >
                                                <PanelLeftOpen className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">Expand sidebar</TooltipContent>
                                    </Tooltip>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5 custom-scrollbar overflow-x-hidden">
                    {items.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));

                        // Base link content
                        const LinkContent = (
                            <Link
                                href={item.href}
                                className={cn(
                                    'group relative flex items-center gap-3 rounded-lg py-2.5 transition-all duration-200 overflow-hidden',
                                    isCollapsed ? 'justify-center w-10 h-10 mx-auto px-0' : 'px-3',
                                    isActive
                                        ? 'bg-primary/10 text-primary shadow-[0_0_0_1px_rgba(var(--primary),0.1)]'
                                        : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn(
                                    "shrink-0 transition-all duration-200",
                                    isCollapsed ? "h-5 w-5" : "h-4 w-4",
                                    isActive ? "text-primary scale-110" : "group-hover:text-foreground"
                                )} />

                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-sm font-medium whitespace-nowrap"
                                    >
                                        {item.title}
                                    </motion.span>
                                )}

                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                                    />
                                )}
                            </Link>
                        );

                        // Wrap in tooltip if collapsed
                        return (
                            <div key={item.href}>
                                {isCollapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {LinkContent}
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            {item.title}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    LinkContent
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Section */}
                <div className="p-3 shrink-0 border-t border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "flex w-full items-center gap-3 rounded-xl transition-all duration-300 outline-none",
                                isCollapsed
                                    ? "h-10 w-10 justify-center mx-auto hover:bg-sidebar-accent"
                                    : "px-2.5 py-2.5 hover:bg-sidebar-accent border border-transparent hover:border-sidebar-border shadow-sm hover:shadow-md"
                            )}>
                                <div className="relative shrink-0">
                                    <Avatar className={cn(
                                        "transition-all duration-300 ring-2 ring-transparent group-hover:ring-primary/20",
                                        isCollapsed ? "h-8 w-8" : "h-9 w-9 shadow-sm"
                                    )}>
                                        <AvatarImage src={user?.image || ""} />
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                            {user?.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-green-500" />
                                </div>

                                <AnimatePresence mode="wait">
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: "auto" }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="flex flex-1 items-center justify-between overflow-hidden min-w-0"
                                        >
                                            <div className="flex flex-col text-left min-w-0">
                                                <p className="truncate text-sm font-semibold text-foreground tracking-tight leading-none mb-1">
                                                    {user?.name || "User"}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground/80 font-medium leading-none">
                                                    {user?.email || "user@example.com"}
                                                </p>
                                            </div>
                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 ml-2" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            align={isCollapsed ? "center" : "end"}
                            side={isCollapsed ? "right" : "top"}
                            sideOffset={12}
                            className="w-64 p-1.5 rounded-2xl shadow-xl border-muted/50 backdrop-blur-xl"
                        >
                            <div className="flex items-center gap-3 p-3 mb-1 bg-muted/30 rounded-xl">
                                <Avatar className="h-10 w-10 rounded-lg shadow-sm">
                                    <AvatarImage src={user?.image || ""} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-sm font-bold text-foreground leading-tight truncate">{user?.name}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                                </div>
                            </div>

                            <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer gap-2.5 rounded-lg py-2">
                                <div className="h-8 w-8 flex items-center justify-center rounded-md bg-muted/50 text-foreground">
                                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </div>
                                <span className="font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </DropdownMenuItem>

                            {user?.role === 'admin' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="cursor-pointer gap-2.5 rounded-lg py-2">
                                        <div className="h-8 w-8 flex items-center justify-center rounded-md bg-muted/50 text-foreground">
                                            <Settings className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">Admin Panel</span>
                                    </Link>
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="cursor-pointer gap-2.5 rounded-lg py-2">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-md bg-muted/50 text-foreground">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium">Settings</span>
                                </Link>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1.5 opacity-50" />

                            <DropdownMenuItem
                                onClick={() => signOut()}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2.5 rounded-lg py-2 font-medium"
                            >
                                <div className="h-8 w-8 flex items-center justify-center rounded-md bg-destructive/10 text-destructive">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>
        </TooltipProvider>
    );
}
