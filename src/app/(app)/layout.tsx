import { AppShell } from "@/components/app-shell";
import { requireSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { getAppData } from "@/lib/repository";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  const { settings } = await getAppData();

  return (
    <AppShell settings={settings} demoMode={!isMongoConfigured()}>
      {children}
    </AppShell>
  );
}
