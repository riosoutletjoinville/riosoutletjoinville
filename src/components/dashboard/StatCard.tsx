// components/dashboard/StatCard.tsx
"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, AlertCircle, TrendingDown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  href: string;
  description: string;
  trend: "positive" | "warning" | "negative" | "neutral";
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  href,
  description,
  trend
}: StatCardProps) {
  return (
    <Link href={href} className="block group">
      <div className={`
        ${bgColor} ${borderColor}
        border rounded-xl p-5 transition-all duration-200 
        group-hover:shadow-lg group-hover:scale-105
        h-full flex flex-col justify-between
        backdrop-blur-sm
      `}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className={`text-2xl font-bold ${color} mb-2`}>
              {value}
            </p>
          </div>
          <div className={`
            p-2 rounded-lg bg-background/50
            group-hover:scale-110 transition-transform
          `}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {description}
          </span>
          <div className="flex items-center space-x-1">
            {trend === "positive" && (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            )}
            {trend === "warning" && (
              <AlertCircle className="h-3 w-3 text-yellow-500" />
            )}
            {trend === "negative" && (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
          </div>
        </div>
      </div>
    </Link>
  );
}