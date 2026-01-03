'use client';

/**
 * File Upload Component
 * Drag and drop file upload with preview
 */

import { useCallback, useState } from 'react';
import { Upload, X, FileImage, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    accept: string;
    maxSize?: number; // in bytes
    onFileSelect: (file: File | null) => void;
    value?: File | null;
    disabled?: boolean;
    className?: string;
}

export function FileUpload({
    accept,
    maxSize = 20 * 1024 * 1024, // 20MB default
    onFileSelect,
    value,
    disabled,
    className,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = useCallback((file: File): boolean => {
        setError(null);

        // Check file size
        if (file.size > maxSize) {
            setError(`File must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
            return false;
        }

        // Check file type
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isValidType = acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return file.name.toLowerCase().endsWith(type);
            }
            if (type.endsWith('/*')) {
                return file.type.startsWith(type.replace('/*', '/'));
            }
            return file.type === type;
        });

        if (!isValidType) {
            setError('Invalid file type');
            return false;
        }

        return true;
    }, [accept, maxSize]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            onFileSelect(file);
        }
    }, [disabled, onFileSelect, validateFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            onFileSelect(file);
        }
        // Reset input value to allow re-selecting the same file
        e.target.value = '';
    }, [onFileSelect, validateFile]);

    const handleRemove = useCallback(() => {
        onFileSelect(null);
        setError(null);
    }, [onFileSelect]);

    const isImage = value?.type.startsWith('image/');

    return (
        <div className={cn('w-full', className)}>
            {value ? (
                <div className="relative rounded-lg border-2 border-dashed border-muted-foreground/25 p-4">
                    <div className="flex items-center gap-4">
                        {isImage ? (
                            <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                                <img
                                    src={URL.createObjectURL(value)}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                                <File className="h-8 w-8 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{value.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(value.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemove}
                            disabled={disabled}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    className={cn(
                        'relative rounded-lg border-2 border-dashed p-8 transition-colors',
                        isDragging
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                        disabled && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        disabled={disabled}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-4 rounded-full bg-muted p-3">
                            <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mb-1 font-medium">
                            Drop your file here, or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Supports: {accept.replace(/\./g, '').replace(/,/g, ', ')}
                        </p>
                    </div>
                </div>
            )}
            {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
