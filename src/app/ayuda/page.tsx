import Link from "next/link";

const items = [
  {
    title: "Registrar una incidencia",
    desc: 'Cuando ocurra un evento adverso en un centro poblado (inundación, huaico, derrumbe, etc.), ingresa al sistema y selecciona «Registrar Afectación». El asistente te guía paso a paso: ubicación, tipo de afectación, hogares afectados, necesidad prioritaria, fecha y observaciones.',
  },
  {
    title: "Registrar entrega de ayuda",
    desc: 'Cuando se entregue o recepcione asistencia humanitaria, selecciona «Registrar Entrega de Ayuda». Indica el centro poblado receptor, categoría de ayuda, organización que la entrega, número de personas alcanzadas y fecha.',
  },
  {
    title: "Consultar la Agenda de Brigadas",
    desc: 'Accede al menú superior y selecciona «Agenda de Brigadas». Puedes filtrar por sector o buscar por nombre, teléfono o código BRI para ver el responsable y todos los miembros de cada brigada.',
  },
  {
    title: "Código de Auditoría",
    desc: "Al guardar cada registro, el sistema genera automáticamente un código único (INC-2026-NNNNN para incidencias, AYU-2026-NNNNN para ayudas, BRI-2026-NNNNN para brigadas). Guarda este código para hacer seguimiento.",
  },
];

export default function AyudaPage() {
  return (
    <main className="min-h-screen flex flex-col bg-base">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="font-bold text-fg text-sm hover:opacity-70 transition-opacity"
        >
          ← DINAPROS esta contigo
        </Link>
      </header>

      <div className="flex-1 px-4 py-10 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-fg mb-2">
          Ayuda del sitio
        </h1>
        <p className="text-sm text-fg/70 mb-8">
          Instrucciones rápidas para usar la plataforma DINAPROS.
        </p>

        <div className="flex flex-col gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-5 shadow-none"
            >
              <h2 className="font-bold text-accent mb-1 text-base">
                {i + 1}. {item.title}
              </h2>
              <p className="text-sm text-fg/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-3 flex-wrap">
          <Link
            href="/ingresar"
            className="bg-accent text-white font-semibold rounded-lg py-2.5 px-5 text-sm hover:bg-accent transition-colors"
          >
            Ingresar al sistema
          </Link>
          <Link
            href="/registrar"
            className="border border-dinapros-carbon text-fg font-semibold rounded-lg py-2.5 px-5 text-sm hover:bg-dinapros-carbon hover:text-white transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
