// ============================================================
// DINAPROS — Tipos de la base de datos
// ============================================================

export type UserRole = "usuario" | "admin";

export type UserWithRole = {
  user_id: string;
  role: UserRole;
  email: string;
  nombre: string | null;
};

export type Sector = {
  id: string;
  nombre: string;
  distrito: string | null;
  provincia: string | null;
  created_at: string;
};

export type CentroPoblado = {
  id: string;
  sector_id: string;
  nombre: string;
  codigo_territorial: string | null;
  activo: boolean;
  created_at: string;
};

export type Incidencia = {
  id: string;
  codigo_auditoria: string;
  centro_poblado_id: string;
  tipo_afectacion: string;
  cantidad_hogares: number;
  necesidad_principal: string;
  fecha_evento: string;
  observaciones: string | null;
  created_at: string;
  created_by: string | null;
};

export type Ayuda = {
  id: string;
  codigo_auditoria: string;
  centro_poblado_id: string;
  categoria_ayuda: string;
  organizacion: string;
  fecha_entrega: string;
  num_personas: number;
  observaciones: string | null;
  created_at: string;
  created_by: string | null;
};

export type Brigada = {
  id: string;
  codigo_brigada: string;
  sector_id: string | null;
  departamento: string | null;
  region_eclesiastica: string | null;
  nombre_brigada: string;
  nombre_responsable: string;
  documento_responsable: string | null;
  telefono_responsable: string;
  contacto_secundario: string | null;
  created_at: string;
  created_by: string | null;
};

export type MiembroBrigada = {
  id: string;
  brigada_id: string;
  nombre_completo: string;
  documento: string | null;
  telefono: string;
  rol: string | null;
  created_at: string;
};

// ============================================================
// Listas cerradas (para las tarjetas del asistente)
// ============================================================

export const TIPOS_AFECTACION = [
  "Inundación",
  "Huaico / Deslizamiento",
  "Colapso de vivienda",
  "Aislamiento vial",
  "Corte de servicios básicos",
  "Desborde de río/quebrada",
  "Otro",
] as const;

export const NECESIDADES_PRINCIPALES = [
  "Agua potable",
  "Alimentos no perecibles",
  "Carpas y abrigo",
  "Atención médica",
  "Maquinaria de limpieza",
  "Evacuación y rescate",
  "Kits de higiene",
  "Otro",
] as const;

// Necesidades que activan el aviso de contacto de brigada
export const NECESIDADES_URGENTES = [
  "Evacuación y rescate",
  "Atención médica",
];

export const CATEGORIAS_AYUDA = [
  "Alimentos y raciones",
  "Agua y saneamiento",
  "Techo y abrigo",
  "Salud y medicamentos",
  "Herramientas y kits de limpieza",
  "Higiene personal",
  "Otro",
] as const;
