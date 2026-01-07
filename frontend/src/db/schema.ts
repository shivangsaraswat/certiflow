
import { pgTable, text, timestamp, integer, boolean, primaryKey, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { AdapterAccount } from '@auth/core/adapters';

export const users = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name"),
    email: text("email").notNull(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: text("role").$type<"admin" | "user">().default("user"),
    isAllowed: boolean("is_allowed").default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable(
    "account",
    {
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: text("type").$type<AdapterAccount["type"]>().notNull(),
        provider: text("provider").notNull(),
        providerAccountId: text("providerAccountId").notNull(),
        refresh_token: text("refresh_token"),
        access_token: text("access_token"),
        expires_at: integer("expires_at"),
        token_type: text("token_type"),
        scope: text("scope"),
        id_token: text("id_token"),
        session_state: text("session_state"),
    },
    (account) => ({
        compoundKey: primaryKey({
            columns: [account.provider, account.providerAccountId],
        }),
    })
);

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
    "verificationToken",
    {
        identifier: text("identifier").notNull(),
        token: text("token").notNull(),
        expires: timestamp("expires", { mode: "date" }).notNull(),
    },
    (verificationToken) => ({
        compositePk: primaryKey({
            columns: [verificationToken.identifier, verificationToken.token],
        }),
    })
);

export const systemSettings = pgTable("system_settings", {
    id: text("id").primaryKey().$defaultFn(() => "global"),
    allowSignups: boolean("allow_signups").default(false).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =============================================================================
// Templates
// =============================================================================
export const templates = pgTable('templates', {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    name: text('name').notNull(),
    description: text('description'),
    filename: text('filename').notNull(),
    filepath: text('filepath').notNull(),
    fileUrl: text('file_url'),
    fileId: text('file_id'),
    pageCount: integer('page_count').notNull(),
    width: doublePrecision('width').notNull(),
    height: doublePrecision('height').notNull(),
    attributes: jsonb('attributes').notNull(),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    isPublic: boolean('is_public').default(false).notNull(),
    category: text('category'),
    style: text('style'),
    color: text('color'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const templatesRelations = relations(templates, ({ one }) => ({
    user: one(users, {
        fields: [templates.userId],
        references: [users.id],
    }),
}));

export const usersRelations = relations(users, ({ many }) => ({
    templates: many(templates),
    assets: many(userAssets),
}));

export const userAssets = pgTable('user_assets', {
    id: text('id').primaryKey(),
    filename: text('filename').notNull(),
    fileUrl: text('file_url').notNull(),
    fileId: text('file_id'),
    width: integer('width'),
    height: integer('height'),
    userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
    user: one(users, {
        fields: [userAssets.userId],
        references: [users.id],
    }),
}));
