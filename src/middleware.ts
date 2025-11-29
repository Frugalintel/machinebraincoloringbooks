import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAMES } from '@/lib/constants';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase auth check if not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    const mockUser = request.cookies.get(COOKIE_NAMES.MOCK_USER);
    if (request.nextUrl.pathname.startsWith('/profile') && !mockUser) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mockUser = request.cookies.get(COOKIE_NAMES.MOCK_USER);

  if (request.nextUrl.pathname.startsWith('/profile') && !user && !mockUser) {
    const redirectUrl = new URL('/auth', request.url);
    redirectUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/profile/:path*'],
};
