"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Brigada, MiembroBrigada } from "@/types/database";
import { DEPARTAMENTOS_LIST, REGIONES_ECLESIASTICAS } from "@/data/regiones_eclesiasticas";
import { Search, Phone, Copy, Check, Plus } from "lucide-react";

type BrigadaWithRelations = Brigada & {
  miembros_brigada: MiembroBrigada[];
};

export default function BrigadasPage() {
  const router = useRouter();
  const [brigadas, setBrigadas] = useState<BrigadaWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("brigadas")
        .select("*, miembros_brigada(*)")
        .order("created_at");
      setBrigadas((data || []) as BrigadaWithRelations[]);
      setLoading(false);
    }
    load();
  }, []);

  const availableRegions = useMemo(
    () => (deptFilter ? REGIONES_ECLESIASTICAS[deptFilter] || [] : []),
    [deptFilter],
  );

  const filteredBrigadas = useMemo(() => {
    let result = brigadas;
    if (deptFilter) result = result.filter((b) => b.departamento === deptFilter);
    if (regionFilter) result = result.filter((b) => b.region_eclesiastica === regionFilter);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (b) =>
          b.nombre_responsable.toLowerCase().includes(term) ||
          b.nombre_brigada.toLowerCase().includes(term) ||
          b.telefono_responsable.includes(term) ||
          (b.codigo_brigada || "").toLowerCase().includes(term) ||
          b.departamento?.toLowerCase().includes(term) ||
          b.region_eclesiastica?.toLowerCase().includes(term) ||
          b.miembros_brigada.some(
            (m) =>
              m.nombre_completo.toLowerCase().includes(term) ||
              m.telefono.includes(term),
          ),
      );
    }
    return result;
  }, [brigadas, deptFilter, regionFilter, searchTerm]);

  const grouped = useMemo(() => {
    const map = new Map<string, BrigadaWithRelations[]>();
    for (const b of filteredBrigadas) {
      const key = b.departamento || "Sin departamento";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries());
  }, [filteredBrigadas]);

  function copyPhone(phone: string) {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-dim text-sm">Cargando brigadas…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Search and filters */}
      <div className="bg-card border-b border-edge px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
              <input
                type="text"
                placeholder="Buscar por responsable, miembro, teléfono o código BRI…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button
              onClick={() => router.push("/panel/brigadas/nueva")}
              className="flex items-center gap-1 bg-accent text-fg font-semibold rounded-lg px-4 py-2 text-sm hover:bg-hover hover:text-base transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva brigada</span>
            </button>
          </div>

          {/* Departamento filter */}
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setRegionFilter("");
            }}
            className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent max-w-xs"
          >
            <option value="">Todos los departamentos</option>
            {DEPARTAMENTOS_LIST.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Región filter */}
          {availableRegions.length > 0 && (
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent max-w-xs"
            >
              <option value="">Todas las regiones</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Brigade cards grouped by departamento */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {grouped.length === 0 && (
            <p className="text-sm text-dim text-center py-12">No se encontraron brigadas.</p>
          )}

          {grouped.map(([deptName, brigadasList]) => (
            <div key={deptName} className="mb-8">
              <h3 className="text-sm font-bold text-accent uppercase tracking-wide mb-3">
                {deptName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brigadasList.map((b) => (
                  <BrigadaCard key={b.id} brigada={b} copiedPhone={copiedPhone} onCopyPhone={copyPhone} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrigadaCard({
  brigada,
  copiedPhone,
  onCopyPhone,
}: {
  brigada: BrigadaWithRelations;
  copiedPhone: string | null;
  onCopyPhone: (phone: string) => void;
}) {
  return (
    <div className="bg-card rounded-2xl border border-edge p-5">
      {/* Header: departamento + nombre */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-dim">{brigada.departamento}</p>
          {brigada.region_eclesiastica && (
            <p className="text-xs text-accent">{brigada.region_eclesiastica}</p>
          )}
          <h4 className="font-bold text-fg mt-1">{brigada.nombre_brigada}</h4>
        </div>
        {brigada.codigo_brigada && (
          <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-1 rounded">
            {brigada.codigo_brigada}
          </span>
        )}
      </div>

      {/* Responsable */}
      <div className="bg-fg/5 rounded-xl p-3 mb-3">
        <p className="text-xs font-medium text-accent mb-1">RESPONSABLE</p>
        <p className="font-semibold text-fg text-sm">{brigada.nombre_responsable}</p>
        {brigada.documento_responsable && (
          <p className="text-xs text-dim">DNI: {brigada.documento_responsable}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <a href={`tel:${brigada.telefono_responsable}`} className="flex items-center gap-1 bg-accent text-fg text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-hover hover:text-base transition-colors">
            <Phone className="w-3 h-3" /> Llamar
          </a>
          <button onClick={() => onCopyPhone(brigada.telefono_responsable)} className="flex items-center gap-1 bg-base border border-edge text-dim text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-fg/10 transition-colors">
            {copiedPhone === brigada.telefono_responsable ? (<><Check className="w-3 h-3 text-green-500" /> Copiado</>) : (<><Copy className="w-3 h-3" /> Copiar</>)}
          </button>
        </div>
        {brigada.contacto_secundario && (
          <p className="text-xs text-dim mt-1">Contacto secundario: {brigada.contacto_secundario}</p>
        )}
      </div>

      {/* Miembros */}
      <div>
        <p className="text-xs font-medium text-accent mb-2">
          MIEMBROS ({brigada.miembros_brigada.length})
        </p>
        {brigada.miembros_brigada.length === 0 ? (
          <p className="text-xs text-dim">Sin miembros registrados.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {brigada.miembros_brigada.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-fg/5">
                <div>
                  <p className="text-sm font-medium text-fg">{m.nombre_completo}</p>
                  {m.documento && <p className="text-xs text-dim">DNI: {m.documento}{m.rol && ` · ${m.rol}`}</p>}
                </div>
                <a href={`tel:${m.telefono}`} className="text-accent hover:text-fg text-xs font-medium">{m.telefono}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
