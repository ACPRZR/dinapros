"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegistrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-base px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border border-edge p-8 text-center">
          <h1 className="text-xl font-bold text-fg mb-2">¡Registro exitoso!</h1>
          <p className="text-sm text-dim mb-6">
            Revisa tu correo para confirmar tu cuenta. Luego podrás ingresar.
          </p>
          <Link
            href="/ingresar"
            className="inline-block bg-accent text-fg font-semibold rounded-lg py-2.5 px-6 hover:bg-hover hover:text-base transition-colors"
          >
            Ir a Ingresar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-base">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="font-bold text-fg text-sm hover:text-accent transition-colors"
        >
          ← DINAPROS esta contigo
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-card rounded-2xl border border-edge p-8">
          <h1 className="text-2xl font-bold text-fg mb-6">Registrarse</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-fg" htmlFor="confirm">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-base border border-edge rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-accent text-fg font-semibold rounded-lg py-2.5 hover:bg-hover hover:text-base transition-colors disabled:opacity-50"
            >
              {loading ? "Registrando…" : "Registrarse"}
            </button>
          </form>

          <p className="mt-6 text-sm text-dim text-center">
            ¿Ya tienes cuenta?{" "}
            <Link href="/ingresar" className="text-accent font-medium hover:underline">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
