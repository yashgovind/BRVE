"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { Logo } from "@/components/ui/Logo";
import { getFirebaseClientApp } from "@/lib/firebase/client";
import { heroCopy } from "@/content/hero";
import { isValidEmailAddress, normalizePhoneNumber } from "@/lib/auth-validation";

type Method = "email" | "phone";
type EmailMode = "signin" | "create";

function authError(error: unknown) {
  const code = (error as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "That email and password combination was not recognized.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/email-already-in-use": "An account already uses this email. Sign in instead.",
    "auth/weak-password": "Choose a password with at least six characters.",
    "auth/too-many-requests": "Too many attempts. Wait a moment, then try again.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase yet.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/unauthorized-domain": "This domain must be added in Firebase Authentication → Settings → Authorized domains.",
    "auth/captcha-check-failed": "The reCAPTCHA check did not pass. Try again.",
    "auth/invalid-phone-number": "Enter a valid phone number in international format, including + and country code.",
    "auth/quota-exceeded": "The SMS limit has been reached. Try again later.",
    "auth/invalid-verification-code": "That verification code did not match. Check it and try again.",
    "auth/code-expired": "That verification code has expired. Request a new one.",
    "auth/account-exists-with-different-credential": "This email already uses another sign-in method. Try that method instead.",
  };
  return code ? messages[code] || "Sign-in could not complete. Please try again." : "Sign-in could not complete. Check your connection and try again.";
}

export function SignInMethods() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("email");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [phoneConsent, setPhoneConsent] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isLocalPreview, setIsLocalPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"status" | "error">("status");
  const captchaContainer = useRef<HTMLDivElement>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const emailError = emailTouched && email.trim() && !isValidEmailAddress(email) ? "Enter a valid email address, such as name@example.com." : "";
  const normalizedPhone = normalizePhoneNumber(phone);
  const phoneError = phoneTouched && phone.trim() && !normalizedPhone ? "Use +, a country code, and 8–15 digits, such as +14155552671." : "";

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    try {
      const auth = getAuth(getFirebaseClientApp());
      setIsLocalPreview(window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
      auth.languageCode = "en";
      void setPersistence(auth, browserLocalPersistence).then(async () => {
        try { await getRedirectResult(auth); }
        catch (error) { if (mounted) { setMessage(authError(error)); setMessageKind("error"); } }
        if (!mounted) return;
        unsubscribe = onAuthStateChanged(auth, current => {
          setUser(current); setReady(true);
          if (current) router.replace("/");
        }, error => {
          setMessage(authError(error)); setMessageKind("error"); setReady(true);
        });
      }).catch(error => {
        if (mounted) { setMessage(authError(error)); setMessageKind("error"); setReady(true); }
      });
    } catch (error) {
      queueMicrotask(() => { if (mounted) { setMessage(authError(error)); setMessageKind("error"); setReady(true); } });
    }
    return () => { mounted = false; unsubscribe?.(); verifier.current?.clear(); verifier.current = null; };
  }, [router]);

  useEffect(() => {
    if (method === "phone") return;
    verifier.current?.clear();
    verifier.current = null;
    setConfirmation(null);
    setVerificationCode("");
    setPhoneConsent(false);
  }, [method]);

  function report(error: unknown) {
    setMessage(authError(error));
    setMessageKind("error");
  }

  async function googleSignIn() {
    setBusy(true); setMessage("");
    try {
      const auth = getAuth(getFirebaseClientApp());
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      if (window.matchMedia("(max-width: 820px)").matches) await signInWithRedirect(auth, provider);
      else await signInWithPopup(auth, provider);
    } catch (error) { report(error); setBusy(false); }
  }

  async function emailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setEmailTouched(true); setMessage("");
    if (!isValidEmailAddress(email)) {
      setMessage("Enter a valid email address, such as name@example.com.");
      setMessageKind("error");
      return;
    }
    setBusy(true);
    try {
      const auth = getAuth(getFirebaseClientApp());
      if (emailMode === "create") await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }

  async function resetPassword() {
    setEmailTouched(true);
    if (!isValidEmailAddress(email)) {
      setMessage(email.trim() ? "Enter a valid email address before requesting a reset." : "Enter your email address above, then choose reset password.");
      setMessageKind("error");
      return;
    }
    setBusy(true); setMessage("");
    try {
      await sendPasswordResetEmail(getAuth(getFirebaseClientApp()), email.trim());
      setMessage("If an account uses that address, a password reset email is on its way.");
      setMessageKind("status");
    } catch (error) { report(error); }
    finally { setBusy(false); }
  }

  async function sendPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPhoneTouched(true); setMessage("");
    if (!normalizedPhone) {
      setMessage("Use +, a country code, and 8–15 digits, such as +14155552671.");
      setMessageKind("error");
      return;
    }
    setBusy(true);
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      setMessage("Firebase phone verification needs a hosted, authorized domain. It cannot send SMS from localhost.");
      setMessageKind("error"); setBusy(false); return;
    }
    try {
      const auth = getAuth(getFirebaseClientApp());
      if (!captchaContainer.current) throw new Error("The verification check is not ready. Reload the page and try again.");
      if (!verifier.current) verifier.current = new RecaptchaVerifier(auth, captchaContainer.current, { size: "normal" });
      await verifier.current.render();
      const result = await signInWithPhoneNumber(auth, normalizedPhone, verifier.current);
      setConfirmation(result);
      setMessage("Verification code sent. Enter the code from your SMS.");
      setMessageKind("status");
    } catch (error) {
      verifier.current?.clear(); verifier.current = null;
      report(error);
    } finally { setBusy(false); }
  }

  async function confirmPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmation) return;
    setBusy(true); setMessage("");
    try { await confirmation.confirm(verificationCode.trim()); }
    catch (error) { report(error); }
    finally { setBusy(false); }
  }

  async function logout() {
    setBusy(true); setMessage("");
    try { await signOut(getAuth(getFirebaseClientApp())); }
    catch (error) { report(error); }
    finally { setBusy(false); }
  }

  function switchMethod(next: Method) {
    setMessage(""); setMethod(next);
  }

  return <div className="signin-page">
    <header className="signin-header"><Link href="/" aria-label="BRVE.AI home"><Logo /></Link><Link href="/" className="signin-back">back to BRVE.AI <span aria-hidden="true">↗</span></Link></header>
    <main className="signin-main">
      <div className="signin-art" aria-hidden="true"><span className="eyebrow">ideas • ai • impact</span><h1>{heroCopy[1].fix}</h1><span className="signin-art-word">BRVE</span><span className="signin-art-line" /></div>
      <section className="signin-panel" aria-labelledby="signin-title">
        <div className="signin-heading"><span className="eyebrow">BRVE.AI</span><h2 id="signin-title">Sign in</h2><p>Choose how you’d like to sign in.</p></div>
        {user ? <div className="signin-success"><span className="signin-user-mark" aria-hidden="true">{(user.displayName || user.email || user.phoneNumber || "B").slice(0, 1).toUpperCase()}</span><p>Signed in as <strong>{user.displayName || user.email || user.phoneNumber}</strong></p><Link className="signin-primary" href="/">Return to BRVE.AI <span aria-hidden="true">↗</span></Link><button type="button" className="signin-text-button" disabled={busy} onClick={() => void logout()}>{busy ? "Signing out…" : "Sign out"}</button></div> : <>
          <button type="button" className="signin-google" disabled={!ready || busy} onClick={() => void googleSignIn()}><span className="signin-google-mark" aria-hidden="true">G</span>{busy ? "Connecting…" : "Continue with Google"}</button>
          <div className="signin-divider"><span>or use another method</span></div>
          <div className="signin-tabs" role="tablist" aria-label="Sign-in method">
            <button type="button" role="tab" aria-selected={method === "email"} aria-controls="email-panel" onClick={() => switchMethod("email")}>Email</button>
            <button type="button" role="tab" aria-selected={method === "phone"} aria-controls="phone-panel" onClick={() => switchMethod("phone")}>Phone number</button>
          </div>
          {method === "email" ? <div id="email-panel" role="tabpanel" aria-label="Email sign-in">
            <form className="signin-form" onSubmit={event => void emailSubmit(event)}>
              <label>Email address<input type="email" name="email" autoComplete="email" required maxLength={254} aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-validation" : undefined} value={email} onBlur={() => setEmailTouched(true)} onChange={event => { setEmail(event.target.value); setMessage(""); }} />{emailError && <span className="signin-field-error" id="email-validation" role="alert">{emailError}</span>}</label>
              <label>Password<input type="password" name="password" autoComplete={emailMode === "create" ? "new-password" : "current-password"} minLength={emailMode === "create" ? 6 : undefined} required value={password} onChange={event => setPassword(event.target.value)} /></label>
              <button type="submit" className="signin-primary" disabled={!ready || busy}>{busy ? "Please wait…" : emailMode === "create" ? "Create account" : "Sign in with email"}</button>
            </form>
            <div className="signin-form-links"><button type="button" className="signin-text-button" onClick={() => { setEmailMode(emailMode === "signin" ? "create" : "signin"); setMessage(""); }}>{emailMode === "create" ? "Already have an account? Sign in" : "Create an account"}</button>{emailMode === "signin" && <button type="button" className="signin-text-button" disabled={busy} onClick={() => void resetPassword()}>Reset password</button>}</div>
          </div> : <div id="phone-panel" role="tabpanel" aria-label="Phone sign-in">
            <form className="signin-form" onSubmit={confirmation ? event => void confirmPhoneCode(event) : event => void sendPhoneCode(event)}>
              {!confirmation ? <>
                <label>Phone number<input type="tel" name="tel" autoComplete="tel" inputMode="tel" placeholder="+1 555 010 1234" required maxLength={25} aria-invalid={Boolean(phoneError)} aria-describedby={phoneError ? "phone-validation" : "phone-help"} value={phone} onBlur={() => setPhoneTouched(true)} onChange={event => { setPhone(event.target.value); setMessage(""); }} />{phoneError && <span className="signin-field-error" id="phone-validation" role="alert">{phoneError}</span>}</label>
                <p className="signin-help" id="phone-help">Include + and the country code. Spaces, parentheses and hyphens are okay.</p>
                <label className="signin-consent"><input type="checkbox" required checked={phoneConsent} onChange={event => setPhoneConsent(event.target.checked)} /><span>I agree to receive an SMS verification code. Google may process my phone number for account security; standard message rates may apply.</span></label>
                <div className="signin-captcha" ref={captchaContainer} />
                {isLocalPreview && <p className="signin-help signin-local-help">SMS sign-in becomes available on the deployed, Firebase-authorized domain.</p>}
                <button type="submit" className="signin-primary" disabled={!ready || busy || !phoneConsent || isLocalPreview}>{busy ? "Sending code…" : "Send verification code"}</button>
              </> : <>
                <label>Verification code<input type="text" name="one-time-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={verificationCode} onChange={event => setVerificationCode(event.target.value)} /></label>
                <p className="signin-help">Code sent to {phone}.</p>
                <button type="submit" className="signin-primary" disabled={!ready || busy}>{busy ? "Verifying…" : "Verify and sign in"}</button>
                <button type="button" className="signin-text-button" onClick={() => { setConfirmation(null); setVerificationCode(""); setMessage(""); }}>Use a different number</button>
              </>}
            </form>
          </div>}
          {message && <p className={`signin-message ${messageKind === "error" ? "is-error" : ""}`} role={messageKind === "error" ? "alert" : "status"}>{message}</p>}
        </>}
      </section>
    </main>
  </div>;
}
