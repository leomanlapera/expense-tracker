import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/auth/callback"];

type Security = { nonce: string; csp: string };

// Snapshot the current request headers and stamp the CSP + nonce so Next.js
// can auto-nonce hydration scripts during SSR, and downstream Server
// Components can read the nonce via `headers().get('x-nonce')`.
function buildRequestHeaders(request: NextRequest, security: Security) {
  const headers = new Headers(request.headers);
  headers.set("x-nonce", security.nonce);
  headers.set("Content-Security-Policy", security.csp);
  return headers;
}

function withCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export async function updateSession(request: NextRequest, security: Security) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Until Supabase keys are configured, let every request through so the
  // scaffold is usable locally. Auth enforcement turns on the moment
  // NEXT_PUBLIC_SUPABASE_URL is set.
  if (!url || !key) {
    return withCsp(
      NextResponse.next({ request: { headers: buildRequestHeaders(request, security) } }),
      security.csp,
    );
  }

  let response = NextResponse.next({
    request: { headers: buildRequestHeaders(request, security) },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({
          request: { headers: buildRequestHeaders(request, security) },
        });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.search = "";
    // Round-trip the intended path so the callback can send them back after login.
    const intended = pathname + request.nextUrl.search;
    if (intended && intended !== "/") redirectUrl.searchParams.set("next", intended);
    return withCsp(NextResponse.redirect(redirectUrl), security.csp);
  }

  return withCsp(response, security.csp);
}
