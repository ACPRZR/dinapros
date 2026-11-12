"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, AlertCircle, Heart, Users } from "lucide-react";

type SearchResult = {
  tipo: "incidencia" | "ayuda" | "brigada";
  codigo: string;
  titulo: string;
  detalle: string;
  fecha: string;
};

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const supabase = createClient();
    const term = query.trim();
    const found: SearchResult[] = [];

    // Search incidencias
    const { data: inc } = await supabase
      .from("incidencias")
      .select("codigo_auditoria, tipo_afectacion, fecha_evento, centros_poblados(nombre)")
      .ilike("codigo_auditoria", `%${term}%`);
    for (const r of inc || []) {
      const cp = Array.isArray(r.centros_poblados)
        ? r.centros_poblados[0]
        : r.centros_poblados;
      found.push({
        tipo: "incidencia",
        codigo: r.codigo_auditoria,
        titulo: r.tipo_afectacion,
        detalle: (cp as { nombre: string } | null)?.nombre || "—",
        fecha: r.fecha_evento,
      });
    }

    // Search ayudas
    const { data: ayu } = await supabase
      .from("ayudas")
      .select("codigo_auditoria, categoria_ayuda, organizacion, fecha_entrega, centros_poblados(nombre)")
      .ilike("codigo_auditoria", `%${term}%`);
    for (const r of ayu || []) {
      const cp = Array.isArray(r.centros_poblados)
        ? r.centros_poblados[0]
        : r.centros_poblados;
      found.push({
        tipo: "ayuda",
        codigo: r.codigo_auditoria,
        titulo: r.categoria_ayuda,
        detalle: `${r.organizacion} → ${(cp as { nombre: string } | null)?.nombre || "—"}`,
        fecha: r.fecha_entrega,
      });
    }

    // Search brigadas
    const { data: bri } = await supabase
      .from("brigadas")
      .select("codigo_brigada, nombre_brigada, nombre_responsable, sectores(nombre)")
      .ilike("codigo_brigada", `%${term}%`);
    for (const r of bri || []) {
      const sec = Array.isArray(r.sectores) ? r.sectores[0] : r.sectores;
      found.push({
        tipo: "brigada",
        codigo: r.codigo_brigada,
        titulo: r.nombre_brigada,
        detalle: `${r.nombre_responsable} · ${(sec as { nombre: string } | null)?.nombre || "—"}`,
        fecha: "",
      });
    }

    setResults(found);
    setLoading(false);
  }, [query]);

  const typeConfig = {
    incidencia: { label: "INCIDENCIA", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
    ayuda: { label: "AYUDA", icon: Heart, color: "text-pink-500", bg: "bg-pink-50" },
    brigada: { label: "BRIGADA", icon: Users, color: "text-accent", bg: "bg-accent/10" },
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Search bar */}
      <div className="bg-card border-b border-edge px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
            <input
              type="text"
              placeholder="Ej: INC-2026-00001"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 border border-edge rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="bg-accent text-white font-semibold rounded-lg px-5 py-2 text-sm hover:bg-accent disabled:opacity-40 transition-colors"
          >
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {searched && results.length === 0 && !loading && (
            <p className="text-sm text-dim text-center py-12">
              No se encontraron registros con ese código.
            </p>
          )}

          {results.length > 0 && (
            <>
              <p className="text-sm text-dim mb-4">
                {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
              </p>
              <div className="flex flex-col gap-3">
                {results.map((r, i) => {
                  const cfg = typeConfig[r.tipo];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-card rounded-xl border border-edge p-4"
                    >
                      <div className={`p-2 rounded-lg ${cfg.bg}`}>
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                            {r.codigo}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-fg">
                          {r.titulo}
                        </p>
                        <p className="text-xs text-dim">{r.detalle}</p>
                        {r.fecha && (
                          <p className="text-xs text-dim mt-1">
                            Fecha: {r.fecha}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!searched && (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-dim">
                Busca por código de auditoría (INC, AYU o BRI)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
