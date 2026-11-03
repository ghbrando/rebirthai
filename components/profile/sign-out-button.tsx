"use client";

import { signOut } from "@/components/profile/actions";
import { clearTusStorage } from "@/lib/media/resumable";
import { Button } from "@/components/ui/button";

/** Sign out, first clearing resumable-upload entries this browser kept (#13). */
export function SignOutButton() {
  return (
    <form action={signOut} onSubmit={() => clearTusStorage()}>
      <Button type="submit" variant="outline" size="lg" className="h-11">Sign out</Button>
    </form>
  );
}
