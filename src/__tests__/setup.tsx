import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    fill,
    priority,
    preload,
    unoptimized: _unoptimized,
    sizes,
    ...props
  }: {
    src: string | { src: string };
    alt: string;
    fill?: boolean;
    priority?: boolean;
    preload?: boolean;
    unoptimized?: boolean;
    sizes?: string;
  } & React.ImgHTMLAttributes<HTMLImageElement>) => {
    void _unoptimized;
    const resolved = typeof src === "string" ? src : src.src;
    return (
      <img
        src={resolved}
        alt={alt}
        sizes={sizes}
        data-fill={fill ? "" : undefined}
        data-preload={preload || priority ? "" : undefined}
        {...props}
      />
    );
  },
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode }) => (
      <span {...props}>{children}</span>
    ),
    button: ({ children, ...props }: { children: React.ReactNode }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn(),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: "https://example.com/image.png" },
        })),
      })),
    },
  },
  isSupabaseConfigured: true,
}));
