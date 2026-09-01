import { AppShell } from "@/components/app-shell";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth";
import { isMongoConfigured } from "@/lib/mongodb";
import { PRIVACY_COOKIE_NAME, privacyModeFromCookie } from "@/lib/privacy";
import { getAppData } from "@/lib/repository";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  const cookieStore = await cookies();
  const { settings } = await getAppData();
  const initialPrivacyMode = privacyModeFromCookie(
    cookieStore.get(PRIVACY_COOKIE_NAME)?.value,
  );

  return (
    <AppShell
      settings={settings}
      demoMode={!isMongoConfigured()}
      initialPrivacyMode={initialPrivacyMode}
    >
      {children}
    </AppShell>
  );
}
