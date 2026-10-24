import { PageStub } from "@/components/page-stub";

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <PageStub screen={13} title={`Testimony: @${handle}`} note="Screen 14 (Save contact) is a button on this page." />;
}
