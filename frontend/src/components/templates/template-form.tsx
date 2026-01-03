'use client';

/**
 * Template Upload Form Component
 * Form for uploading new PDF certificate templates
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { FileUpload } from '@/components/shared/file-upload';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { templateUploadSchema, type TemplateUploadData } from '@/lib/validations';
import { createTemplate } from '@/lib/api';

interface TemplateUploadFormProps {
    onSuccess?: () => void;
    returnTo?: string;
}

export function TemplateUploadForm({ onSuccess, returnTo }: TemplateUploadFormProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<TemplateUploadData>({
        resolver: zodResolver(templateUploadSchema),
        defaultValues: {
            code: '',
            name: '',
            description: '',
        },
    });

    async function onSubmit(data: TemplateUploadData) {
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('code', data.code);
            formData.append('name', data.name);
            if (data.description) {
                formData.append('description', data.description);
            }
            formData.append('template', data.template);

            if (!userId) {
                setError('You must be logged in to upload templates');
                setIsLoading(false);
                return;
            }

            const result = await createTemplate(formData, userId);

            if (result.success) {
                form.reset();
                if (onSuccess) {
                    onSuccess();
                } else if (returnTo) {
                    // Return to the wizard with step info
                    const params = new URLSearchParams(window.location.search);
                    const wizardStep = params.get('wizardStep');
                    const returnUrl = wizardStep ? `${returnTo}?wizardStep=${wizardStep}` : returnTo;
                    router.push(returnUrl);
                } else {
                    router.push('/templates');
                }
            } else {
                setError(result.error?.message || 'Failed to upload template');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Upload PDF Template
                </CardTitle>
                <CardDescription>
                    Upload a PDF certificate template. The PDF will be used as the base layer,
                    and dynamic fields will be overlaid on top without modifying the original design.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* File Upload */}
                        <FormField
                            control={form.control}
                            name="template"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PDF Template File</FormLabel>
                                    <FormControl>
                                        <FileUpload
                                            accept=".pdf,application/pdf"
                                            onFileSelect={(file) => field.onChange(file)}
                                            value={field.value}
                                            disabled={isLoading}
                                            maxSize={50 * 1024 * 1024}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Upload a high-quality PDF template. Vector graphics and fonts will be preserved.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Template Code */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Template Code *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., NAMD25"
                                            {...field}
                                            disabled={isLoading}
                                            maxLength={5}
                                            className="uppercase font-mono"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        1-5 character unique code used in certificate IDs
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Template Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Professional Certificate"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe this template..."
                                            {...field}
                                            disabled={isLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Info Box */}
                        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                            <strong>PDF-Based Approach:</strong> Your PDF will remain unmodified.
                            Dynamic text (name, date, etc.) will be overlaid using precise coordinates
                            that you can configure after upload.
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-2" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Template
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
