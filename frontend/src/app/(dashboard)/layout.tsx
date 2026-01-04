import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageTitleProvider } from "@/components/providers/page-title-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageTitleProvider>
            <SidebarProvider>
                <DashboardShell>
                    {children}
                </DashboardShell>
            </SidebarProvider>
        </PageTitleProvider>
    );
}
