'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, Trash, Pencil, Check, X, ExternalLink } from "lucide-react";
import { adminToggleTemplatePublic, adminUpdateTemplateMetadata, adminDeleteTemplate } from "./actions";
import Link from 'next/link';

interface Template {
    id: string;
    name: string;
    userId: string | null;
    isPublic: boolean;
    category: string | null;
    style: string | null;
    color: string | null;
    createdAt: Date;
    user?: {
        name: string | null;
        email: string;
    } | null;
}

interface TemplatesTableProps {
    templates: Template[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ category: string, style: string, color: string }>({ category: '', style: '', color: '' });

    const categories = ['Professional', 'Academic', 'Events', 'Corporate', 'Other'];
    const styles = ['Modern', 'Classic', 'Minimal', 'Bold', 'Creative'];
    const colors = ['Blue', 'Gold', 'Green', 'Red', 'Black', 'Multi'];

    const handleEditClick = (t: Template) => {
        setEditingId(t.id);
        setEditForm({
            category: t.category || '',
            style: t.style || '',
            color: t.color || ''
        });
    };

    const handleSave = async (id: string) => {
        await adminUpdateTemplateMetadata(id, editForm);
        setEditingId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this template? This cannot be undone.")) {
            await adminDeleteTemplate(id);
        }
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Template Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Public</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Style</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {templates.map((t) => (
                        <TableRow key={t.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{t.name}</span>
                                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">{t.id}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm">{t.user?.name || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{t.user?.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Switch
                                    checked={t.isPublic}
                                    onCheckedChange={(checked) => adminToggleTemplatePublic(t.id, checked)}
                                />
                            </TableCell>

                            {editingId === t.id ? (
                                <>
                                    <TableCell>
                                        <select
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                            value={editForm.style}
                                            onChange={(e) => setEditForm({ ...editForm, style: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {styles.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <select
                                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                                            value={editForm.color}
                                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {colors.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleSave(t.id)}>
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => setEditingId(null)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>
                                        {t.category ? <Badge variant="outline">{t.category}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {t.style ? <Badge variant="outline">{t.style}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                                    </TableCell>
                                    <TableCell>
                                        {t.color ? <Badge variant="outline">{t.color}</Badge> : <span className="text-muted-foreground text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEditClick(t)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit Metadata
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/templates/${t.id}`}>
                                                        <ExternalLink className="mr-2 h-4 w-4" />
                                                        Open Editor
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(t.id)}>
                                                    <Trash className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
