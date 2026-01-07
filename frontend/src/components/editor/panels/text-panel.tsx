'use client';

import { Type, ArrowRight, Heading1, Heading2, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TextPanelProps {
    onAddText: (type: 'heading' | 'subheading' | 'body') => void;
}

export function TextPanel({ onAddText }: TextPanelProps) {
    return (
        <div className="flex h-full flex-col bg-background">
            <div className="p-4 border-b">
                <h3 className="text-sm font-semibold mb-1">Add to your design</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    <Button
                        variant="outline"
                        className="w-full h-14 justify-start px-4 text-left font-bold text-2xl hover:bg-slate-100 hover:text-slate-900 transition-colors border-l-4 border-l-primary/50"
                        onClick={() => onAddText('heading')}
                    >
                        <Heading1 className="mr-3 h-6 w-6 text-primary" />
                        Add a heading
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-12 justify-start px-4 text-left font-semibold text-lg hover:bg-slate-100 hover:text-slate-900 transition-colors border-l-4 border-l-primary/30"
                        onClick={() => onAddText('subheading')}
                    >
                        <Heading2 className="mr-3 h-5 w-5 text-primary/80" />
                        Add a subheading
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-10 justify-start px-4 text-left font-normal text-sm hover:bg-slate-100 hover:text-slate-900 transition-colors border-l-4 border-l-primary/10"
                        onClick={() => onAddText('body')}
                    >
                        <AlignLeft className="mr-3 h-4 w-4 text-primary/60" />
                        Add body text
                    </Button>
                </div>

                {/* Font Combinations or presets could go here in future */}
                <div className="mt-8">
                    <div className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                        Font Combinations
                    </div>
                    {/* Placeholder for font combos */}
                    <div className="p-4 border rounded-lg bg-muted/20 text-center text-xs text-muted-foreground">
                        More font styles coming soon...
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
