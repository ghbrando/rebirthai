"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { HANDLE_REGEX, MEDIA_LIMITS, type Profile } from "@/lib/types";
import { checkHandle, saveProfile, type FormState } from "./actions";

const input =
  "h-11 w-full rounded-lg border px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2";

export function avatarUrl(path: string | null | undefined) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media-public/${path}`;
}

type Props = {
  mode: "create" | "update";
  userId: string;
  profile?: Profile;
};

export function ProfileForm({ mode, userId, profile }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const [name, setName] = useState(profile?.display_name ?? "");
  const [handle, setHandle] = useState(profile?.handle ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [church, setChurch] = useState(profile?.church ?? "");
  const [photoPath, setPhotoPath] = useState(profile?.photo_path ?? "");
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [share, setShare] = useState(profile?.share_contact ?? false);
  const [phone, setPhone] = useState(profile?.contact_phone ?? "");
  const [email, setEmail] = useState(profile?.contact_email ?? "");
  const [avail, setAvail] = useState<{ ok: boolean; msg: string } | null>(null);
  const reqId = useRef(0);

  const handleChanged = mode === "update" && handle !== profile?.handle;
  const formatOk = HANDLE_REGEX.test(handle);

  useEffect(() => {
    if (!handle) return;
    if (!formatOk) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const r = await checkHandle(handle);
        if (id === reqId.current)
          setAvail(r.available ? { ok: true, msg: "Handle is available." } : { ok: false, msg: r.reason ?? "Unavailable." });
      } catch {
        if (id === reqId.current) setAvail(null);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [handle, formatOk]);

  const handleMsg = !handle
    ? null
    : !formatOk
      ? { ok: false, msg: "Use 3-30 characters: lowercase letters, numbers, underscore." }
      : avail;

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoErr(null);
    const limits = MEDIA_LIMITS.image;
    if (!(limits.mimes as readonly string[]).includes(file.type)) return setPhotoErr("Use a JPEG, PNG or WebP image.");
    if (file.size > limits.maxBytes) return setPhotoErr("Image must be under 10 MB.");
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `avatars/${userId}/${Date.now()}.${ext}`;
    const { error } = await createClient().storage.from("media-public").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setPhotoErr("Photo upload failed. Please try again.");
    setPhotoPath(path);
  }

  const fe = state.fieldErrors ?? {};
  const photoSrc = avatarUrl(photoPath);
  const blocked = pending || uploading || (!!handleMsg && !handleMsg.ok);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
      <form action={action} className="space-y-5">
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="photo_path" value={photoPath} />

        <div>
          <label htmlFor="display_name" className="mb-1 block text-sm font-medium">Display name</label>
          <input id="display_name" name="display_name" required maxLength={100} value={name}
            onChange={(e) => setName(e.target.value)} className={input} aria-describedby="err-name" />
          <p id="err-name" role="alert" className="text-sm text-red-700">{fe.display_name}</p>
        </div>

        <div>
          <label htmlFor="handle" className="mb-1 block text-sm font-medium">Handle</label>
          <div className="flex items-center gap-1">
            <span aria-hidden className="text-gray-600">@</span>
            <input id="handle" name="handle" required value={handle} autoCapitalize="none" autoCorrect="off"
              spellCheck={false} maxLength={30}
              onChange={(e) => { setAvail(null); setHandle(e.target.value.toLowerCase()); }}
              className={input} aria-describedby="handle-help handle-msg" />
          </div>
          <p id="handle-help" className="text-xs text-gray-600">Your link: /u/{handle || "yourhandle"}. 3-30 letters, numbers or underscores.</p>
          <p id="handle-msg" role="status" className={`text-sm ${(fe.handle || (handleMsg && !handleMsg.ok)) ? "text-red-700" : "text-green-800"}`}>
            {fe.handle ?? handleMsg?.msg}
          </p>
          {handleChanged && (
            <p className="mt-1 rounded-lg border border-amber-600 bg-amber-50 p-2 text-sm text-amber-900">
              Changing your handle: your old link will keep redirecting to your new one forever, and the old handle can never be used by anyone else.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="photo" className="mb-1 block text-sm font-medium">Photo (optional)</label>
          <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} className="block w-full text-sm" />
          {uploading && <p role="status" className="text-sm">Uploading...</p>}
          <p role="alert" className="text-sm text-red-700">{photoErr ?? fe.photo}</p>
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium">Short bio (optional)</label>
          <textarea id="bio" name="bio" rows={3} maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-lg border p-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2" />
        </div>

        <div>
          <label htmlFor="church" className="mb-1 block text-sm font-medium">Church (optional)</label>
          <input id="church" name="church" maxLength={120} value={church} onChange={(e) => setChurch(e.target.value)} className={input} />
        </div>

        {mode === "update" && (
          <fieldset className="space-y-3 rounded-lg border p-4">
            <legend className="px-1 text-sm font-medium">Contact card (optional)</legend>
            <p className="text-sm text-gray-700">Nothing is shared unless you enter it and turn sharing on.</p>
            <div>
              <label htmlFor="contact_phone" className="mb-1 block text-sm font-medium">Phone</label>
              <input id="contact_phone" name="contact_phone" type="tel" autoComplete="tel" value={phone}
                onChange={(e) => setPhone(e.target.value)} className={input} />
              <p role="alert" className="text-sm text-red-700">{fe.contact_phone}</p>
            </div>
            <div>
              <label htmlFor="contact_email" className="mb-1 block text-sm font-medium">Contact email</label>
              <input id="contact_email" name="contact_email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} className={input} />
              <p role="alert" className="text-sm text-red-700">{fe.contact_email}</p>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="share_contact" checked={share} onChange={(e) => setShare(e.target.checked)}
                className="mt-1 size-5" />
              <span>Show my phone/email on my public page so readers can add me to their contacts.</span>
            </label>
          </fieldset>
        )}

        <p role="alert" className="text-sm text-red-700">{state.error}</p>
        {state.saved && <p role="status" className="text-sm text-green-800">Saved.</p>}
        <Button type="submit" size="lg" className="h-11 w-full" disabled={blocked}>
          {pending ? "Saving..." : mode === "create" ? "Save and continue" : "Save changes"}
        </Button>
      </form>

      <aside aria-label="Profile preview" className="h-fit rounded-xl border p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-gray-600">Preview</p>
        <div className="flex items-center gap-3">
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div aria-hidden className="flex size-16 items-center justify-center rounded-full bg-gray-200 text-xl">
              {(name[0] ?? "?").toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold">{name || "Your name"}</p>
            <p className="text-sm text-gray-600">@{handle || "handle"}</p>
          </div>
        </div>
        {bio && <p className="mt-3 text-sm">{bio}</p>}
        {church && <p className="mt-2 text-sm text-gray-600">{church}</p>}
      </aside>
    </div>
  );
}
