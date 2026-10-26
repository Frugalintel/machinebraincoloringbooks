/** Running head: plate number, section, and a note (hidden from AT). */
export function RunningHead({ items }: { items: readonly (string | null)[] }) {
  const visible = items.filter((item): item is string => Boolean(item));
  return (
    <div className="rh mono" aria-hidden="true">
      {visible.map((item) => (
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
