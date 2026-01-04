'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PageTitleContextType {
    title: ReactNode | string | null;
    setPageTitle: (title: ReactNode | string | null) => void;
    actions: ReactNode | null;
    setActions: (actions: ReactNode | null) => void;
    backButton: ReactNode | null;
    setBackButton: (backButton: ReactNode | null) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

export function PageTitleProvider({ children }: { children: ReactNode }) {
    const [title, setTitle] = useState<ReactNode | string | null>(null);
    const [actions, setActions] = useState<ReactNode | null>(null);
    const [backButton, setBackButton] = useState<ReactNode | null>(null);

    return (
        <PageTitleContext.Provider value={{
            title,
            setPageTitle: setTitle,
            actions,
            setActions,
            backButton,
            setBackButton
        }}>
            {children}
        </PageTitleContext.Provider>
    );
}

export function usePageTitle() {
    const context = useContext(PageTitleContext);
    if (context === undefined) {
        throw new Error('usePageTitle must be used within a PageTitleProvider');
    }
    return context;
}
