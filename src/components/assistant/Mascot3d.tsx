"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/**
 * サイト内AIアシスタントのキャラクター「CHROMA（クロマ）」。
 *
 * デザイン案「03 AI STUDIO」＝“未来を試作するラボ”に合わせて、
 * 一からつくり直した 3DCG キャラクターです（ドット絵ロボットは廃止）。
 *
 *   - 本体：磨き上げたクロームの多面体コア（環境マップで金属反射）
 *   - 目　：紫に発光する横一文字のスリット。ときどき瞬きする
 *   - 光輪：本体を斜めに囲む紫のリング。ゆっくり回り続ける
 *   - 伴星：リング上を一周する小さな光。「考えている」ことの記号
 *
 * モデルファイル（glTF）は持たず、すべて three のジオメトリから組み立てています。
 *   - 追加のネットワーク取得がない（起動役は初期表示に影響しない位置で遅延読込）
 *   - 色・比率・動きをコードで一元管理でき、テーマ変更に追従できる
 *
 * 性能への配慮：
 *   - devicePixelRatio は最大2
 *   - タブ非表示・画面外ではレンダリングを止める（IntersectionObserver）
 *   - prefers-reduced-motion では静止した1フレームだけ描く
 *   - WebGL が使えない環境では静かに諦め、CSS側のフォールバックに任せる
 */

/** 紫の発光色（デザイン案 03 のアクセント #b67eff） */
const GLOW = 0xb67eff;

export default function Mascot3d({
  className = "",
  onReady,
}: {
  className?: string;
  /** WebGL の初期化に成功した時点で呼ばれる（CSSフォールバックを消すため） */
  onReady?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  // onReady が毎レンダー新しい関数でも、3D を作り直さないよう ref 経由で読む。
  // 代入は描画中ではなく effect の中で行う（描画中の ref 更新は React の規約違反）。
  // この effect を下の初期化より先に書いてあるので、初回でも最新の関数が入っている。
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // GPU 無効環境では描かない（枠だけが残らないよう何も足さない）
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(160, 190, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);
    onReadyRef.current?.();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 160 / 190, 0.1, 40);
    camera.position.set(0, 0.1, 6.4);

    // 金属を金属らしく見せるための環境マップ。
    // 実写HDRを取りに行くとネットワーク取得が発生するため、three 同梱の
    // RoomEnvironment（コードで組み立てた室内）から生成する。
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    const root = new THREE.Group();
    scene.add(root);

    // ---- 本体：クロームの多面体コア -------------------------------------
    const coreGeo = new THREE.IcosahedronGeometry(1.28, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4f0ff,
      metalness: 1,
      roughness: 0.11,
      envMapIntensity: 1.7,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    root.add(core);

    // ---- 顔：暗いバイザー面＋発光スリットの目 ---------------------------
    // 顔まわりだけコアより一段暗く沈めて、目の光を際立たせる。
    const face = new THREE.Group();
    face.position.z = 1.0;
    root.add(face);

    const visorGeo = new THREE.CircleGeometry(0.62, 32);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x0b0711,
      metalness: 0.4,
      roughness: 0.35,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.z = 0.16;
    face.add(visor);

    const eyeGeo = new THREE.CapsuleGeometry(0.075, 0.44, 4, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: GLOW });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.rotation.z = Math.PI / 2; // 横一文字にする
    eye.position.z = 0.2;
    face.add(eye);

    // 目のにじみ（板1枚の加算合成。ポストプロセスを積まずに発光感を出す）
    const bloomGeo = new THREE.PlaneGeometry(1.5, 0.7);
    const bloomMat = new THREE.MeshBasicMaterial({
      color: GLOW,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bloom = new THREE.Mesh(bloomGeo, bloomMat);
    bloom.position.z = 0.19;
    face.add(bloom);

    // ---- 光輪：本体を斜めに囲む紫のリング -------------------------------
    const ringGeo = new THREE.TorusGeometry(2.05, 0.022, 8, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: GLOW,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 - 0.42;
    root.add(ring);

    // 内側にもう一本、逆回転の細いリング（ラボらしい多重構造）
    const ring2Geo = new THREE.TorusGeometry(1.62, 0.012, 8, 72);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xe5d6ff,
      transparent: true,
      opacity: 0.5,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2 - 0.9;
    ring2.rotation.y = 0.5;
    root.add(ring2);

    // ---- 伴星：リング上を回る小さな光 -----------------------------------
    const sparkGeo = new THREE.SphereGeometry(0.085, 12, 12);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const spark = new THREE.Mesh(sparkGeo, sparkMat);
    ring.add(spark);

    // ---- ライト（環境マップだけでは陰影が平坦になるため補う） -----------
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(-2.4, 3, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(GLOW, 22, 12);
    rimLight.position.set(2.2, -1.4, 1.6);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0xb1a0d0, 0.7));

    // ---- ループ ---------------------------------------------------------
    const clock = new THREE.Clock();
    let rafId = 0;
    let running = false;
    /** 画面内にいるか（右下固定なので基本は true。スクロール中の判定用） */
    let onScreen = true;

    const renderFrame = () => {
      const t = clock.getElapsedTime();

      // 本体：ゆっくり漂いながら、わずかに首を振る
      root.position.y = Math.sin(t * 1.05) * 0.09;
      root.rotation.y = Math.sin(t * 0.42) * 0.34;
      root.rotation.x = Math.sin(t * 0.63) * 0.07;
      // コアだけは常に回り続ける（多面体の稜線が光を拾う）
      core.rotation.y = t * 0.28;
      core.rotation.x = t * 0.11;
      // 顔は正面を保つ（コアが回っても目は見え続ける）
      face.rotation.y = -root.rotation.y;

      // 目：5.4秒に一度まばたき（縦に潰す）
      const phase = t % 5.4;
      const blink = phase > 5.1 && phase < 5.28 ? 0.1 : 1;
      eye.scale.x = blink; // 横一文字を回転させているので x が縦方向
      bloom.scale.y = blink;
      // 呼吸するように明滅させ、待機中も「生きている」ように見せる
      bloomMat.opacity = (0.3 + Math.sin(t * 1.9) * 0.1) * blink;

      // 光輪と伴星
      ring.rotation.z = t * 0.5;
      ring2.rotation.z = -t * 0.78;
      spark.position.set(Math.cos(t * 1.6) * 2.05, Math.sin(t * 1.6) * 2.05, 0);

      renderer.render(scene, camera);
    };

    const loop = () => {
      if (!running) return;
      renderFrame();
      rafId = requestAnimationFrame(loop);
    };

    const setRunning = (next: boolean) => {
      if (prefersReducedMotion) return;
      if (next && !running) {
        running = true;
        clock.start();
        loop();
      } else if (!next && running) {
        running = false;
        cancelAnimationFrame(rafId);
      }
    };

    const sync = () => setRunning(onScreen && document.visibilityState === "visible");
    const onVisibility = () => sync();
    document.addEventListener("visibilitychange", onVisibility);

    // 画面外に出たら止める（起動ボタンは固定配置だが、モバイルで隠れる場合がある）
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? true;
      sync();
    });
    io.observe(mount);

    if (prefersReducedMotion) {
      renderFrame(); // 静止した1フレームのみ
    } else {
      sync();
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      [coreGeo, visorGeo, eyeGeo, bloomGeo, ringGeo, ring2Geo, sparkGeo].forEach((g) => g.dispose());
      [coreMat, visorMat, eyeMat, bloomMat, ringMat, ring2Mat, sparkMat].forEach((m) => m.dispose());
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden className={className} />;
}
