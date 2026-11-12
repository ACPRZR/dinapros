import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard-header";
import type { UserRole } from "@/types/database";

export default async function PanelLayout({
  children,
}: LayoutProps<"/panel">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  // Fetch user role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role: UserRole = (roleData?.role as UserRole) ?? "usuario";

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader role={role} />
      {children}
    </div>
  );
}
