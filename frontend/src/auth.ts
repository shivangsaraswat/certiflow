
import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { users, systemSettings } from "@/db/schema"
import authConfig from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: DrizzleAdapter(db),
    session: { strategy: "jwt" },
    ...authConfig,
    callbacks: {
        async signIn({ user, account, profile }) {
            const email = user.email;
            if (!email) return false;

            // Master Admin Bypass
            if (email === "shivangk512@gmail.com") return true;

            // Check System Settings
            const settings = await db.query.systemSettings.findFirst({
                where: eq(systemSettings.id, "global"),
            });
            const allowSignups = settings?.allowSignups ?? false;

            // Check if user exists
            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, email),
            });

            if (existingUser) {
                return existingUser.isAllowed === true;
            } else {
                return allowSignups;
            }
        },
        async jwt({ token, user }) {
            if (user) {
                console.log("[Auth JWT] User logging in:", user.email, "Role:", (user as any).role);
                token.role = (user as any).role || "user";
                token.id = user.id;

                // Force admin for master email as a fallback
                if (user.email === "shivangk512@gmail.com") {
                    token.role = "admin";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as "admin" | "user";
                session.user.id = token.id as string;
                console.log("[Auth Session] Session created for:", session.user.email, "Role:", session.user.role);
            }
            return session;
        }
    },
    events: {
        async createUser({ user }) {
            const email = user.email;
            if (email === "shivangk512@gmail.com") {
                await db.update(users)
                    .set({ role: "admin", isAllowed: true })
                    .where(eq(users.id, user.id!));
            } else {
                await db.update(users)
                    .set({ isAllowed: true })
                    .where(eq(users.id, user.id!));
            }
        }
    },
    pages: {
        signIn: '/auth/login',
    }
})
