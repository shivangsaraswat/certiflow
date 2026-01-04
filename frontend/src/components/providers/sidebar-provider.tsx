'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type SidebarContextType = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    collapseSidebar: () => void;
    expandSidebar: () => void;
    isMounted: boolean;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem('sidebar-collapsed');
        if (stored === 'true') {
            setIsCollapsed(true);
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const collapseSidebar = () => {
        setIsCollapsed(true);
        localStorage.setItem('sidebar-collapsed', 'true');
    };

    const expandSidebar = () => {
        setIsCollapsed(false);
        localStorage.setItem('sidebar-collapsed', 'false');
    };

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                toggleSidebar,
                collapseSidebar,
                expandSidebar,
                isMounted
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
