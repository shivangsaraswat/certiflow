'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Upload, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getUserAssets, uploadAsset, deleteAsset } from '@/lib/api';
import { UserAsset } from '@/types';
import { toast } from 'sonner';

export function ImagesPanel() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [assets, setAssets] = useState<UserAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    const loadAssets = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await getUserAssets(userId);
            if (res.success && res.data) {
                setAssets(res.data);
            }
        } catch (error) {
            console.error('Failed to load assets:', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        // Reset input value so same file can be selected again
        e.target.value = '';

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await uploadAsset(formData, userId);
            if (res.success && res.data) {
                setAssets(prev => [res.data!, ...prev]);
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent drag start or click selection if we add click handler
        if (!userId) return;
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const res = await deleteAsset(id, userId);
            if (res.success) {
                setAssets(prev => prev.filter(a => a.id !== id));
                toast.success('Image deleted');
            } else {
                toast.error('Failed to delete image');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Failed to delete image');
        }
    };

    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('type', 'image');
        e.dataTransfer.setData('src', url);
        // Maybe useful for fabric to know it's an image from our panel
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div className="flex h-full flex-col bg-background">
            <div className="p-4 border-b space-y-4">
                <Button
                    className="w-full"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                        </>
                    )}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-2">
                        <div className="bg-muted p-3 rounded-full">
                            <ImageIcon className="h-6 w-6 opacity-50" />
                        </div>
                        <div className="text-sm">No images uploaded yet</div>
                        <div className="text-xs max-w-[180px]">Upload your logos, signatures, or background images.</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {assets.map((asset) => (
                            <div
                                key={asset.id}
                                className="group relative aspect-square cursor-grab overflow-hidden rounded-md border bg-muted"
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset.fileUrl)}
                            >
                                <img
                                    src={`${asset.fileUrl}?tr=w-300,h-300,cm-extract`} // ImageKit thumbnail
                                    alt="User asset"
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Delete Button Overlay */}
                                <button
                                    onClick={(e) => handleDelete(e, asset.id)}
                                    className="absolute top-1 right-1 p-1.5 rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                                    title="Delete image"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
