
import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export default {
    providers: [Google],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard") ||
                nextUrl.pathname.startsWith("/groups") ||
                nextUrl.pathname.startsWith("/templates") ||
                nextUrl.pathname.startsWith("/generate") ||
                nextUrl.pathname.startsWith("/signatures") ||
                nextUrl.pathname.startsWith("/data-vault") ||
                nextUrl.pathname.startsWith("/admin")

            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect to login
            }
            return true
        },
    },
} satisfies NextAuthConfig
