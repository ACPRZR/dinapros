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
  const [nombreResponsable, setNombreResponsable] = useState("");
  const [documentoResponsable, setDocumentoResponsable] = useState("");
  const [telefonoResponsable, setTelefonoResponsable] = useState("");
  const [contactoSecundario, setContactoSecundario] = useState("");
  const [miembros, setMiembros] = useState<Miembro[]>([{ ...EMPTY_MIEMBRO }]);
  const [triedSubmit, setTriedSubmit] = useState(false);

  function sanitizeDigits(value: string, maxLen: number) {
    return value.replace(/\D/g, "").slice(0, maxLen);
  }

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
    let sanitized = value;
    if (field === "documento") sanitized = sanitizeDigits(value, 8);
    if (field === "telefono") sanitized = sanitizeDigits(value, 9);
    updated[index] = { ...updated[index], [field]: sanitized };
    setMiembros(updated);
  }

  function validateForm(): string | null {
    if (!departamento || !regionEclesiastica) {
      return "Selecciona el departamento y la región eclesiástica.";
    }
    if (!nombreResponsable.trim()) {
      return "Ingresa el nombre completo del responsable.";
    }
    if (!/^\d{8}$/.test(documentoResponsable)) {
      return "El DNI del responsable debe tener exactamente 8 dígitos numéricos.";
    }
    if (!/^\d{9}$/.test(telefonoResponsable)) {
      return "El teléfono del responsable debe tener exactamente 9 dígitos numéricos.";
    }
    for (let i = 0; i < miembros.length; i++) {
      const m = miembros[i];
      if (!m.nombre_completo.trim()) {
        return `Ingresa el nombre completo del miembro ${i + 1}.`;
      }
      if (!/^\d{8}$/.test(m.documento)) {
        return `El DNI del miembro ${i + 1} debe tener exactamente 8 dígitos numéricos.`;
      }
      if (!/^\d{9}$/.test(m.telefono)) {
        return `El teléfono del miembro ${i + 1} debe tener exactamente 9 dígitos numéricos.`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    setTriedSubmit(true);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    const supabase = createClient();

    const { data: brigada, error: brigadaError } = await supabase
      .from("brigadas")
      .insert({
        departamento,
        region_eclesiastica: regionEclesiastica,
        nombre_brigada: `Brigada ${departamento}`,
        nombre_responsable: nombreResponsable.trim(),
        documento_responsable: documentoResponsable,
        telefono_responsable: telefonoResponsable,
        contacto_secundario: contactoSecundario.trim() || null,
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
                <label className="text-sm font-medium text-fg">DNI * (8 dígitos)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  value={documentoResponsable}
                  onChange={(e) => setDocumentoResponsable(sanitizeDigits(e.target.value, 8))}
                  placeholder="12345678"
                  className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {(triedSubmit || documentoResponsable.length > 0) && documentoResponsable.length < 8 && (
                  <span className="text-xs text-red-500">Debe tener exactamente 8 dígitos.</span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Teléfono de contacto * (9 dígitos)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={9}
                  value={telefonoResponsable}
                  onChange={(e) => setTelefonoResponsable(sanitizeDigits(e.target.value, 9))}
                  placeholder="999888777"
                  className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                {(triedSubmit || telefonoResponsable.length > 0) && telefonoResponsable.length < 9 && (
                  <span className="text-xs text-red-500">Debe tener exactamente 9 dígitos.</span>
                )}
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
                      <label className="text-xs text-dim">DNI * (8 dígitos)</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        value={m.documento}
                        onChange={(e) => updateMiembro(i, "documento", e.target.value)}
                        placeholder="12345678"
                        className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {(triedSubmit || m.documento.length > 0) && m.documento.length < 8 && (
                        <span className="text-xs text-red-500">Debe tener exactamente 8 dígitos.</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-dim">Teléfono * (9 dígitos)</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        value={m.telefono}
                        onChange={(e) => updateMiembro(i, "telefono", e.target.value)}
                        placeholder="999888777"
                        className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      {(triedSubmit || m.telefono.length > 0) && m.telefono.length < 9 && (
                        <span className="text-xs text-red-500">Debe tener exactamente 9 dígitos.</span>
                      )}
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

          <button onClick={handleSubmit} disabled={submitting} className="bg-accent text-fg font-bold rounded-lg py-3 hover:bg-hover hover:text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {submitting ? "Guardando…" : "Guardar brigada"}
          </button>
        </div>
      </div>
    </div>
  );
}
