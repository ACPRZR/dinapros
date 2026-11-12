"use client";

import { useRef, useState, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Observer } from "gsap/Observer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(Observer, useGSAP);

export type ScrollSyncItem = {
  index: string;
  title: string;
  description: string;
  href: string;
};

export default function ScrollSyncShowcase({
  items,
  headerText,
}: {
  items: ScrollSyncItem[];
  headerText?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const goToIndex = useCallback((idx: number) => {
    activeRef.current = idx;
    setActive(idx);
    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      );
    }
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        let cooldown = false;

        const observer = Observer.create({
          target: containerRef.current,
          type: "wheel,touch",
          tolerance: 50,
          preventDefault: true,
          onDown: () => {
            if (cooldown || activeRef.current >= items.length - 1) return;
            cooldown = true;
            goToIndex(activeRef.current + 1);
            setTimeout(() => {
              cooldown = false;
            }, 350);
          },
          onUp: () => {
            if (cooldown || activeRef.current <= 0) return;
            cooldown = true;
            goToIndex(activeRef.current - 1);
            setTimeout(() => {
              cooldown = false;
            }, 350);
          },
        });

        return () => {
          observer.kill();
        };
      });
    },
    { scope: containerRef, dependencies: [items.length, goToIndex] },
  );

  return (
    <>
      {/* Desktop — Observer-based scroll */}
      <div
        ref={containerRef}
        className="hidden md:block h-screen overflow-hidden"
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between px-12 pt-6 pb-4">
            <span className="text-xs font-medium text-dim tracking-[0.3em] uppercase">
              DESLIZA HACIA ABAJO
            </span>
            {headerText && (
              <span className="text-sm text-fg/70 max-w-xs text-right">
                {headerText}
              </span>
            )}
          </div>

          {/* Main content */}
          <div className="flex-1 flex items-center px-12 gap-8">
            {/* Left: index */}
            <div className="w-1/2 flex flex-col gap-6">
              {items.map((item, i) => (
                <button
                  key={i}
                  onClick={() => goToIndex(i)}
                  className={`text-left text-4xl lg:text-5xl font-bold tracking-tight transition-all duration-300 ${
                    i === active
                      ? "text-fg opacity-100"
                      : "text-dim hover:text-hover"
                  }`}
                >
                  {item.title}
                  {i === active && (
                    <span className="block h-0.5 w-12 bg-accent mt-2" />
                  )}
                </button>
              ))}
            </div>

            {/* Right: viewer */}
            <div ref={contentRef} className="w-1/2 flex flex-col justify-center gap-4">
              <p className="font-mono text-sm text-accent">
                {items[active].index}
              </p>
              <h2 className="text-2xl font-bold text-fg">
                {items[active].title}
              </h2>
              <p className="text-fg/60 text-base leading-relaxed">
                {items[active].description}
              </p>
              <Link
                href={items[active].href}
                className="inline-flex items-center gap-2 bg-accent text-fg font-semibold rounded-lg px-6 py-3 text-sm w-fit hover:bg-hover hover:text-base transition-colors mt-4"
              >
                Acceder
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Bottom counter */}
          <div className="px-12 py-6">
            <p className="font-mono text-xs text-dim">
              {items[active].index} — {items[active].title.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden">
        {items.map((item, i) => (
          <div
            key={i}
            className="min-h-screen flex flex-col justify-center px-6 gap-4 border-b border-edge"
          >
            <p className="font-mono text-sm text-accent">{item.index}</p>
            <h2 className="text-3xl font-bold text-fg">{item.title}</h2>
            <p className="text-fg/60 text-base leading-relaxed">
              {item.description}
            </p>
            <Link
              href={item.href}
              className="inline-flex items-center gap-2 bg-accent text-fg font-semibold rounded-lg px-6 py-3 text-sm w-fit hover:bg-hover hover:text-base transition-colors mt-2"
            >
              Acceder
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
