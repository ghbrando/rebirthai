export function PageStub({ screen, title, note }: { screen: number; title: string; note?: string }) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="text-sm text-gray-500">Screen {screen}</p>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {note && <p className="mt-2 text-gray-600">{note}</p>}
    </main>
  );
}
