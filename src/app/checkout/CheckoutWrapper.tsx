// src/app/checkout/CheckoutWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { CheckoutSkeleton } from "@/components/checkout/CheckoutSkeleton";
import CheckoutPageContent from "./CheckoutPageContent";

export default function CheckoutWrapper() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <CheckoutSkeleton />;
  }

  return <CheckoutPageContent />;
}