"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to app (no auth required)
    router.push("/app");
  }, [router]);

  return null;
}
