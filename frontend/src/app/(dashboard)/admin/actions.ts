'use server';

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { templates } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function adminToggleTemplatePublic(id: string, isPublic: boolean) {
    await checkAdmin();
    await db.update(templates)
        .set({ isPublic })
        .where(eq(templates.id, id));
    revalidatePath("/admin");
}

export async function adminUpdateTemplateMetadata(id: string, data: { category?: string, style?: string, color?: string }) {
    await checkAdmin();
    const updateData: any = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.style !== undefined) updateData.style = data.style;
    if (data.color !== undefined) updateData.color = data.color;

    await db.update(templates)
        .set(updateData)
        .where(eq(templates.id, id));
    revalidatePath("/admin");
    revalidatePath("/templates");
}

export async function adminDeleteTemplate(id: string) {
    await checkAdmin();
    await db.delete(templates).where(eq(templates.id, id));
    revalidatePath("/admin");
}
