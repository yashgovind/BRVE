import type { Metadata } from "next";
import { SignInMethods } from "@/components/auth/SignInMethods";

export const metadata: Metadata = {
  title: "Sign in | BRVE.AI",
  description: "Sign in to BRVE.AI.",
  alternates: { canonical: "/sign-in" },
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return <SignInMethods />;
}
