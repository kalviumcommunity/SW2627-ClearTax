import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getSafeRedirectPath } from "@/lib/auth-redirect";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  const { next } = await searchParams;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div>
          <p className="text-sm font-semibold text-primary">ClearTax</p>
          <h1 className="mt-3 text-2xl font-semibold text-foreground">
            Sign in to reconciliation
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Use your seeded demo account to access the workspace.
          </p>
        </div>

        <LoginForm nextPath={getSafeRedirectPath(next ?? null)} />
      </div>
    </main>
  );
}
