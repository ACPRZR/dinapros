import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh the session and get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect all panel routes — must be authenticated
  if (!user && (pathname.startsWith("/panel") || pathname.startsWith("/paneladmin") || pathname.startsWith("/panel-de-control"))) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
  }

  // Role-based access control
  if (user) {
    // Fetch the user's role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = roleData?.role ?? "usuario";
    const isAdmin = role === "admin";

    // Admin routes: only admins can access /paneladmin and /panel-de-control
    if (!isAdmin && (pathname.startsWith("/paneladmin") || pathname.startsWith("/panel-de-control"))) {
      return NextResponse.redirect(new URL("/panel", request.url));
    }

    // Redirect admins from /panel (exact) to /paneladmin
    if (isAdmin && pathname === "/panel") {
      return NextResponse.redirect(new URL("/paneladmin", request.url));
    }
  }

  return supabaseResponse;
}
