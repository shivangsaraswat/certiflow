import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageTitleProvider } from "@/components/providers/page-title-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <PageTitleProvider>
            <DashboardShell>
                {children}
            </DashboardShell>
        </PageTitleProvider>
    );
}
