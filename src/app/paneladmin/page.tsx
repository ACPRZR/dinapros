import ScrollSyncShowcase from "@/components/scroll-sync-showcase";

const items = [
  {
    index: "01 / 02",
    title: "Panel de control",
    description:
      "Tablero ejecutivo con métricas consolidadas, estado de incidencias, cobertura de ayuda y administración de roles.",
    href: "/panel-de-control",
  },
  {
    index: "02 / 02",
    title: "Brigadas",
    description:
      "Administración integral de brigadas, asignación de sectores, responsables y coordinación de despliegue.",
    href: "/panel/brigadas",
  },
];

export default function PanelAdminPage() {
  return (
    <ScrollSyncShowcase
      items={items}
      headerText="Centro de acceso administrativo para supervisión operativa y gestión de brigadas."
    />
  );
}
