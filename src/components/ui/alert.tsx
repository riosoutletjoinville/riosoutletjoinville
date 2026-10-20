// src/components/ui/alert.tsx
import { cn } from "@/lib/utils"

interface AlertProps {
  variant?: "default" | "destructive"
  className?: string
  children: React.ReactNode
}

export function Alert({ variant = "default", className, children }: AlertProps) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border p-4",
        variant === "destructive"
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-blue-200 bg-blue-50 text-blue-800",
        className
      )}
    >
      {children}
    </div>
  )
}

export function AlertDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("text-sm", className)}>
      {children}
    </div>
  )
}