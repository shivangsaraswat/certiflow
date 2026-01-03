"use server"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"

export async function addUser(email: string) {
    const session = await auth();

    // Authorization Check
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }

    if (!email) {
        throw new Error("Email is required");
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (existingUser) {
        // Build response message
        if (existingUser.isAllowed) {
            return { success: false, message: "User is already allowed." };
        }

        // Update existing user
        await db.update(users)
            .set({ isAllowed: true })
            .where(eq(users.id, existingUser.id));

        revalidatePath("/admin");
        return { success: true, message: "User access granted." };
    } else {
        // Create new user (Pre-approved)
        await db.insert(users).values({
            id: uuidv4(),
            email: email,
            role: "user",
            isAllowed: true,
            // name and image will be populated when they first login with Google
        });

        revalidatePath("/admin");
        return { success: true, message: "User added to whitelist." };
    }
}
