// app/dashboard/page.tsx
import { Suspense } from "react";
import DashboardPageContent from "./DashboardPageContent";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <DashboardPageContent />
    </Suspense>
  );
}