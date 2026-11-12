"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import { ArrowUpRight, Users, Shield, AlertTriangle, Clock, Package, Activity } from "lucide-react";

type Stats = {
  totalIncidencias: number;
  totalAyudas: number;
  totalBrigadas: number;
  totalSectores: number;
  criticalIncidencias: number;
  coveredSectores: number;
};

type UserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
};

type TabKey = "resumen" | "incidencias" | "ayuda" | "brigadas" | "usuarios";

const TABS: { key: TabKey; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "incidencias", label: "Incidencias" },
  { key: "ayuda", label: "Ayuda" },
  { key: "brigadas", label: "Brigadas" },
  { key: "usuarios", label: "Usuarios y Roles" },
];

export default function PanelDeControlPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("resumen");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentInc, setRecentInc] = useState<{ created_at: string }[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();

    const [incRes, ayuRes, briRes, secRes] = await Promise.all([
      supabase.from("incidencias").select("*", { count: "exact", head: true }),
      supabase.from("ayudas").select("*", { count: "exact", head: true }),
      supabase.from("brigadas").select("*", { count: "exact", head: true }),
      supabase.from("sectores").select("*", { count: "exact", head: true }),
    ]);

    const { count: criticalCount } = await supabase
      .from("incidencias")
      .select("*", { count: "exact", head: true })
      .in("necesidad_principal", ["Evacuación y rescate", "Atención médica"]);

    const { data: brigadaSectors } = await supabase
      .from("brigadas")
      .select("sector_id");

    const covered = new Set(brigadaSectors?.map((b) => b.sector_id) || []).size;

    const { data: recent } = await supabase
      .from("incidencias")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    const { data: userList } = await supabase.rpc("get_users_with_roles");

    setStats({
      totalIncidencias: incRes.count || 0,
      totalAyudas: ayuRes.count || 0,
      totalBrigadas: briRes.count || 0,
      totalSectores: secRes.count || 0,
      criticalIncidencias: criticalCount || 0,
      coveredSectores: covered,
    });
    setRecentInc(recent || []);
    setUsers((userList as UserRow[]) || []);
    setLoading(false);
  }

  async function toggleRole(userId: string, currentRole: string) {
    setRoleError(null);
    const newRole = currentRole === "admin" ? "usuario" : "admin";
    const supabase = createClient();
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      setRoleError(
        error.message.includes("No autorizado") || error.message.includes("policy")
          ? "No tienes permiso o es el último administrador."
          : "Error al cambiar el rol.",
      );
      return;
    }

    setUsers(users.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)));
  }

  // --- Derived values ---
  const coberturaBrigadas =
    stats && stats.totalSectores > 0
      ? Math.round((stats.coveredSectores / stats.totalSectores) * 100)
      : 0;

  const healthScore =
    stats
      ? Math.min(
          100,
          Math.round(
            (stats.totalSectores > 0
              ? (stats.coveredSectores / stats.totalSectores) * 60
              : 0) +
            (stats.totalIncidencias > 0
              ? (1 - stats.criticalIncidencias / stats.totalIncidencias) * 40
              : 40),
          ),
        )
      : 0;

  const adminCount = users.filter((u) => u.role === "admin").length;

  // --- Trend data (last 14 days) ---
  const trendData = (() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = recentInc.filter(
        (r) => r.created_at?.startsWith(dateStr),
      ).length;
      days.push({ date: dateStr, count });
    }
    return days;
  })();

  const maxTrend = Math.max(...trendData.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">Cargando dashboard…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-base border-b border-edge px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-fg text-sm">DINAPROS</span>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {users
                .filter((u) => u.role === "admin")
                .slice(0, 3)
                .map((u) => (
                  <div
                    key={u.user_id}
                    className="w-8 h-8 rounded-full bg-accent text-fg flex items-center justify-center text-xs font-bold border-2 border-base"
                  >
                    {(u.email || "?").charAt(0).toUpperCase()}
                  </div>
                ))}
              {adminCount > 3 && (
                <div className="w-8 h-8 rounded-full bg-card text-dim flex items-center justify-center text-xs font-medium border-2 border-base">
                  +{adminCount - 3}
                </div>
              )}
            </div>
            <button
              onClick={() => setTab("usuarios")}
              className="text-xs font-semibold text-accent hover:text-hover transition-colors"
            >
              + Gestionar roles
            </button>
          </div>
        </div>

        {/* Pill tabs */}
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-accent text-fg"
                  : "text-dim hover:bg-hover hover:text-base"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB: Resumen */}
        {tab === "resumen" && stats && (
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
            {/* Left column (60%) */}
            <div className="lg:w-3/5 flex flex-col gap-4">
              {/* Hero block */}
              <div className="bg-card rounded-2xl border border-edge p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-dim mb-2">Incidencias Activas</p>
                    <p className="text-5xl font-bold text-fg">
                      {stats.totalIncidencias}
                    </p>
                    <p className="text-xs text-dim mt-1">
                      Total de casos en seguimiento
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => router.push("/panel/incidencias")}
                      className="bg-accent text-fg text-sm font-semibold rounded-lg px-4 py-2 hover:bg-hover hover:text-base transition-colors whitespace-nowrap"
                    >
                      + Nuevo reporte
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Tiempo prom. respuesta"
                  value="—"
                  hint="Sin datos"
                />
                <KpiCard
                  icon={<Package className="w-4 h-4" />}
                  label="Ayudas registradas"
                  value={String(stats.totalAyudas)}
                  hint="Total"
                />
                <KpiCard
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="Casos críticos"
                  value={String(stats.criticalIncidencias)}
                  hint={
                    stats.criticalIncidencias > 0 ? "Atención urgente" : "Sin críticos"
                  }
                  urgent={stats.criticalIncidencias > 0}
                />
                <KpiCard
                  icon={<Shield className="w-4 h-4" />}
                  label="Cobertura brigadas"
                  value={`${coberturaBrigadas}%`}
                  hint={`${stats.coveredSectores}/${stats.totalSectores} sectores`}
                />
              </div>

              {/* Health index */}
              <div className="bg-card rounded-2xl border border-edge p-6">
                <p className="text-sm font-semibold text-fg mb-1">
                  Índice de Salud Operativa
                </p>
                <p className="text-xs text-dim mb-4">
                  Capacidad de respuesta, atención de incidencias y cobertura de
                  ayuda en los últimos 30 días
                </p>
                <div className="flex items-end gap-1 h-32">
                  {Array.from({ length: 20 }).map((_, i) => {
                    const range = i * 5;
                    const active = range <= healthScore;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-colors ${
                          active && range >= 70
                            ? "bg-accent"
                            : active
                              ? "bg-fg/30"
                              : "bg-fg/5"
                        }`}
                        style={{ height: `${20 + i * 4}%` }}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-dim">
                  <span>Crítico</span>
                  <span>En riesgo</span>
                  <span>Estable</span>
                  <span>Fuerte</span>
                  <span className="text-accent">Óptimo</span>
                </div>
                <p className="text-2xl font-bold text-fg mt-3">{healthScore}/100</p>
              </div>
            </div>

            {/* Right column (40%) */}
            <div className="lg:w-2/5 flex flex-col gap-4">
              {/* SLA */}
              <div className="bg-card rounded-2xl border border-edge p-5">
                <p className="text-sm text-dim mb-2">
                  Nivel de Resolución dentro del SLA
                </p>
                <p className="text-4xl font-bold text-fg">
                  {stats.totalIncidencias > 0
                    ? Math.round(
                        ((stats.totalIncidencias - stats.criticalIncidencias) /
                          stats.totalIncidencias) *
                          100,
                      )
                    : 100}
                  %
                </p>
                <p className="text-xs text-accent mt-1">Estable</p>
                <div className="mt-3 h-2 bg-fg/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${
                        stats.totalIncidencias > 0
                          ? Math.round(
                              ((stats.totalIncidencias - stats.criticalIncidencias) /
                                stats.totalIncidencias) *
                                100,
                            )
                          : 100
                      }%`,
                    }}
                  />
                </div>
              </div>

              {/* Brigade capacity gauge */}
              <div className="bg-card rounded-2xl border border-edge p-5">
                <p className="text-sm text-dim mb-2">
                  Capacidad de Brigadas en Campo
                </p>
                <div className="flex justify-center my-4">
                  <Gauge percent={coberturaBrigadas} />
                </div>
                <div className="flex justify-around text-xs text-dim mt-2">
                  <span>Desplegadas: {stats.totalBrigadas}</span>
                  <span>Sectores: {stats.totalSectores}</span>
                </div>
              </div>

              {/* Trend chart */}
              <div className="bg-card rounded-2xl border border-edge p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-fg">
                      Tendencia de Atenciones
                    </p>
                    <p className="text-2xl font-bold text-fg mt-1">
                      {recentInc.length}
                      <span className="text-xs text-dim ml-2">últimos 14 días</span>
                    </p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-accent" />
                </div>
                <svg viewBox="0 0 280 80" className="w-full h-20">
                  <polyline
                    fill="none"
                    stroke="#0066CC"
                    strokeWidth="2"
                    points={trendData
                      .map((d, i) => {
                        const x = (i / (trendData.length - 1)) * 280;
                        const y = 75 - (d.count / maxTrend) * 65;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  {trendData.map((d, i) => {
                    const x = (i / (trendData.length - 1)) * 280;
                    const y = 75 - (d.count / maxTrend) * 65;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="2"
                        fill="#0066CC"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Usuarios y Roles */}
        {tab === "usuarios" && (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-fg">Usuarios y Roles</h2>
              <span className="text-sm text-dim">
                {users.length} usuarios registrados
              </span>
            </div>

            {roleError && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2 mb-3">
                {roleError}
              </p>
            )}

            <div className="bg-card rounded-2xl border border-edge overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-edge text-dim text-xs uppercase">
                    <th className="text-left p-4 font-medium">Usuario</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">
                      Registrado
                    </th>
                    <th className="text-center p-4 font-medium">Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-dim">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr
                      key={u.user_id}
                      className="border-b border-edge last:border-0 hover:bg-fg/5 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent text-fg flex items-center justify-center text-xs font-bold">
                            {(u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-fg font-medium">
                              {u.email || "—"}
                            </p>
                            {u.full_name && (
                              <p className="text-dim text-xs">{u.full_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-dim hidden sm:table-cell">
                        {new Date(u.created_at).toLocaleDateString("es-PE")}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleRole(u.user_id, u.role)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            u.role === "admin"
                              ? "bg-accent text-fg hover:bg-hover hover:text-base"
                              : "bg-fg/10 text-dim hover:bg-fg/20"
                          }`}
                        >
                          {u.role === "admin" ? "Admin" : "Usuario"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-dim mt-3">
              Haz clic en el botón de rol para alternar entre Usuario y Admin.
              No puedes quitarte el rol de Admin si eres el último administrador.
            </p>
          </div>
        )}

        {/* TAB: Incidencias (simple list) */}
        {tab === "incidencias" && <SimpleList table="incidencias" />}

        {/* TAB: Ayuda (simple list) */}
        {tab === "ayuda" && <SimpleList table="ayudas" />}

        {/* TAB: Brigadas (simple list) */}
        {tab === "brigadas" && <SimpleList table="brigadas" />}
      </div>
    </div>
  );
}

// --- KPI Card ---
function KpiCard({
  icon,
  label,
  value,
  hint,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  urgent?: boolean;
}) {
  return (
    <div className="bg-card rounded-xl border border-edge p-4">
      <div className={`mb-2 ${urgent ? "text-red-500" : "text-accent"}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-fg">{value}</p>
      <p className="text-xs text-dim mt-1">{label}</p>
      <p className={`text-xs mt-0.5 ${urgent ? "text-red-500" : "text-dim"}`}>
        {hint}
      </p>
    </div>
  );
}

// --- Semicircular Gauge ---
function Gauge({ percent }: { percent: number }) {
  const angle = (180 - (percent / 100) * 180) * (Math.PI / 180);
  const x = 100 + 90 * Math.cos(angle);
  const y = 90 - 90 * Math.sin(angle);
  const largeArc = percent > 50 ? 1 : 0;
  const path =
    percent > 0
      ? `M 10 90 A 90 90 0 ${largeArc} 1 ${x.toFixed(1)} ${y.toFixed(1)}`
      : "";

  return (
    <svg viewBox="0 0 200 110" className="w-48 h-28">
      <path
        d="M 10 90 A 90 90 0 0 1 190 90"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {path && (
        <path
          d={path}
          fill="none"
          stroke="#0066CC"
          strokeWidth="12"
          strokeLinecap="round"
        />
      )}
      <text
        x="100"
        y="80"
        textAnchor="middle"
        className="fill-white text-2xl font-bold"
      >
        {percent}%
      </text>
    </svg>
  );
}

// --- Simple data list for non-Resumen tabs ---
function SimpleList({ table }: { table: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from(table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      setRows((data as Record<string, unknown>[]) || []);
      setLoadingList(false);
    }
    load();
  }, [table]);

  if (loadingList) {
    return <p className="text-dim text-sm">Cargando…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-dim text-sm">No hay registros.</p>
      </div>
    );
  }

  const columns = Object.keys(rows[0]).filter(
    (k) => k !== "id" && k !== "created_by",
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-card rounded-2xl border border-edge overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-edge text-dim text-xs uppercase">
              {columns.map((col) => (
                <th key={col} className="text-left p-3 font-medium">
                  {col.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-edge last:border-0 hover:bg-fg/5"
              >
                {columns.map((col) => (
                  <td key={col} className="p-3 text-fg/80">
                    {String(row[col] ?? "—").slice(0, 50)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
