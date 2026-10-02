"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientApp } from "@/lib/firebase/client";
import { Logo } from "@/components/ui/Logo";

export function AuthGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getAuth(getFirebaseClientApp());
      unsubscribe = onAuthStateChanged(auth, user => {
        if (!active) return;
        if (user) setAuthenticated(true);
        else router.replace("/sign-in");
      }, () => { if (active) router.replace("/sign-in"); });
    } catch {
      queueMicrotask(() => { if (active) router.replace("/sign-in"); });
    }
    return () => { active = false; unsubscribe?.(); };
  }, [router]);

  if (!authenticated) return <main className="auth-gate" role="status" aria-label="Checking sign-in"><Logo /><span className="auth-gate-line" /></main>;
  return children;
}
