
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            role: "admin" | "user"
            id: string
        } & DefaultSession["user"]
    }

    interface User {
        role: string
        isAllowed: boolean
    }
}

declare module "@auth/core/adapters" {
    interface AdapterUser {
        role: string
        isAllowed: boolean
    }
}
