"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEPARTAMENTOS_LIST, REGIONES_ECLESIASTICAS } from "@/data/regiones_eclesiasticas";

type Miembro = {
  nombre_completo: string;
  documento: string;
  telefono: string;
  rol: string;
};

const EMPTY_MIEMBRO: Miembro = {
  nombre_completo: "",
  documento: "",
  telefono: "",
  rol: "",
};

export default function NuevaBrigadaPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [departamento, setDepartamento] = useState("");
  const [regionEclesiastica, setRegionEclesiastica] = useState("");
  const [nombreBrigada, setNombreBrigada] = useState("");
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [documentoResponsable, setDocumentoResponsable] = useState("");
  const [telefonoResponsable, setTelefonoResponsable] = useState("");
  const [contactoSecundario, setContactoSecundario] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([{ ...EMPTY_MIEMBRO }]);

  const availableRegions = useMemo(
    () => (departamento ? REGIONES_ECLESIASTICAS[departamento] || [] : []),
    [departamento],
  );

  // Auto-select region if only one available
  useEffect(() => {
    if (availableRegions.length === 1) {
      setRegionEclesiastica(availableRegions[0]);
    } else if (!availableRegions.includes(regionEclesiastica)) {
      setRegionEclesiastica("");
    }
  }, [availableRegions, regionEclesiastica]);

  function addMiembro() {
    setMiembros([...miembros, { ...EMPTY_MIEMBRO }]);
  }

  function removeMiembro(index: number) {
    setMiembros(miembros.filter((_, i) => i !== index));
  }

  function updateMiembro(index: number, field: keyof Miembro, value: string) {
    const updated = [...miembros];
    updated[index] = { ...updated[index], [field]: value };
    setMiembros(updated);
  }

  const canSubmit =
    departamento &&
    regionEclesiastica &&
    nombreBrigada.trim() &&
    nombreResponsable.trim() &&
    telefonoResponsable.trim() &&
    miembros.every((m) => m.nombre_completo.trim() && m.telefono.trim());

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { data: brigada, error: brigadaError } = await supabase
      .from("brigadas")
      .insert({
        departamento,
        region_eclesiastica: regionEclesiastica,
        nombre_brigada: nombreBrigada,
        nombre_responsable: nombreResponsable,
        documento_responsable: documentoResponsable || null,
        telefono_responsable: telefonoResponsable,
        contacto_secundario: contactoSecundario || null,
      })
      .select()
      .single();

    if (brigadaError || !brigada) {
      setError("Error al crear la brigada. Intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    const miembrosData = miembros
      .filter((m) => m.nombre_completo.trim() && m.telefono.trim())
      .map((m) => ({
        brigada_id: brigada.id,
        nombre_completo: m.nombre_completo,
        documento: m.documento || null,
        telefono: m.telefono,
        rol: m.rol || null,
      }));

    if (miembrosData.length > 0) {
      const { error: miembrosError } = await supabase
        .from("miembros_brigada")
        .insert(miembrosData);

      if (miembrosError) {
        setError("La brigada se creó pero hubo un error al guardar algunos miembros.");
        setSubmitting(false);
        return;
      }
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-card rounded-2xl border border-edge p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-2">Brigada registrada</h2>
          <p className="text-sm text-dim mb-6">La brigada y sus miembros se guardaron correctamente.</p>
          <button onClick={() => router.push("/panel/brigadas")} className="bg-accent text-fg font-semibold rounded-lg py-2.5 px-6 hover:bg-hover hover:text-base transition-colors">
            Ver agenda de brigadas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-edge px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-dim hover:text-fg transition-colors" aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-fg">Nueva brigada</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          {/* Departamento + Región */}
          <section className="bg-card rounded-2xl border border-edge p-5">
            <h3 className="text-sm font-bold text-accent uppercase tracking-wide mb-3">Datos de la brigada</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Departamento *</label>
                <select value={departamento} onChange={(e) => setDepartamento(e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent">
                  <option value="">Selecciona un departamento…</option>
                  {DEPARTAMENTOS_LIST.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Región Eclesiástica *</label>
                <select value={regionEclesiastica} disabled={!departamento} onChange={(e) => setRegionEclesiastica(e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40">
                  <option value="">Selecciona una región…</option>
                  {availableRegions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Nombre o identificador de la brigada *</label>
                <input type="text" value={nombreBrigada} onChange={(e) => setNombreBrigada(e.target.value)} placeholder="Ej: Brigada 01" className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
          </section>

          {/* Responsable */}
          <section className="bg-card rounded-2xl border border-edge p-5">
            <h3 className="text-sm font-bold text-accent uppercase tracking-wide mb-3">Responsable</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-fg">Nombre completo *</label>
                <input type="text" value={nombreResponsable} onChange={(e) => setNombreResponsable(e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Documento (opcional)</label>
                <input type="text" value={documentoResponsable} onChange={(e) => setDocumentoResponsable(e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Teléfono de contacto *</label>
                <input type="tel" value={telefonoResponsable} onChange={(e) => setTelefonoResponsable(e.target.value)} placeholder="999888777" className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-sm font-medium text-fg">Contacto secundario (opcional)</label>
                <input type="text" value={contactoSecundario} onChange={(e) => setContactoSecundario(e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
            </div>
          </section>

          {/* Miembros */}
          <section className="bg-card rounded-2xl border border-edge p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-accent uppercase tracking-wide">Miembros ({miembros.length})</h3>
              <button onClick={addMiembro} className="flex items-center gap-1 text-sm text-accent font-medium hover:text-fg transition-colors">
                <Plus className="w-4 h-4" /> Agregar
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {miembros.map((m, i) => (
                <div key={i} className="bg-fg/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-dim">MIEMBRO {i + 1}</span>
                    {miembros.length > 1 && (
                      <button onClick={() => removeMiembro(i)} className="text-red-500/60 hover:text-red-500 transition-colors" aria-label="Eliminar miembro">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs text-dim">Nombre completo *</label>
                      <input type="text" value={m.nombre_completo} onChange={(e) => updateMiembro(i, "nombre_completo", e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-dim">Documento (opcional)</label>
                      <input type="text" value={m.documento} onChange={(e) => updateMiembro(i, "documento", e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-dim">Teléfono *</label>
                      <input type="tel" value={m.telefono} onChange={(e) => updateMiembro(i, "telefono", e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs text-dim">Rol o función (opcional)</label>
                      <input type="text" value={m.rol} onChange={(e) => updateMiembro(i, "rol", e.target.value)} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button onClick={handleSubmit} disabled={submitting || !canSubmit} className="bg-accent text-fg font-bold rounded-lg py-3 hover:bg-hover hover:text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Guardando…" : "Guardar brigada"}
          </button>
        </div>
      </div>
    </div>
  );
}
