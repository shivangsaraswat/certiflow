"use client"

import { useState } from "react"
import { addUser } from "@/app/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Plus, UserPlus } from "lucide-react"

export function AddUserForm() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        try {
            const result = await addUser(email)
            if (result.success) {
                toast.success(result.message)
                setEmail("")
            } else {
                toast.info(result.message)
            }
        } catch (error) {
            toast.error("Failed to add user")
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
                <UserPlus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                />
            </div>
            <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add User"}
            </Button>
        </form>
    )
}
