"use client";

import { useActionState, useState } from "react";
import { saveContactFields, type ContactState } from "@/app/(app)/contact/actions";

const initial: ContactState = { ok: false, message: "" };

export function ContactFieldsForm(props: {
  displayName: string;
  phone: string | null;
  email: string | null;
}) {
  const [state, action, pending] = useActionState(saveContactFields, initial);
  const [incPhone, setIncPhone] = useState(!!props.phone);
  const [incEmail, setIncEmail] = useState(!!props.email);

  return (
    <form action={action} className="space-y-4 rounded-lg border p-4">
      <h2 className="font-medium">What goes on your card</h2>
      <p className="text-sm">
        <strong>Name</strong> (always included): {props.displayName}
      </p>
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="includePhone"
            checked={incPhone}
            onChange={(e) => setIncPhone(e.target.checked)}
          />
          Include my phone number
        </label>
        {incPhone && (
          <input
            name="phone"
            type="tel"
            defaultValue={props.phone ?? ""}
            placeholder="+1 555 123 4567"
            aria-label="Phone number"
            className="w-full rounded border px-2 py-1 text-sm"
          />
        )}
      </div>
      <div className="space-y-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="includeEmail"
            checked={incEmail}
            onChange={(e) => setIncEmail(e.target.checked)}
          />
          Include my email
        </label>
        {incEmail && (
          <input
            name="email"
            type="email"
            defaultValue={props.email ?? ""}
            placeholder="you@example.com"
            aria-label="Email"
            className="w-full rounded border px-2 py-1 text-sm"
          />
        )}
      </div>
      <p className="text-xs text-gray-500">
        Phone and email are only shared if you turn them on, and also appear on your public
        &quot;Save contact&quot; card. No photo is ever included.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      {state.message && (
        <p role="status" className={state.ok ? "text-sm text-green-700" : "text-sm text-red-700"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
