import QRCode from "qrcode";
import { requireProfile } from "@/lib/auth";
import { buildVCard, permanentUrl } from "@/lib/vcard/build";
import { ShareActions } from "@/components/share/share-actions";

export default async function Page() {
  const { profile } = await requireProfile();
  const url = permanentUrl(profile.handle);
  // QR encodes the full vCard text (no photo), using the author's chosen fields.
  const vcard = buildVCard({
    displayName: profile.display_name,
    handle: profile.handle,
    phone: profile.contact_phone,
    email: profile.contact_email,
    shareContact: profile.share_contact,
  });
  const svg = await QRCode.toString(vcard, {
    type: "svg",
    errorCorrectionLevel: "L",
    margin: 4,
    width: 320,
  });
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Screen 10</p>
        <h1 className="text-2xl font-semibold">Share your testimony</h1>
        <p className="mt-2 text-gray-600">
          Scan this code with a phone camera to add you as a contact, with your testimony link
          included.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`QR code containing the contact card for ${profile.display_name}`}
        width={320}
        height={320}
        className="mx-auto rounded border bg-white"
      />
      <p className="text-center">
        Your permanent link: <a href={url} className="break-all underline">{url}</a>
      </p>
      <ShareActions url={url} handle={profile.handle} />
    </main>
  );
}
