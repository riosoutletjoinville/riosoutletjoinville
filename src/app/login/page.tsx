// app/dashboard/cores/page.tsx
import { Suspense } from "react";
import { LoginPageContent } from "./LoginPageContent";
import { Loader2 } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Loader2 className="animate-spin h-10 w-10 text-white" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}