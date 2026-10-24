"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignInForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError("We couldn't send the link. Check the email address and try again.");
      setStatus("idle");
    } else setStatus("sent");
  }

  async function google() {
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) setError("Google sign-in is unavailable right now.");
  }

  if (status === "sent") {
    return (
      <p role="status" className="rounded-lg border p-4 text-sm">
        Check your email. We sent a sign-in link to <strong>{email}</strong>.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={magicLink} className="space-y-3">
        <label htmlFor="email" className="block text-sm font-medium">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-lg border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2"
        />
        <Button type="submit" size="lg" className="h-11 w-full" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Email me a sign-in link"}
        </Button>
      </form>
      <div className="text-center text-xs text-gray-600">or</div>
      <Button type="button" variant="outline" size="lg" className="h-11 w-full" onClick={google}>
        Continue with Google
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
