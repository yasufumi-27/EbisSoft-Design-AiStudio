"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./StudioHome.module.css";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Event-driven motion; copy and links remain server-rendered and usable without JS. */
export function StudioMotion({ children, variant = "home" }: { children: ReactNode; variant?: "home" | "page" }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (variant === "page") {
      root.querySelectorAll<HTMLElement>(".studio-hero, .ai-page-head, .studio-flight > article, .studio-board, .studio-stats, .studio-final, .ai-index > article, .ai-shelf > article").forEach(el => el.setAttribute("data-motion-section", ""));
      root.querySelectorAll<HTMLElement>(".ai-console-grid > a, .ai-console-grid > div, .ai-shelf > article, .ai-index > article").forEach((el, index) => {
        el.dataset.tilt = "soft";
        if (!el.hasAttribute("data-reveal")) el.dataset.enter = String((index % 3) * 90);
      });
      root.querySelectorAll<HTMLElement>(".studio-actions a, .ai-shelf-actions .ai-btn").forEach(el => el.setAttribute("data-magnetic", ""));
    }
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose = () => {};

    const configure = () => {
      dispose();
      const enabled = !preference.matches;
      root.dataset.motion = enabled ? "on" : "off";
      root.dispatchEvent(new CustomEvent("studio-motion", { detail: enabled }));
      if (!enabled) return;

      const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-motion-section]"));
      const enterElements = Array.from(root.querySelectorAll<HTMLElement>("[data-enter]"));
      const animations = new Set<Animation>();
      const observed = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          el.dataset.visible = String(entry.isIntersecting);
          if (entry.isIntersecting && el.hasAttribute("data-enter") && !el.dataset.entered) {
            el.dataset.entered = "true";
            const animation = el.animate([
              { opacity: .1, translate: "0 65px", filter: "blur(8px)" },
              { opacity: 1, translate: "0 0", filter: "blur(0px)" },
            ], { duration: 1000, delay: Number(el.dataset.enter || 0), easing: "cubic-bezier(.16,1,.3,1)" });
            animations.add(animation);
            animation.onfinish = () => animations.delete(animation);
          }
        }
      }, { threshold: 0, rootMargin: "0px 0px -5% 0px" });
      [...sections, ...enterElements].forEach(el => observed.observe(el));

      let frame = 0;
      let scrollDirty = true;
      let active: HTMLElement | null = null;
      let button: HTMLElement | null = null;
      let aimX = 0, aimY = 0, x = 0, y = 0;
      let buttonX = 0, buttonY = 0;
      const fine = window.matchMedia("(hover: hover) and (pointer: fine)");

      const render = () => {
        frame = 0;
        if (document.hidden) return;
        if (scrollDirty) {
          // Batch layout reads before CSS writes. Nothing is read on idle frames.
          const rects = sections.map(el => el.getBoundingClientRect());
          const height = window.innerHeight;
          const total = Math.max(1, document.documentElement.scrollHeight - height);
          root.style.setProperty("--page-progress", String(clamp(window.scrollY / total, 0, 1)));
          sections.forEach((el, index) => {
            const rect = rects[index];
            const progress = clamp((height - rect.top) / (height + rect.height), 0, 1);
            el.style.setProperty("--section-progress", progress.toFixed(4));
            el.style.setProperty("--section-shift", `${((progress - .5) * 100).toFixed(2)}px`);
            if (index === 0) {
              const exit = clamp(-rect.top / Math.max(1, rect.height), 0, 1);
              el.style.setProperty("--hero-exit", exit.toFixed(4));
            }
          });
          scrollDirty = false;
        }
        x += (aimX - x) * .14;
        y += (aimY - y) * .14;
        if (active) {
          const power = active.dataset.tilt === "soft" ? .4 : 1;
          active.style.setProperty("--tilt-x", `${(-y * 9 * power).toFixed(2)}deg`);
          active.style.setProperty("--tilt-y", `${(x * 11 * power).toFixed(2)}deg`);
          active.style.setProperty("--shine-x", `${50 + x * 50}%`);
          active.style.setProperty("--shine-y", `${50 + y * 50}%`);
        }
        if (button) {
          button.style.setProperty("--magnet-x", `${buttonX}px`);
          button.style.setProperty("--magnet-y", `${buttonY}px`);
        }
        if (Math.abs(x - aimX) + Math.abs(y - aimY) > .002) frame = requestAnimationFrame(render);
      };
      const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
      const onScroll = () => { scrollDirty = true; schedule(); };
      const clearActive = () => {
        if (active) {
          active.removeAttribute("data-hover");
          ["--tilt-x", "--tilt-y", "--shine-x", "--shine-y"].forEach(key => active?.style.removeProperty(key));
        }
        active = null;
        if (button) {
          button.style.removeProperty("--magnet-x");
          button.style.removeProperty("--magnet-y");
        }
        button = null;
        aimX = aimY = x = y = 0;
      };
      const onPointer = (event: PointerEvent) => {
        if (!fine.matches || event.pointerType === "touch") return;
        const target = event.target as Element;
        const next = target.closest<HTMLElement>("[data-tilt]");
        const nextButton = target.closest<HTMLElement>("[data-magnetic]");
        if (next !== active || nextButton !== button) { clearActive(); active = next; button = nextButton; }
        if (active) {
          const rect = active.getBoundingClientRect();
          aimX = clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
          aimY = clamp((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
          active.dataset.hover = "true";
        }
        if (button) {
          const rect = button.getBoundingClientRect();
          buttonX = clamp((event.clientX - rect.left - rect.width / 2) * .18, -12, 12);
          buttonY = clamp((event.clientY - rect.top - rect.height / 2) * .2, -7, 7);
        }
        schedule();
      };
      const visibility = () => {
        root.dataset.background = String(document.hidden);
        if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
        else onScroll();
      };
      root.addEventListener("pointermove", onPointer, { passive: true });
      root.addEventListener("pointerleave", clearActive);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      document.addEventListener("visibilitychange", visibility);
      const resize = new ResizeObserver(onScroll);
      resize.observe(root);
      visibility();
      dispose = () => {
        observed.disconnect();
        resize.disconnect();
        cancelAnimationFrame(frame);
        animations.forEach(animation => animation.cancel());
        clearActive();
        sections.forEach(el => {
          el.style.removeProperty("--section-shift");
          el.style.removeProperty("--hero-exit");
        });
        root.removeEventListener("pointermove", onPointer);
        root.removeEventListener("pointerleave", clearActive);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        document.removeEventListener("visibilitychange", visibility);
      };
    };
    configure();
    preference.addEventListener("change", configure);
    return () => { dispose(); preference.removeEventListener("change", configure); };
  }, [variant]);

  return <div ref={rootRef} className={`${styles.home} ${variant === "page" ? "studio-subpage" : ""}`} data-motion="off">
    <div className={styles.readingProgress} aria-hidden="true"/>
    {children}
  </div>;
}

/** A projected, breathing torus built from particles, without a WebGL dependency. */
export function StudioParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    const hero = canvas?.closest<HTMLElement>("[data-motion-section]");
    const root = canvas?.closest<HTMLElement>("[data-motion]");
    if (!canvas || !context || !hero || !root) return;
    let width = 1, height = 1, frame = 0, previous = 0, time = 0;
    let inView = true, enabled = root.dataset.motion === "on";
    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0, scroll = 0;
    let pointerInside = false, influence = 0;
    const colors = ["#bba8ff", "#859cff", "#80d7f9", "#e4d8ff"];
    const particles = Array.from({ length: 1500 }, (_, i) => ({
      u: (i * 2.3999632297) % (Math.PI * 2),
      v: ((i * .61803398875) % 1) * Math.PI * 2,
      radius: .8 + ((i * 17) % 23) / 20,
      color: colors[i % colors.length],
    }));
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const radius = Math.min(width * .34, height * .44, 390);
      const rotation = time * .16 + scroll * 1.8 + smoothX * .18;
      const tilt = .45 + Math.sin(time * .24) * .17 + smoothY * .18 + scroll * .6;
      const ca = Math.cos(rotation), sa = Math.sin(rotation);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const count = width < 600 ? 700 : particles.length;
      context.globalCompositeOperation = "lighter";
      if (influence > .01) {
        const glowX = (smoothX + 1) * width / 2;
        const glowY = (smoothY + 1) * height / 2;
        const glow = context.createRadialGradient(glowX, glowY, 0, glowX, glowY, 160);
        glow.addColorStop(0, "#a4adff22");
        glow.addColorStop(1, "#a4adff00");
        context.globalAlpha = influence;
        context.fillStyle = glow;
        context.fillRect(glowX - 160, glowY - 160, 320, 320);
      }
      for (let i = 0; i < count; i++) {
        const particle = particles[i];
        const wave = Math.sin(particle.u * 3 + time * .6) * 12;
        const tube = radius * .18 + wave;
        const u = particle.u + time * .075;
        const r = radius + Math.cos(particle.v) * tube;
        const px = Math.cos(u) * r;
        const py = Math.sin(u) * r;
        const pz = Math.sin(particle.v) * tube + Math.sin(u * 2 + time * .4) * radius * .14;
        const rx = px * ca - pz * sa;
        const rz = px * sa + pz * ca;
        const ry = py * ct - rz * st;
        const z = py * st + rz * ct;
        const perspective = 900 / (900 + z);
        let x = width / 2 + rx * perspective;
        let y = height * .48 + ry * perspective;
        const dx = x - (smoothX + 1) * width / 2;
        const dy = y - (smoothY + 1) * height / 2;
        const distance = Math.hypot(dx, dy);
        if (distance < 150 && distance > 1) {
          const force = (1 - distance / 150) ** 2 * 65 * influence;
          x += dx / distance * force;
          y += dy / distance * force;
        }
        context.globalAlpha = clamp(.48 + z / (radius * 2), .16, .88);
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(x, y, particle.radius * perspective, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = "source-over";
    };
    const tick = (now: number) => {
      frame = 0;
      if (!enabled || !inView || document.hidden) return;
      if (now - previous > 32) {
        time += Math.min((now - previous) / 1000, .05);
        previous = now;
        smoothX += (pointerX - smoothX) * .055;
        smoothY += (pointerY - smoothY) * .055;
        influence += ((pointerInside ? 1 : 0) - influence) * .08;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = performance.now();
      if (enabled && inView && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const resize = new ResizeObserver(() => {
      width = hero.clientWidth;
      height = hero.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      draw();
      start();
    });
    const observe = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; start(); });
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointerInside = true;
      const rect = hero.getBoundingClientRect();
      pointerX = (event.clientX - rect.left) / width * 2 - 1;
      pointerY = (event.clientY - rect.top) / height * 2 - 1;
    };
    const resetPointer = () => { pointerInside = false; pointerX = pointerY = 0; };
    const onScroll = () => { if (inView) scroll = clamp(-hero.getBoundingClientRect().top / height, 0, 1); };
    const onMotion = (event: Event) => { enabled = (event as CustomEvent<boolean>).detail; start(); };
    resize.observe(hero);
    observe.observe(hero);
    hero.addEventListener("pointermove", onPointer, { passive: true });
    hero.addEventListener("pointerleave", resetPointer);
    root.addEventListener("studio-motion", onMotion);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", start);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observe.disconnect();
      hero.removeEventListener("pointermove", onPointer);
      hero.removeEventListener("pointerleave", resetPointer);
      root.removeEventListener("studio-motion", onMotion);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", start);
    };
  }, []);
  return <canvas ref={canvasRef} className={styles.particleField} aria-hidden="true"/>;
}
