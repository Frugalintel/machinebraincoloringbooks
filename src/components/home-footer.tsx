import Image from "next/image";
import Link from "next/link";
import { AccountFooterLinks } from "@/components/account-footer-links";
import { Mark } from "@/components/mark";
import { HOME_ART, HOME_FOOTER_COPY } from "@/lib/home";
import { SITE_SOCIAL_LINKS } from "@/lib/site-shell";

/**
 * Home's own footer plate. Follow renders only once real channels exist in
 * SITE_SOCIAL_LINKS; the newsletter form is a preview-only SAMPLE.
 */
export function HomeFooter({ samples }: { samples: boolean }) {
  const year = new Date().getFullYear();
  const { newsletter } = HOME_FOOTER_COPY;

  return (
    <footer className="ft">
      <div className="fplate">
        <Image
          src={HOME_ART.lineCream.src}
          width={HOME_ART.lineCream.width}
          height={HOME_ART.lineCream.height}
          alt=""
          unoptimized
        />
        <p className="say">
          {HOME_FOOTER_COPY.lines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <Link className="flock" href="/" aria-label="Machine Brain">
          <Mark size={56} ink="cream" decorative />
          <span className="mono">Machine Brain</span>
        </Link>
      </div>
      <div className="fin">
        <div className="cols">
          {HOME_FOOTER_COPY.groups.map((group) =>
            group.heading === "Account" ? (
              <AccountFooterLinks key={group.heading} variant="home" />
            ) : (
              <nav key={group.heading} aria-label={group.heading}>
                <p className="h mono">{group.heading}</p>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ),
          )}
          {SITE_SOCIAL_LINKS.length > 0 ? (
            <nav aria-label="Follow">
              <p className="h mono">Follow</p>
              <ul>
                {SITE_SOCIAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} rel="noreferrer" target="_blank">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
          {samples ? (
            <div
              className="news"
              role="group"
              aria-label="Newsletter (sample, not connected)"
            >
              <p className="h mono">
                <label htmlFor="home-newsletter">{newsletter.label}</label>
              </p>
              <p className="nt">{newsletter.note}</p>
              <div className="nf">
                <input
                  id="home-newsletter"
                  type="email"
                  placeholder={newsletter.placeholder}
                  autoComplete="email"
                />
                <button type="button">{newsletter.submit}</button>
              </div>
            </div>
          ) : null}
        </div>
        <ul className="legal">
          <li>&copy; {year} Machine Brain</li>
          {HOME_FOOTER_COPY.legal.map((link) => (
            <li key={link.name}>
              <Link href={link.href}>{link.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
