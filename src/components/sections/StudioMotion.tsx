"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { mountStudioMotion, mountStudioParticles } from "@/lib/studio-motion";
import styles from "./StudioHome.module.css";

/** Both React and static service pages run this same motion engine. */
export function StudioMotion({ children, variant = "home" }: { children: ReactNode; variant?: "home" | "page" }) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (rootRef.current) return mountStudioMotion(rootRef.current, variant);
  }, [variant]);
  return <div ref={rootRef} className={`${styles.home} ${variant === "page" ? "studio-subpage" : ""}`} data-motion="off">
    <div className={styles.readingProgress} aria-hidden="true"/>
    {children}
  </div>;
}

export function StudioParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) return mountStudioParticles(canvasRef.current);
  }, []);
  return <canvas ref={canvasRef} className={styles.particleField} aria-hidden="true"/>;
}
