"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const dest = sessionStorage.getItem("postLoginRedirect") || "/dashboard";
    sessionStorage.removeItem("postLoginRedirect");
    router.replace(dest);
  }, [router]);

  return <p style={{ padding: 24 }}>Redirigiendo…</p>;
}
