import { WalletCards } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = params.next || "/dashboard";
  const errorMessage =
    params.error === "rate_limited"
      ? "Troppi tentativi. Riprova tra qualche minuto."
      : "Credenziali non valide.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30rem),#020617] px-4 py-10 text-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300 text-slate-950">
            <WalletCards className="h-5 w-5" aria-hidden />
          </div>
          <CardTitle>Spese Tracker</CardTitle>
          <CardDescription>Accedi con le credenziali condivise.</CardDescription>
        </CardHeader>
        <CardContent>
          {params.error ? (
            <div className="mb-4 rounded-md border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
              {errorMessage}
            </div>
          ) : null}
          <form action={loginAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Entra
            </Button>
          </form>
          {!process.env.APP_PASSWORD_HASH ? (
            <p className="mt-4 text-xs text-slate-500">
              In locale, senza APP_PASSWORD_HASH, usa admin / password.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
