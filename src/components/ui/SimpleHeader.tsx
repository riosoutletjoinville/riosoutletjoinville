// src/components/ui/SimpleHeader.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

interface SimpleHeaderProps {
  showBackButton?: boolean;
  backUrl?: string;
  showLogo?: boolean;
  title?: string;
}

export default function SimpleHeader({ 
  showBackButton = true, 
  backUrl = "/",
  showLogo = true,
  title 
}: SimpleHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">

          {showLogo && (
            <Link href="/">
              <div className="relative w-32 h-12">
                <Image
                  src="/logomarca/logo.png"
                  alt="Rios Outlet"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
          )}

          {title && (
            <h1 className="text-lg font-semibold text-gray-900 ml-auto">
              {title}
            </h1>
          )}
        </div>
      </div>
    </div>
  );
}