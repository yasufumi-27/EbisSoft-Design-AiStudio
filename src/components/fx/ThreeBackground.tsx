"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createScene, type SceneId } from "./bgScenes";

/**
 * サイト全体の3D背景（Three.js）。
 * デザイン案 03「AI STUDIO」＝未来を試作するラボ に合わせた配色・構成です。
 *
 * - 奥行きのあるパーティクル星野（紫／ラベンダー／ミント）
 * - **ページごとに違う主役の立体**（`bgScenes.ts`）。球・星形・環・核など、
 *   トップページの ONE CONTINUOUS FLIGHT と同じ語彙を立体にしたもの
 * - 床のグリッド（実験室の床面）＋紫のフォグ
 * - マウス追従のパララックス
 *
 * ※ 以前は会社ロゴの立体モデルを背景に置いていましたが、撤去しました。
 *   ロゴはヘッダー・フッターの2Dロゴだけが担い、背景は**そのページの内容**を表します。
 *
 * パフォーマンス配慮：
 * - devicePixelRatio を最大2に制限
 * - タブ非表示時はレンダリングを停止
 * - prefers-reduced-motion では静止画を1フレームだけ描画
 */
export default function ThreeBackground({ sceneId }: { sceneId: SceneId }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07050e, 0.028);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );
    camera.position.set(0, 1.2, 16);

    // WebGLが使えない環境（GPU無効・古い端末・一部の企業ポリシー）では
    // WebGLRenderer のコンストラクタが例外を投げる。背景は装飾なので、
    // ここで捕まえて静かに諦める（捕まえないとページ全体が落ちる）。
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // 背景色はCSS側（--color-ink）に任せる
    mount.appendChild(renderer.domElement);

    // ---- パーティクル星野（全ページ共通の下地） ---------------------------
    const COUNT = 1600;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const palette = [
      new THREE.Color(0xb67eff), // 紫の発光（ブランド）
      new THREE.Color(0xe5d6ff), // ラベンダー
      new THREE.Color(0xaaffdc), // ミント（計測値のアクセント）
      new THREE.Color(0xc4a0ff), // 淡い紫
    ];
    for (let i = 0; i < COUNT; i++) {
      // 中心をやや避けたドーナツ状の分布で、テキスト背後の密度を下げる
      const r = 10 + Math.random() * 34;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 30;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r - 10;
      // ミントは少数精鋭（1割）。ラボの計測値が光る程度に留める
      const nonMint = [palette[0], palette[1], palette[3]];
      const c = Math.random() < 0.1 ? palette[2] : nonMint[Math.floor(Math.random() * 3)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---- そのページの主役（ページごとに形が変わる） -----------------------
    // 本文の可読性を落とさないよう、画面の右手（コンテンツ幅の外）へ寄せる。
    const pageScene = createScene(sceneId);
    pageScene.group.position.set(8, 1.5, -8);
    scene.add(pageScene.group);

    // 立体の陰影用に控えめなライトを2つだけ足す
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xd9c4ff, 1.6);
    keyLight.position.set(-6, 6, 8);
    scene.add(keyLight);

    // ---- 床グリッド（遠近感の演出。フォグで水平線に溶ける） ---------------
    const grid = new THREE.GridHelper(160, 64, 0x5a2f96, 0x241638);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    grid.position.y = -7.5;
    scene.add(grid);

    // ---- インタラクション・ループ -----------------------------------------
    const mouse = { x: 0, y: 0 };
    const onPointerMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const clock = new THREE.Clock();
    let rafId = 0;
    let running = true;

    const renderFrame = () => {
      const t = clock.getElapsedTime();
      // スクロールに連動して星野が回り、主役の立体が沈む（スクロール駆動の奥行き演出）
      const sy = window.scrollY;
      stars.rotation.y = t * 0.014 + sy * 0.00012;
      pageScene.update(t, sy);
      pageScene.group.position.y = 1.5 + Math.sin(t * 0.4) * 0.5 - Math.min(sy * 0.0012, 4);
      // マウスに緩やかに追従するパララックス
      camera.position.x += (mouse.x * 1.6 - camera.position.x) * 0.03;
      camera.position.y += (1.2 - mouse.y * 1.0 - camera.position.y) * 0.03;
      camera.lookAt(0, 0.5, 0);
      renderer.render(scene, camera);
    };

    const loop = () => {
      if (!running) return;
      renderFrame();
      rafId = requestAnimationFrame(loop);
    };

    const onVisibility = () => {
      const visible = document.visibilityState === "visible";
      if (visible && !running && !prefersReducedMotion) {
        running = true;
        clock.start();
        loop();
      } else if (!visible && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    if (prefersReducedMotion) {
      running = false;
      renderFrame(); // 静止した1フレームのみ描画
    } else {
      window.addEventListener("pointermove", onPointerMove);
      loop();
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);
      starGeo.dispose();
      starMat.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      pageScene.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [sceneId]);

  return (
    <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
  );
}
