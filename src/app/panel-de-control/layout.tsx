import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PanelDeControlLayout({
  children,
}: LayoutProps<"/panel-de-control">) {
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

  if (roleData?.role !== "admin") {
    redirect("/panel");
  }

  return <div className="min-h-screen flex flex-col">{children}</div>;
}
