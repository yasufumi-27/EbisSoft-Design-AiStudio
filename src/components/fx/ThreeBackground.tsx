"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createLogo3d, LOGO_BLUE } from "./logo3d";

/**
 * サイト全体の3D背景（Three.js）。
 * デザイン案 03「AI STUDIO」＝未来を試作するラボ に合わせた配色・構成です。
 * - 奥行きのあるパーティクル星野（紫／ラベンダー／ミント）
 * - ゆっくり回転するワイヤーフレームの多面体（二重構造。ラボの観測対象）
 * - 床のグリッド（実験室の床面）＋紫のフォグ
 * - マウス追従のパララックス
 *
 * ※ 会社ロゴ（createLogo3d）は**本番とまったく同じモデル・同じ色**のまま使います。
 *   テーマ色を紫に振っても、ロゴだけは触りません。
 *
 * パフォーマンス配慮：
 * - devicePixelRatio を最大2に制限
 * - タブ非表示時はレンダリングを停止
 * - prefers-reduced-motion では静止画を1フレームだけ描画
 */
export default function ThreeBackground() {
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

    // ---- パーティクル星野 -------------------------------------------------
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

    // ---- ワイヤーフレーム多面体（二重・逆回転） ---------------------------
    const core = new THREE.Group();
    const outerGeo = new THREE.IcosahedronGeometry(5.2, 1);
    const outer = new THREE.LineSegments(
      new THREE.WireframeGeometry(outerGeo),
      new THREE.LineBasicMaterial({ color: 0xb67eff, transparent: true, opacity: 0.18 })
    );
    const innerGeo = new THREE.IcosahedronGeometry(3.1, 0);
    const inner = new THREE.LineSegments(
      new THREE.WireframeGeometry(innerGeo),
      new THREE.LineBasicMaterial({ color: 0xaaffdc, transparent: true, opacity: 0.12 })
    );
    core.add(outer, inner);
    core.position.set(9, 2.5, -6);
    scene.add(core);

    // ---- 会社ロゴ（3Dモデル） ---------------------------------------------
    // 立体文字「YEBISU」＋固定の「Soft」＋周りを回るリング＋飛ぶ光。
    // 背景なので、本文の可読性を落とさないよう画面左手（コンテンツ幅の外）に置き、
    // 不透明度も落としている。素材の陰影用に控えめなライトを2つだけ足す。
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xd9c4ff, 1.6);
    keyLight.position.set(-6, 6, 8);
    scene.add(keyLight);

    // 背景シーンには環境マップがないため、金属マテリアルだと真っ黒に沈む。
    // 弱く自己発光する非金属にして、暗い背景でも輪郭が分かるようにする。
    const logo = createLogo3d({
      // リングは文字よりはるかに大きな軌道にして、星（四角い粒）と同じくらいの距離まで広げる
      ringScale: 4,
      lettersMaterial: new THREE.MeshStandardMaterial({
        color: new THREE.Color(LOGO_BLUE),
        emissive: new THREE.Color(0x1a5490),
        emissiveIntensity: 1,
        metalness: 0.15,
        roughness: 0.55,
      }),
    });
    logo.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && !(m as THREE.PointsMaterial).isPointsMaterial) {
        m.transparent = true;
        m.opacity = 0.62;
        m.depthWrite = false;
      }
    });
    logo.group.scale.setScalar(1.4);
    logo.group.position.set(-4, 1, -6);
    logo.group.rotation.y = 0.32;
    scene.add(logo.group);

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
      // スクロールに連動して星野が回り、多面体が沈む（スクロール駆動の奥行き演出）
      const sy = window.scrollY;
      stars.rotation.y = t * 0.014 + sy * 0.00012;
      core.rotation.y = t * 0.12 + sy * 0.0005;
      core.rotation.x = Math.sin(t * 0.18) * 0.25;
      inner.rotation.y = -t * 0.3;
      core.position.y = 2.5 + Math.sin(t * 0.5) * 0.5 - Math.min(sy * 0.0012, 4);
      // ロゴはリングと光だけが動き、文字はゆっくり漂わせる
      logo.update(t);
      logo.group.rotation.y = 0.1 + Math.sin(t * 0.14) * 0.12;
      logo.group.position.y = 1 + Math.sin(t * 0.3) * 0.4 - Math.min(sy * 0.0009, 3.5);
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
      outerGeo.dispose();
      innerGeo.dispose();
      outer.geometry.dispose();
      (outer.material as THREE.Material).dispose();
      inner.geometry.dispose();
      (inner.material as THREE.Material).dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      logo.dispose();
      (logo.letters.material as THREE.Material).dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10" />
  );
}
