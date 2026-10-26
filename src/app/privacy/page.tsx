import { Shield } from "lucide-react";
import { pageH1Style } from "@/lib/h1-fit";

export default function PrivacyPage() {
  return (
    <main id="main" className="shell-doc-main">
      <p className="mono shell-kicker text-signal">
        <Shield size={14} aria-hidden="true" />
        <span>Legal</span>
      </p>
      <h1
        className="shell-h font-display"
        style={pageH1Style(["Privacy Policy"])}
      >
        Privacy Policy
      </h1>
      <p className="shell-sub">How your data is handled and kept safe.</p>
      <div className="shell-body">
        <p>Content coming soon.</p>
      </div>
    </main>
  );
}
