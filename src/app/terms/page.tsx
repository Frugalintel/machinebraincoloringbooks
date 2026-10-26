import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="shell-doc-main">
      <p className="mono shell-kicker text-signal">
        <FileText size={14} aria-hidden="true" />
        <span>Legal</span>
      </p>
      <h1 className="shell-h font-display">Terms of Service</h1>
      <p className="shell-sub">The terms for using Machine Brain.</p>
      <div className="shell-body">
        <p>Content coming soon.</p>
      </div>
    </main>
  );
}
