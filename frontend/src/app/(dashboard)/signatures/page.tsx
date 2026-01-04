'use client';

/**
 * Signatures Management Page
 * Upload and manage signature images
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { FileUpload } from '@/components/shared/file-upload';
import { LoadingSpinner, LoadingPage } from '@/components/shared/loading-spinner';
import { getSignatures, uploadSignature, deleteSignature, getViewUrl } from '@/lib/api';
import type { Signature } from '@/types';
import { usePageTitle } from '@/components/providers/page-title-provider';
import { useSession } from 'next-auth/react';

export default function SignaturesPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setActions } = usePageTitle();

    // Form state
    const [signatureName, setSignatureName] = useState('');
    const [signatureFile, setSignatureFile] = useState<File | null>(null);

    const loadSignatures = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (!userId) {
                setSignatures([]);
                return;
            }
            const res = await getSignatures(userId);
            if (res.success && res.data) {
                setSignatures(res.data);
            } else {
                setError(res.error?.message || 'Failed to load signatures');
            }
        } catch {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleUpload = useCallback(async () => {
        if (!signatureName.trim() || !signatureFile) return;

        setIsUploading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('name', signatureName.trim());
            formData.append('signature', signatureFile);

            const res = await uploadSignature(formData, userId);
            if (res.success && res.data) {
                setSignatures((prev) => [{ ...res.data!, previewUrl: getViewUrl('signatures', res.data!.filename) }, ...prev]);
                setIsDialogOpen(false);
                setSignatureName('');
                setSignatureFile(null);
            } else {
                setError(res.error?.message || 'Failed to upload signature');
            }
        } catch {
            setError('Failed to upload signature');
        } finally {
            setIsUploading(false);
        }
    }, [signatureName, signatureFile, userId, setIsDialogOpen, setSignatureName, setSignatureFile]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this signature?')) return;

        try {
            const res = await deleteSignature(id, userId);
            if (res.success) {
                setSignatures((prev) => prev.filter((s) => s.id !== id));
            } else {
                alert(res.error?.message || 'Failed to delete signature');
            }
        } catch {
            alert('Failed to delete signature');
        }
    }, [userId]);

    useEffect(() => {
        if (userId) loadSignatures();
    }, [loadSignatures, userId]);

    useEffect(() => {
        setActions(
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={loadSignatures}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Signature
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Upload Signature</DialogTitle>
                            <DialogDescription>
                                Upload a signature image to use in certificates
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Signature Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., CEO Signature"
                                    value={signatureName}
                                    onChange={(e) => setSignatureName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Signature Image</Label>
                                <FileUpload
                                    accept=".png,.jpg,.jpeg"
                                    onFileSelect={setSignatureFile}
                                    value={signatureFile}
                                    maxSize={5 * 1024 * 1024}
                                />
                            </div>
                            {error && (
                                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(false)}
                                disabled={isUploading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!signatureName.trim() || !signatureFile || isUploading}
                            >
                                {isUploading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    'Upload'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
        return () => setActions(null);
    }, [loadSignatures, isDialogOpen, setIsDialogOpen, signatureName, signatureFile, error, isUploading, handleUpload, setActions]);

    if (isLoading) {
        return <LoadingPage message="Loading signatures..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header placeholder - actions are now in the page header */}
            <div className="h-4" />

            {/* Error Display */}
            {error && !isDialogOpen && (
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                    {error}
                </div>
            )}

            {/* Signatures Grid */}
            {signatures.length === 0 ? (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                    <p className="mb-4 text-muted-foreground">No signatures yet</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Your First Signature
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {signatures.map((signature) => (
                        <Card key={signature.id} className="group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="relative aspect-[2/1] bg-muted">
                                    <img
                                        src={getViewUrl('signatures', signature.filename)}
                                        alt={signature.name}
                                        className="h-full w-full object-contain p-4"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={() => handleDelete(signature.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="border-t p-3">
                                    <p className="truncate font-medium">{signature.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(signature.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
