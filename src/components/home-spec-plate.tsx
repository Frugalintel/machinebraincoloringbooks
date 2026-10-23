import { HOME_SPEC_PLATE } from "@/lib/home";
import { cn } from "@/lib/utils";

/** The L3 cover plate as live HTML: 2 px cream outline, 1 px inner rules. */
export function HomeSpecPlate({ className }: { className?: string }) {
  return (
    <table
      data-testid="spec-plate"
      className={cn(
        "w-full border-collapse border-2 border-cream font-mono text-cream",
        className,
      )}
    >
      <caption className="font-label mb-2 caption-top text-left text-fg-secondary">
        {HOME_SPEC_PLATE.caption}
      </caption>
      <tbody>
        {HOME_SPEC_PLATE.rows.map((row) => (
          <tr
            key={row.label}
            className="border-t border-cream first:border-t-0"
          >
            <th
              scope="row"
              className="font-label w-[6.5rem] border-r border-cream px-3 py-2.5 text-left align-top text-cream"
            >
              {row.label}
            </th>
            <td className="px-3 py-2.5 text-[12px] uppercase leading-snug tracking-[0.06em] md:text-[13px]">
              [{row.value}]
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
