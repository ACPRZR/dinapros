import Link from "next/link";

export default function Home() {
  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Top half — LADP */}
      <section className="flex-1 flex flex-col justify-between px-[5vw] py-6 bg-base">
        <header className="w-full">
          <span className="text-sm sm:text-base font-bold tracking-tight text-[#FFFFFF]">
            LADP te ayuda
          </span>
        </header>
        <div className="flex-1 flex items-center">
          <h1
            className="font-bold leading-[0.85] text-fg tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 13vw, 13rem)" }}
          >
            LADP
          </h1>
        </div>
      </section>

      {/* Bottom half — te ayuda + actions */}
      <section className="flex-1 flex flex-col justify-between py-6 px-[5vw] bg-card">
        <h2
          className="font-bold leading-[0.85] text-fg tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 13vw, 13rem)" }}
        >
          te ayuda
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
