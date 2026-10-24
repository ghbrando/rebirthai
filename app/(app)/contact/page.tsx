import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { permanentUrl } from "@/lib/vcard/build";
import { ContactFieldsForm } from "@/components/share/contact-fields-form";

export default async function Page() {
  const { profile } = await requireProfile();
  const url = permanentUrl(profile.handle);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <p className="text-sm text-gray-500">Screen 9</p>
        <h1 className="text-2xl font-semibold">Add to my contact info</h1>
        <p className="mt-2 text-gray-600">
          Put your testimony link on your own contact card so anyone you hand your phone to, or
          who looks you up, can find it. Your link is permanent:{" "}
          <code className="break-all">{url}</code>
        </p>
      </div>

      <ContactFieldsForm
        displayName={profile.display_name}
        phone={profile.contact_phone}
        email={profile.contact_email}
      />

      <a
        href={`/api/vcard/${profile.handle}`}
        download={`${profile.handle}.vcf`}
        className="inline-block rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Download contact card (.vcf)
      </a>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Step-by-step</h2>
        <details className="rounded-lg border p-4" open>
          <summary className="cursor-pointer font-medium">iPhone</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Open Contacts and tap <strong>My Card</strong> at the top.</li>
            <li>Tap <strong>Edit</strong>, then <strong>add url</strong>.</li>
            <li>
              Label it <strong>homepage</strong> and paste <code className="break-all">{url}</code>.
            </li>
            <li>Tap <strong>Done</strong>.</li>
          </ol>
          <p className="mt-2 text-sm text-gray-600">
            Or: tap the downloaded .vcf file and choose <strong>Add Contact</strong>.
          </p>
        </details>
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">Android</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Open Contacts and tap your profile (<strong>Me</strong> / <strong>Your profile</strong>).</li>
            <li>Tap <strong>Edit</strong>.</li>
            <li>
              Add a <strong>Website</strong> field and paste <code className="break-all">{url}</code>.
            </li>
            <li>Tap <strong>Save</strong>.</li>
          </ol>
          <p className="mt-2 text-sm text-gray-600">
            Or: open the downloaded .vcf file to import it.
          </p>
        </details>
      </section>

      <Link href="/share" className="inline-block rounded bg-black px-4 py-2 text-white">
        Next: share your link
      </Link>
    </main>
  );
}
