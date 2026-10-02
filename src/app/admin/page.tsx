import type { Metadata } from "next";
import { AdminPanel } from "@/components/admin/AdminPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "BRVE — Private admin", robots: { index: false, follow: false }, alternates: { canonical: "/admin" } };

export default function AdminPage() {
  return <AdminPanel />;
}
