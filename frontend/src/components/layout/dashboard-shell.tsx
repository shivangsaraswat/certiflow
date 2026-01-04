'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/providers/sidebar-provider';
import { Button } from '@/components/ui/button';
import { PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface DashboardShellProps {
    children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
    const { isCollapsed, toggleSidebar, isMounted } = useSidebar();
    const [isHoveringGutter, setIsHoveringGutter] = useState(false);

    // Prevent hydration mismatch by rendering a static layout until mounted
    if (!isMounted) {
        return (
            <div className="flex min-h-screen bg-background opacity-0">
                {/* Initial hidden state to prevent FOUC */}
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Sidebar - hidden on mobile (handled by Header's Sheet for mobile) */}
            <motion.div
                initial={false}
                animate={{
                    width: isCollapsed ? 72 : 256,
                }}
                // Disable animation on first render if needed, or keep it smooth but ensure start state is correct
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={cn(
                    "hidden lg:block fixed left-0 top-0 h-full z-40 border-r bg-sidebar shrink-0 shadow-sm"
                )}
            >
                <Sidebar />
            </motion.div>

            {/* Main Content Area */}
            <motion.div
                initial={false}
                animate={{
                    paddingLeft: isCollapsed ? 72 : 256,
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden"
            >
                <Header />
                <main className="px-4 sm:px-6 pb-6 pt-4 flex-1 overflow-hidden">
                    {children}
                </main>
            </motion.div>

            {/* ChatGPT Style Gutter / Toggle for Collapsed State */}
            {isCollapsed && (
                <div
                    className="hidden lg:block fixed left-0 top-0 bottom-0 w-2 z-50 cursor-pointer"
                    onMouseEnter={() => setIsHoveringGutter(true)}
                    onMouseLeave={() => setIsHoveringGutter(false)}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleSidebar();
                    }}
                >
                    <AnimatePresence>
                        {isHoveringGutter && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="fixed left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                            >
                                <div className="h-20 w-1.5 bg-primary/40 rounded-full shadow-[0_0_10px_rgba(var(--primary),0.2)] animate-pulse" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Expand Arrow near top icon area */}
                    <AnimatePresence>
                        {isHoveringGutter && (
                            <motion.div
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -5 }}
                                className="fixed left-2 top-4 z-[60]"
                            >
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg shadow-lg border border-primary/20 bg-background hover:bg-accent text-primary transition-all duration-200"
                                >
                                    <PanelLeftOpen className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
