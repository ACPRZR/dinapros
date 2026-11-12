import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardHeader from "@/components/dashboard-header";

export default async function PanelAdminLayout({
  children,
}: LayoutProps<"/paneladmin">) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  // Verify admin role
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = roleData?.role;

  if (role !== "admin") {
    redirect("/panel");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader role="admin" />
      {children}
    </div>
  );
}
