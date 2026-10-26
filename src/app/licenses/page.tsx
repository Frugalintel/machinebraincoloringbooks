import { Scale } from "lucide-react";
import { pageH1Style } from "@/lib/h1-fit";

export default function LicensesPage() {
  return (
    <main id="main" className="shell-doc-main">
      <p className="mono shell-kicker text-signal">
        <Scale size={14} aria-hidden="true" />
        <span>Legal</span>
      </p>
      <h1 className="shell-h font-display" style={pageH1Style(["Licenses"])}>
        Licenses
      </h1>
      <p className="shell-sub">Third-party software and asset licenses.</p>
      <div className="shell-body">
        <p>Content coming soon.</p>
      </div>
    </main>
  );
}
