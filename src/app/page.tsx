import Link from "next/link";

export default function Home() {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Top half — Dinapros */}
      <section className="flex-1 flex items-center px-[5vw] bg-base">
        <h1
          className="font-bold leading-[0.85] text-fg tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 13vw, 13rem)" }}
        >
          Dinapros
        </h1>
      </section>

      {/* Bottom half — esta contigo + actions */}
      <section className="flex-1 flex flex-col justify-between py-6 px-[5vw] bg-card">
        <h2
          className="font-bold leading-[0.85] text-fg tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 13vw, 13rem)" }}
        >
          esta contigo
        </h2>

        {/* Three actions */}
        <nav className="flex justify-between items-center w-full pb-2">
          <Link
            href="/registrar"
            className="font-semibold text-fg text-sm sm:text-base md:text-lg hover:text-accent transition-colors"
          >
            Registrarse
          </Link>
          <Link
            href="/ingresar"
            className="font-semibold text-fg text-sm sm:text-base md:text-lg hover:text-accent transition-colors"
          >
            Ingresar
          </Link>
          <Link
            href="/ayuda"
            className="font-semibold text-fg text-sm sm:text-base md:text-lg hover:text-accent transition-colors"
          >
            Ayuda del sitio
          </Link>
        </nav>
      </section>
    </main>
  );
}
