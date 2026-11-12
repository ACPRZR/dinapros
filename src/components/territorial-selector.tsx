"use client";

import { useState, useMemo, useCallback } from "react";
import ubigeoData from "@/data/ubigeo_peru.json";

type UbigeoDepartamento = {
  id: string;
  n: string;
  p: UbigeoProvincia[];
};

type UbigeoProvincia = {
  id: string;
  n: string;
  d: UbigeoDistrito[];
};

type UbigeoDistrito = {
  id: string;
  n: string;
};

const departamentos = ubigeoData as UbigeoDepartamento[];

export type TerritorialSelection = {
  departamento: string;
  departamentoId: string;
  provincia: string;
  provinciaId: string;
  distrito: string;
  distritoId: string;
};

type Props = {
  label: string;
  subtitle?: string;
  onChange: (selection: TerritorialSelection) => void;
};

export default function TerritorialSelector({ label, subtitle, onChange }: Props) {
  const [deptId, setDeptId] = useState("");
  const [provId, setProvId] = useState("");
  const [distId, setDistId] = useState("");

  const selectedDept = useMemo(
    () => departamentos.find((d) => d.id === deptId),
    [deptId],
  );

  const provincias = useMemo(
    () => (selectedDept ? selectedDept.p : []),
    [selectedDept],
  );

  const selectedProv = useMemo(
    () => provincias.find((p) => p.id === provId),
    [provincias, provId],
  );

  const distritos = useMemo(
    () => (selectedProv ? selectedProv.d : []),
    [selectedProv],
  );

  const handleChange = useCallback(
    (
      newDeptId: string,
      newProvId: string,
      newDistId: string,
    ) => {
      const dept = departamentos.find((d) => d.id === newDeptId);
      const prov = dept?.p.find((p) => p.id === newProvId);
      const dist = prov?.d.find((d) => d.id === newDistId);

      onChange({
        departamento: dept?.n || "",
        departamentoId: newDeptId,
        provincia: prov?.n || "",
        provinciaId: newProvId,
        distrito: dist?.n || "",
        distritoId: newDistId,
      });
    },
    [onChange],
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-bold text-fg">{label}</h3>
        {subtitle && <p className="text-sm text-dim mt-0.5">{subtitle}</p>}
      </div>

      {/* Departamento */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-fg">Departamento</label>
        <select
          value={deptId}
          onChange={(e) => {
            setDeptId(e.target.value);
            setProvId("");
            setDistId("");
            handleChange(e.target.value, "", "");
          }}
          className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Selecciona…</option>
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.n}
            </option>
          ))}
        </select>
      </div>

      {/* Provincia */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-dim">Provincia</label>
        <select
          value={provId}
          disabled={!deptId}
          onChange={(e) => {
            setProvId(e.target.value);
            setDistId("");
            handleChange(deptId, e.target.value, "");
          }}
          className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
        >
          <option value="">Selecciona…</option>
          {provincias.map((p) => (
            <option key={p.id} value={p.id}>
              {p.n}
            </option>
          ))}
        </select>
      </div>

      {/* Distrito */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-dim">Distrito</label>
        <select
          value={distId}
          disabled={!provId}
          onChange={(e) => {
            setDistId(e.target.value);
            handleChange(deptId, provId, e.target.value);
          }}
          className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40"
        >
          <option value="">Selecciona…</option>
          {distritos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
