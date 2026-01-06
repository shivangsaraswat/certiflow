"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setTheme } = useTheme();

    // Force light theme on auth pages (login, signup)
    useEffect(() => {
        setTheme("light");
    }, [setTheme]);

    return <>{children}</>;
}
