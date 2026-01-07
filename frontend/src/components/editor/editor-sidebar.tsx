'use client';

import {
    LayoutTemplate,
    Image as ImageIcon,
    Shapes,
    Type,
    QrCode,
    Layers,
    Braces
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type EditorTab = 'templates' | 'images' | 'elements' | 'text' | 'attributes' | 'qr' | 'layers';

interface EditorSidebarProps {
    activeTab: EditorTab | null;
    onTabChange: (tab: EditorTab) => void;
}

const NAV_ITEMS: { id: EditorTab; label: string; icon: React.ElementType }[] = [
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'elements', label: 'Elements', icon: Shapes },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'attributes', label: 'Attributes', icon: Braces },
    { id: 'qr', label: 'QR Codes', icon: QrCode },
    { id: 'layers', label: 'Layers', icon: Layers },
];

export function EditorSidebar({ activeTab, onTabChange }: EditorSidebarProps) {
    return (
        <aside className="flex h-full w-[72px] flex-col items-center border-r bg-background py-4 z-20">
            <TooltipProvider>
                <div className="flex flex-col gap-4 w-full px-2">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <Tooltip key={item.id} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn(
                                            "h-14 w-14 flex-col gap-1 rounded-xl transition-all duration-200",
                                            isActive
                                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400"
                                                : "text-muted-foreground hover:bg-muted"
                                        )}
                                        onClick={() => onTabChange(item.id)}
                                    >
                                        <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5px]")} />
                                        <span className="text-[10px] font-medium">{item.label}</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="ml-2 font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>
            </TooltipProvider>
        </aside>
    );
}
