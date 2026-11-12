"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

export default function DashboardHeader({ role = "usuario" }: { role?: UserRole }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 bg-base border-b border-edge px-5 py-3 flex items-center justify-between">
      <button
        onClick={() => router.push(role === "admin" ? "/paneladmin" : "/panel")}
        className="font-bold text-fg text-sm sm:text-base"
      >
        DINAPROS esta contigo
      </button>

      <button
        onClick={handleLogout}
        className="text-sm font-medium text-fg border border-edge rounded-lg px-4 py-1.5 hover:bg-hover hover:text-base transition-colors"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
