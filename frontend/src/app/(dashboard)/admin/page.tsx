
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { users, systemSettings } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { revalidatePath } from "next/cache"
import { Label } from "@/components/ui/label"
import { AddUserForm } from "./add-user-form"

export default async function AdminPage() {
    const session = await auth();
    if (session?.user?.role !== "admin") {
        redirect("/dashboard");
    }

    // Fetch Users
    const allUsers = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
    });

    // Fetch System Settings
    const settings = await db.query.systemSettings.findFirst({
        where: eq(systemSettings.id, "global"),
    });

    // Actions
    async function toggleSignup() {
        "use server";
        const settings = await db.query.systemSettings.findFirst({
            where: eq(systemSettings.id, "global"),
        });

        if (settings) {
            await db.update(systemSettings).set({ allowSignups: !settings.allowSignups }).where(eq(systemSettings.id, "global"));
        } else {
            await db.insert(systemSettings).values({ id: "global", allowSignups: true });
        }
        revalidatePath("/admin");
    }

    async function toggleUserAccess(userId: string, currentStatus: boolean) {
        "use server";
        // Prevent toggling self
        const session = await auth();
        if (session?.user?.id === userId) return;

        await db.update(users).set({ isAllowed: !currentStatus }).where(eq(users.id, userId));
        revalidatePath("/admin");
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>

            {/* System Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Global configuration for the application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                            <Label className="text-base">Allow New Signups</Label>
                            <div className="text-sm text-muted-foreground">
                                {settings?.allowSignups ? "New users can sign up and login." : "New signups are disabled."}
                            </div>
                        </div>
                        <form action={toggleSignup}>
                            <Button variant={settings?.allowSignups ? "destructive" : "default"} type="submit">
                                {settings?.allowSignups ? "Disable Signups" : "Enable Signups"}
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>

            {/* User Management */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle>User Management</CardTitle>
                        <CardDescription>Manage user access and roles.</CardDescription>
                    </div>
                    <AddUserForm />
                </CardHeader>
                <CardContent className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.image || ""} />
                                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {user.isAllowed ? (
                                            <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                                        ) : (
                                            <Badge variant="destructive">Blocked</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.role !== 'admin' && (
                                            <form action={toggleUserAccess.bind(null, user.id, user.isAllowed || false)}>
                                                <Button size="sm" variant="ghost">
                                                    {user.isAllowed ? "Revoke Access" : "Approve Access"}
                                                </Button>
                                            </form>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
