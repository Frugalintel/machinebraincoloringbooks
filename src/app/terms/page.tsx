import { FileText } from "lucide-react";
import { pageH1Style } from "@/lib/h1-fit";

export default function TermsPage() {
  return (
    <main id="main" className="shell-doc-main">
      <p className="mono shell-kicker text-signal">
        <FileText size={14} aria-hidden="true" />
        <span>Legal</span>
      </p>
      <h1
        className="shell-h font-display"
        style={pageH1Style(["Terms of Service"])}
      >
        Terms of Service
      </h1>
      <p className="shell-sub">The terms for using Machine Brain.</p>
      <div className="shell-body">
        <p>Content coming soon.</p>
      </div>
    </main>
  );
}
