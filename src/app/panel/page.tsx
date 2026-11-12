import ScrollSyncShowcase from "@/components/scroll-sync-showcase";

const items = [
  {
    index: "01 / 03",
    title: "Afectación / Incidencia",
    description:
      "Registro y seguimiento de daños, eventos críticos o incidencias reportadas por sector para su atención prioritaria.",
    href: "/panel/incidencias",
  },
  {
    index: "02 / 03",
    title: "Ayuda",
    description:
      "Canalización de solicitudes de asistencia, recursos y soporte humanitario para personas o zonas afectadas.",
    href: "/panel/ayudas",
  },
  {
    index: "03 / 03",
    title: "Brigadas",
    description:
      "Consulta de equipos desplegados en campo, sectores asignados y responsables operativos activos.",
    href: "/panel/brigadas",
  },
];

export default function PanelPage() {
  return <ScrollSyncShowcase items={items} />;
}
