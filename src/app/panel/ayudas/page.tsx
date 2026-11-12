"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Droplets, Tent, HeartPulse, Wrench,
  ShowerHead, MoreHorizontal,
  Pencil, Copy, Check, ArrowLeft, ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIAS_AYUDA } from "@/types/database";
import OptionCard from "@/components/option-card";
import TerritorialSelector, { type TerritorialSelection } from "@/components/territorial-selector";

const TOTAL_STEPS = 5;

const CATEGORIA_ICONS: Record<string, LucideIcon> = {
  "Alimentos y raciones": Package,
  "Agua y saneamiento": Droplets,
  "Techo y abrigo": Tent,
  "Salud y medicamentos": HeartPulse,
  "Herramientas y kits de limpieza": Wrench,
  "Higiene personal": ShowerHead,
  "Otro": MoreHorizontal,
};

type FormData = {
  departamento: string;
  provincia: string;
  distrito: string;
  categoria_ayuda: string;
  organizacion: string;
  num_personas: number;
  fecha_entrega: string;
  observaciones: string;
};

const EMPTY_FORM: FormData = {
  departamento: "",
  provincia: "",
  distrito: "",
  categoria_ayuda: "",
  organizacion: "",
  num_personas: 0,
  fecha_entrega: "",
  observaciones: "",
};

export default function AyudasWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditCode, setAuditCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<FormData>(EMPTY_FORM);

  function nextDisabled() {
    switch (step) {
      case 1: return !data.distrito;
      case 2: return !data.categoria_ayuda;
      case 3: return data.organizacion.trim().length < 2 || data.num_personas <= 0;
      case 4: return !data.fecha_entrega;
      default: return false;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  function handleNext() { if (step < TOTAL_STEPS) setStep(step + 1); }
  function handleBack() { if (step > 1) setStep(step - 1); }

  function handleTerritorialChange(sel: TerritorialSelection) {
    setData((d) => ({
      ...d,
      departamento: sel.departamento,
      provincia: sel.provincia,
      distrito: sel.distrito,
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { data: result, error } = await supabase
      .from("ayudas")
      .insert({
        departamento: data.departamento || null,
        provincia: data.provincia || null,
        distrito: data.distrito || null,
        categoria_ayuda: data.categoria_ayuda,
        organizacion: data.organizacion,
        fecha_entrega: data.fecha_entrega,
        num_personas: data.num_personas,
        observaciones: data.observaciones || null,
      })
      .select()
      .single();

    if (error) {
      setError("Error al guardar. Verifica tu conexión e intenta de nuevo.");
      setSubmitting(false);
      return;
    }

    setAuditCode(result.codigo_auditoria);
    setStep(6);
    setSubmitting(false);
  }

  function copyCode() {
    if (!auditCode) return;
    navigator.clipboard.writeText(auditCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepLabels = ["Destino", "Categoría", "Organización", "Fecha", "Resumen"];

  if (step === 6 && auditCode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 bg-fg/5">
        <div className="w-full max-w-md bg-card rounded-2xl border border-edge p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-fg mb-2">Ayuda registrada</h2>
          <p className="text-sm text-dim mb-6">Guarda este código para hacer seguimiento:</p>
          <div className="bg-accent/10 rounded-xl p-4 mb-6">
            <p className="text-2xl font-bold text-accent font-mono tracking-wider">{auditCode}</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={copyCode} className="flex items-center justify-center gap-2 bg-accent text-fg font-semibold rounded-lg py-2.5 px-6 hover:bg-hover hover:text-base transition-colors">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado" : "Copiar código"}
            </button>
            <button onClick={() => router.push("/panel")} className="border border-edge text-fg font-semibold rounded-lg py-2.5 px-6 hover:bg-hover hover:text-base transition-colors">
              Volver al panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress bar */}
      <div className="bg-card border-b border-edge px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i + 1 <= step ? "bg-accent text-fg" : "bg-fg/10 text-dim"}`}>
                  {i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${i + 1 <= step ? "text-accent font-medium" : "text-dim"}`}>{label}</span>
              </div>
              {i < stepLabels.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i + 1 < step ? "bg-accent" : "bg-fg/10"}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* STEP 1 — Destino */}
          {step === 1 && (
            <TerritorialSelector
              label="Destino"
              subtitle="¿A dónde se entregó?"
              onChange={handleTerritorialChange}
            />
          )}

          {/* STEP 2 — Categoría de Ayuda */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-fg">¿Qué tipo de ayuda se entregó?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIAS_AYUDA.map((cat) => {
                  const Icon = CATEGORIA_ICONS[cat];
                  return (
                    <OptionCard key={cat} icon={Icon ? <Icon className="w-8 h-8" /> : null} label={cat} selected={data.categoria_ayuda === cat} onClick={() => setData((d) => ({ ...d, categoria_ayuda: cat }))} />
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — Organización y Alcance */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-bold text-fg">Organización y alcance</h3>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Organización que brinda la ayuda</label>
                <input type="text" required minLength={2} value={data.organizacion} onChange={(e) => setData((d) => ({ ...d, organizacion: e.target.value }))} placeholder="Ej: Municipio, Cruz Roja, ONG…" className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Número de personas alcanzadas</label>
                <input type="number" min={1} value={data.num_personas || ""} onChange={(e) => setData((d) => ({ ...d, num_personas: parseInt(e.target.value) || 0 }))} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-xs" />
              </div>
            </div>
          )}

          {/* STEP 4 — Fecha y Nota */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              <h3 className="text-lg font-bold text-fg">Fecha de recepción / entrega</h3>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-fg">¿Cuándo se entregó o recepcionó?</label>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setData((d) => ({ ...d, fecha_entrega: today }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${data.fecha_entrega === today ? "bg-accent text-fg" : "bg-fg/10 text-dim hover:bg-fg/20"}`}>Hoy</button>
                  <button onClick={() => setData((d) => ({ ...d, fecha_entrega: yesterday }))} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${data.fecha_entrega === yesterday ? "bg-accent text-fg" : "bg-fg/10 text-dim hover:bg-fg/20"}`}>Ayer</button>
                </div>
                <input type="date" max={today} value={data.fecha_entrega} onChange={(e) => setData((d) => ({ ...d, fecha_entrega: e.target.value }))} className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent w-full max-w-xs" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-fg">Nota (opcional)</label>
                <textarea maxLength={500} rows={4} value={data.observaciones} onChange={(e) => setData((d) => ({ ...d, observaciones: e.target.value }))} placeholder="Detalle del lote o entrega…" className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent resize-none" />
                <span className="text-xs text-dim text-right">{data.observaciones.length}/500</span>
              </div>
            </div>
          )}

          {/* STEP 5 — Resumen */}
          {step === 5 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-fg">Revisa los datos antes de guardar</h3>
              {error && <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex flex-col gap-3">
                <SummaryBlock title="Destino" onEdit={() => setStep(1)} value={data.distrito} subtitle={`${data.departamento} · ${data.provincia}`} />
                <SummaryBlock title="Categoría de ayuda" onEdit={() => setStep(2)} value={data.categoria_ayuda} />
                <SummaryBlock title="Organización" onEdit={() => setStep(3)} value={data.organizacion} subtitle={`${data.num_personas} personas alcanzadas`} />
                <SummaryBlock title="Fecha de entrega" onEdit={() => setStep(4)} value={data.fecha_entrega} subtitle={data.observaciones ? `Nota: ${data.observaciones}` : "Sin nota"} />
              </div>
              <button onClick={handleSubmit} disabled={submitting} className="mt-2 bg-accent text-fg font-bold rounded-lg py-3 hover:bg-hover hover:text-base transition-colors disabled:opacity-50">
                {submitting ? "Guardando…" : "Confirmar y guardar"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="sticky bottom-0 bg-card border-t border-edge px-4 py-3">
          <div className="max-w-2xl mx-auto flex justify-between">
            <button onClick={handleBack} disabled={step === 1} className="flex items-center gap-1 text-dim font-medium text-sm hover:text-fg disabled:opacity-30 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Atrás
            </button>
            <button onClick={handleNext} disabled={nextDisabled()} className="flex items-center gap-1 bg-accent text-fg font-semibold rounded-lg px-6 py-2 text-sm hover:bg-hover hover:text-base disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {step === 5 && (
        <div className="sticky bottom-0 bg-card border-t border-edge px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <button onClick={handleBack} className="flex items-center gap-1 text-dim font-medium text-sm hover:text-fg transition-colors">
              <ArrowLeft className="w-4 h-4" /> Atrás
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryBlock({ title, value, subtitle, onEdit }: { title: string; value: string; subtitle?: string; onEdit: () => void; }) {
  return (
    <div className="flex items-start justify-between p-4 rounded-xl border border-edge bg-card">
      <div className="flex-1">
        <p className="text-xs text-dim font-medium uppercase tracking-wide">{title}</p>
        <p className="text-sm font-semibold text-fg mt-1">{value || "—"}</p>
        {subtitle && <p className="text-xs text-dim mt-0.5">{subtitle}</p>}
      </div>
      <button onClick={onEdit} className="p-2 text-dim hover:text-accent transition-colors" aria-label="Editar">
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
