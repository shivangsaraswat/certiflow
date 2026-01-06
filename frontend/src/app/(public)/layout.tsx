"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setTheme } = useTheme();

    // Force light theme on landing page
    useEffect(() => {
        setTheme("light");
    }, [setTheme]);

    return <>{children}</>;
}
