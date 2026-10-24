/** Running head: plate number, section, and a note (hidden from AT). */
export function RunningHead({
  items,
}: {
  items: readonly [string, string, string];
}) {
  return (
    <div className="rh mono" aria-hidden="true">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

export function Folio({ number }: { number: string }) {
  return (
    <p className="folio mono" aria-hidden="true">
      {number}
    </p>
  );
}
