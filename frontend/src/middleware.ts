
import NextAuth from "next-auth"
import authConfig from "./auth.config"

const { auth: middleware } = NextAuth(authConfig)

export default middleware((req) => {
    const isLoggedIn = !!req.auth
    const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard") ||
        req.nextUrl.pathname.startsWith("/groups") ||
        req.nextUrl.pathname.startsWith("/templates") ||
        req.nextUrl.pathname.startsWith("/generate") ||
        req.nextUrl.pathname.startsWith("/signatures") ||
        req.nextUrl.pathname.startsWith("/data-vault") ||
        req.nextUrl.pathname.startsWith("/admin");

    if (isOnDashboard && !isLoggedIn) {
        return Response.redirect(new URL("/auth/login", req.nextUrl))
    }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
