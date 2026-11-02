import type { TakedownNotice as Notice } from "@/lib/takedown";

/** Shown to an author whose page the operator took down (#27). Server component; pass takedownNotice(t). */
export function TakedownNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-700 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-semibold">{notice.message}</p>
      <p className="mt-2">
        Reason: <span>{notice.reason}</span>
      </p>
      {notice.contactEmail && (
        <p className="mt-2">
          To talk with the operator, write to{" "}
          <a className="underline" href={`mailto:${notice.contactEmail}`}>
            {notice.contactEmail}
          </a>
          .
        </p>
      )}
    </div>
  );
}
