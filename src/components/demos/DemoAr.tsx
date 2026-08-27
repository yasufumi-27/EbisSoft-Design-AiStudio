"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ChipButton, ControlGroup, DemoStage, RangeControl } from "./DemoUi";
import { Icon } from "@/components/ui/icons";
import {
  createIndustryModel,
  INDUSTRY_MODEL_LABEL,
  type IndustryModelKey,
} from "./industryModels";

/* ------------------------------------------------------------------
 * 商品データ（実寸ミリメートル）
 * 実案件ではお客様のCAD / glTFを読み込みます。
 * ここでは寸法の正しさを見せるため、プリミティブで組んだモデルを使います。
 * ---------------------------------------------------------------- */

/** 標準の家具4種に加え、職種別モデル（key = "industry"）が入ることがある */
type ProductKey = string;

type Product = {
  key: ProductKey;
  name: string;
  /** 実寸（mm）：幅・奥行・高さ */
  size: [number, number, number];
  price: number;
  build: (color: THREE.ColorRepresentation) => THREE.Group;
};

function woodMat(color: THREE.ColorRepresentation) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05 });
}
function metalMat() {
  return new THREE.MeshStandardMaterial({ color: 0x3a4152, roughness: 0.35, metalness: 0.85 });
}
function boxAt(w: number, h: number, d: number, x: number, y: number, z: number, m: THREE.Material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  return mesh;
}

const PRODUCTS: Product[] = [
  {
    key: "chair",
    name: "ダイニングチェア",
    size: [450, 500, 820],
    price: 38000,
    build: (color) => {
      const g = new THREE.Group();
      const w = woodMat(color);
      const m = metalMat();
      g.add(boxAt(0.45, 0.04, 0.45, 0, 0.43, 0, w));
      g.add(boxAt(0.45, 0.36, 0.04, 0, 0.63, -0.2, w));
      for (const [x, z] of [
        [0.19, 0.19],
        [-0.19, 0.19],
        [0.19, -0.19],
        [-0.19, -0.19],
      ]) {
        g.add(boxAt(0.03, 0.43, 0.03, x, 0.215, z, m));
      }
      return g;
    },
  },
  {
    key: "table",
    name: "ダイニングテーブル",
    size: [1400, 800, 720],
    price: 128000,
    build: (color) => {
      const g = new THREE.Group();
      const w = woodMat(color);
      const m = metalMat();
      g.add(boxAt(1.4, 0.05, 0.8, 0, 0.7, 0, w));
      for (const [x, z] of [
        [0.62, 0.32],
        [-0.62, 0.32],
        [0.62, -0.32],
        [-0.62, -0.32],
      ]) {
        g.add(boxAt(0.05, 0.68, 0.05, x, 0.34, z, m));
      }
      return g;
    },
  },
  {
    key: "lamp",
    name: "フロアランプ",
    size: [320, 320, 1550],
    price: 46000,
    build: (color) => {
      const g = new THREE.Group();
      const m = metalMat();
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32), m);
      base.position.y = 0.015;
      g.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.4, 16), m);
      pole.position.y = 0.72;
      g.add(pole);
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.17, 0.26, 32, 1, true),
        new THREE.MeshStandardMaterial({
          color,
          roughness: 0.9,
          side: THREE.DoubleSide,
          emissive: new THREE.Color(color).multiplyScalar(0.25),
        }),
      );
      shade.position.y = 1.42;
      g.add(shade);
      const bulb = new THREE.PointLight(0xffe6b0, 6, 4);
      bulb.position.y = 1.4;
      g.add(bulb);
      return g;
    },
  },
  {
    key: "shelf",
    name: "オープンシェルフ",
    size: [800, 300, 1800],
    price: 72000,
    build: (color) => {
      const g = new THREE.Group();
      const w = woodMat(color);
      g.add(boxAt(0.025, 1.8, 0.3, -0.39, 0.9, 0, w));
      g.add(boxAt(0.025, 1.8, 0.3, 0.39, 0.9, 0, w));
      for (let i = 0; i < 5; i += 1) {
        g.add(boxAt(0.78, 0.025, 0.3, 0, 0.05 + i * 0.43, 0, w));
      }
      return g;
    },
  },
];

/* ------------------------------------------------------------------
 * 職種別モデルをAR用に取り込む
 *
 * `industryModels.ts` のモデルは「見せるための大きさ」で作ってあるため、
 * ARでは**実寸（メートル）に直し、床の上に載せる**必要があります。
 * バウンディングボックスから縮尺を求めて合わせます。
 * ---------------------------------------------------------------- */

/** 職種別モデルの実寸（W × D × H、ミリメートル） */
const INDUSTRY_AR_SIZE: Record<IndustryModelKey, [number, number, number]> = {
  cup: [120, 100, 100],
  teapot: [220, 180, 130],
  "gift-box": [320, 240, 200],
  dish: [300, 300, 90],
  "coffee-set": [420, 240, 260],
  bento: [260, 200, 120],
  "dental-unit": [1900, 1000, 1500],
  "medical-cart": [600, 450, 950],
  "waiting-sofa": [1800, 900, 800],
  "machine-part": [220, 220, 190],
  gearbox: [420, 260, 300],
  conveyor: [3000, 900, 1100],
  floorplan: [1800, 1400, 400],
  apartment: [12000, 9000, 15000],
  kitchen: [2550, 900, 2300],
  house: [3600, 3000, 2600],
  "timber-frame": [5400, 4000, 4200],
  deck: [3600, 3200, 1000],
  desk: [1200, 700, 780],
  whiteboard: [1800, 600, 1900],
  bookshelf: [900, 300, 1800],
  documents: [450, 320, 220],
  "consult-table": [1400, 1600, 750],
  cabinet: [900, 500, 1350],
  "salon-chair": [720, 900, 1100],
  "shampoo-basin": [900, 1700, 1300],
  "salon-cart": [500, 400, 900],
  dumbbell: [420, 260, 260],
  "bench-press": [1900, 1300, 1300],
  treadmill: [1900, 850, 1400],
  guestroom: [2400, 1900, 800],
  "open-air-bath": [2600, 2600, 1100],
  "front-desk": [2800, 1600, 2200],
  truck: [4700, 1900, 2400],
  pallet: [1100, 1100, 1500],
  forklift: [2600, 1200, 2100],
  wheel: [660, 660, 260],
  "car-body": [4600, 1800, 1450],
  "car-lift": [4600, 3000, 2800],
  crate: [600, 400, 330],
  greenhouse: [5000, 3600, 2100],
  tractor: [3600, 1900, 2400],
  arch: [2400, 700, 2400],
  "banquet-table": [1600, 1600, 800],
  cake: [700, 700, 900],
  "care-bed": [2000, 1000, 700],
  wheelchair: [1100, 700, 950],
  "care-bath": [1700, 1500, 900],
  server: [600, 900, 1900],
  workstation: [1600, 1400, 1100],
  "monitor-wall": [3000, 1200, 2200],
  garment: [520, 520, 1650],
  sneaker: [290, 110, 130],
  handbag: [340, 140, 300],
};

/** 職種別モデルを、実寸・床置きの状態に整えて Product にする */
function industryProduct(key: IndustryModelKey): Product {
  const size = INDUSTRY_AR_SIZE[key];
  return {
    key: `industry-${key}`,
    name: INDUSTRY_MODEL_LABEL[key],
    size,
    price: 0,
    build: (color) => {
      const built = createIndustryModel(key, woodMat(color));
      const inner = built.group;

      // いったん置いてから採寸し、指定の実寸に収まる縮尺を求める
      const box = new THREE.Box3().setFromObject(inner);
      const dim = new THREE.Vector3();
      box.getSize(dim);
      const scale = Math.min(
        size[0] / 1000 / (dim.x || 1),
        size[1] / 1000 / (dim.z || 1),
        size[2] / 1000 / (dim.y || 1),
      );
      inner.scale.multiplyScalar(scale);

      // 床（y = 0）に載せ、水平方向の中心を原点に合わせる
      const box2 = new THREE.Box3().setFromObject(inner);
      inner.position.y -= box2.min.y;
      inner.position.x -= (box2.min.x + box2.max.x) / 2;
      inner.position.z -= (box2.min.z + box2.max.z) / 2;

      const wrap = new THREE.Group();
      wrap.add(inner);
      return wrap;
    },
  };
}

const COLORS = [
  { hex: 0xb98a5a, label: "オーク" },
  { hex: 0x6b4a33, label: "ウォルナット" },
  { hex: 0xf1eee8, label: "ホワイト" },
  { hex: 0x2c3140, label: "チャコール" },
];

/** 表示モード */
type Mode = "preview" | "xr" | "camera";

type SceneApi = {
  setProduct: (k: ProductKey) => void;
  setColor: (hex: number) => void;
  setHuman: (v: boolean) => void;
  setDistance: (m: number) => void;
  setMode: (m: Mode) => void;
  startXr: () => Promise<void>;
  spin: (deg: number) => void;
};

/* ------------------------------------------------------------------
 * 端末の傾き → カメラの向き（three の DeviceOrientationControls と同じ変換）
 * ---------------------------------------------------------------- */
const ZEE = new THREE.Vector3(0, 0, 1);
const EULER = new THREE.Euler();
const Q0 = new THREE.Quaternion();
const Q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));

function applyDeviceOrientation(
  q: THREE.Quaternion,
  alpha: number,
  beta: number,
  gamma: number,
  screenOrient: number,
) {
  EULER.set(beta, alpha, -gamma, "YXZ");
  q.setFromEuler(EULER);
  q.multiply(Q1);
  q.multiply(Q0.setFromAxisAngle(ZEE, -screenOrient));
}

/**
 * AR デモ。
 *
 * 3つの表示モードを、端末の対応状況に応じて出し分けます。
 * 1. WebXR（immersive-ar）… Android Chrome など。床を検出して置ける本来のAR
 * 2. カメラ重ね合わせ      … iOS / macOS Safari 向け。カメラ映像に実物大で合成し、
 *                            端末の傾き（ジャイロ）で見回せる。iOSでも動く
 * 3. 実寸プレビュー        … カメラが使えない環境。部屋を模した空間に実寸で配置
 *
 * いずれも同じ Three.js シーンで、寸法は実寸（メートル単位）です。
 */
export default function DemoAr({
  models,
  productLabel,
}: {
  /**
   * 職種別の3Dモデル（3種類以上）。渡されたときは**それだけ**を並べます。
   * 汎用の家具サンプルは、職種が決まっているページでは出しません。
   */
  models?: IndustryModelKey[];
  /** 本番で何に置き換わるか（注記に使う） */
  productLabel?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---- 最新の値をアニメーションループから読むための参照 ---- */
  const humanRef = useRef(true);
  const distanceRef = useRef(3);
  const colorRef = useRef<number>(COLORS[0].hex);
  const gyroRef = useRef<"unknown" | "active" | "unavailable">("unknown");

  // 職種別モデルがあるときは、そのモデルだけを並べる（汎用サンプルは出さない）
  const products = useMemo(
    () => (models && models.length > 0 ? models.map(industryProduct) : PRODUCTS),
    [models],
  );
  const [product, setProduct] = useState<ProductKey>(products[0].key);
  const [color, setColor] = useState(COLORS[0].hex);
  const [human, setHuman] = useState(true);
  const [distance, setDistance] = useState(3);
  const [mode, setMode] = useState<Mode>("preview");
  const [xrSupported, setXrSupported] = useState<boolean | null>(null);
  const [cameraSupported, setCameraSupported] = useState<boolean | null>(null);
  const [gyro, setGyro] = useState<"unknown" | "active" | "unavailable">("unknown");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const current = products.find((p) => p.key === product) ?? products[0];

  /* ---------------- シーン構築 ---------------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      queueMicrotask(() => setMessage("この環境ではWebGLが利用できません。"));
      return;
    }

    const width = mount.clientWidth || 600;
    const height = mount.clientHeight || 420;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.position = "relative";
    renderer.domElement.style.touchAction = "pan-y";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 60);
    camera.position.set(0, 1.5, 3);

    // ---- 部屋（実寸プレビュー用） ----
    const room = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a2f3d, roughness: 0.95 }),
    );
    floor.rotation.x = -Math.PI / 2;
    room.add(floor);
    const grid = new THREE.GridHelper(12, 24, 0x22d3ee, 0x334155);
    (grid.material as THREE.Material).opacity = 0.25;
    (grid.material as THREE.Material).transparent = true;
    grid.position.y = 0.002;
    room.add(grid);
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 5),
      new THREE.MeshStandardMaterial({ color: 0x1b2130, roughness: 1 }),
    );
    backWall.position.set(0, 2.5, -4);
    room.add(backWall);
    scene.add(room);

    // ---- ライト ----
    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1f2b, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x22d3ee, 0.9);
    fill.position.set(-4, 2, 2);
    scene.add(fill);

    // ---- 人物シルエット（170cm） ----
    const person = new THREE.Group();
    const silMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.28,
    });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.86, 6, 16), silMat);
    body.position.y = 0.95;
    person.add(body);
    const headM = new THREE.Mesh(new THREE.SphereGeometry(0.115, 20, 16), silMat);
    headM.position.y = 1.585;
    person.add(headM);
    person.position.set(0.95, 0, 0);
    scene.add(person);

    // ---- 接地を分かりやすくする影の代わりの楕円 ----
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.6, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    shadow.visible = false;
    scene.add(shadow);

    // ---- 商品 ----
    let productGroup = products[0].build(COLORS[0].hex);
    scene.add(productGroup);

    const disposeGroup = (g: THREE.Object3D) => {
      g.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
    };

    /* ---- モードごとのシーン状態 ---- */
    let mode: Mode = "preview";
    let spinY = 0;
    // 見回し用（ジャイロが無い環境ではドラッグで操作する）
    let yaw = 0;
    let pitch = 0;

    const applyMode = (next: Mode) => {
      mode = next;
      const overlay = next !== "preview";
      room.visible = !overlay;
      person.visible = !overlay && humanRef.current;
      shadow.visible = overlay;
      if (overlay) {
        // カメラは原点＝目の高さ（床は 1.45m 下）。商品は少し先の床に置く
        const z = -distanceRef.current;
        productGroup.position.set(0, -1.45, z);
        shadow.position.set(0, -1.446, z);
        camera.position.set(0, 0, 0);
        // ジャイロが無い環境でも商品が画面に入るよう、初期は少し下を向く
        yaw = 0;
        pitch = -0.3;
        camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
      } else {
        productGroup.position.set(0, 0, 0);
        camera.position.set(0, 1.45, distanceRef.current);
        camera.lookAt(0, 0.55, 0);
      }
    };

    /* ---- 端末の傾きでカメラを動かす ---- */
    let orientation: { alpha: number; beta: number; gamma: number } | null = null;
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null && e.beta === null && e.gamma === null) return;
      orientation = {
        alpha: THREE.MathUtils.degToRad(e.alpha ?? 0),
        beta: THREE.MathUtils.degToRad(e.beta ?? 0),
        gamma: THREE.MathUtils.degToRad(e.gamma ?? 0),
      };
      if (gyroRef.current !== "active") setGyro("active");
    };
    window.addEventListener("deviceorientation", onOrientation);

    /* ---- ジャイロが無い環境（macOS等）はドラッグで見回す ---- */
    let dragging = false;
    let last = { x: 0, y: 0 };
    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      if (mode === "preview") {
        // プレビューでは商品を回す
        spinY += dx * 0.008;
      } else {
        // 重ね合わせでは見回す
        yaw -= dx * 0.004;
        pitch = THREE.MathUtils.clamp(pitch - dy * 0.004, -1.2, 1.2);
      }
    };
    const onUp = (e: PointerEvent) => {
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    apiRef.current = {
      setProduct: (k) => {
        const def = products.find((p) => p.key === k);
        if (!def) return;
        scene.remove(productGroup);
        disposeGroup(productGroup);
        productGroup = def.build(colorRef.current);
        productGroup.rotation.y = spinY;
        scene.add(productGroup);
        applyMode(mode);
      },
      setColor: (hex) => {
        productGroup.traverse((o) => {
          const mesh = o as THREE.Mesh;
          const m = mesh.material as THREE.MeshStandardMaterial | undefined;
          if (m && "color" in m && m.metalness < 0.5) m.color.set(hex);
        });
      },
      setHuman: (v) => {
        person.visible = v && mode === "preview";
      },
      setDistance: (m) => {
        if (mode === "preview") {
          camera.position.set(0, 1.45, m);
          camera.lookAt(0, 0.55, 0);
        } else {
          // 重ね合わせでは「どれくらい先の床に置くか」を変える
          productGroup.position.z = -m;
          shadow.position.z = -m;
        }
      },
      setMode: applyMode,
      spin: (deg) => {
        spinY += THREE.MathUtils.degToRad(deg);
      },
      startXr: async () => {
        const xr = navigator.xr;
        if (!xr) return;
        const session = await xr.requestSession("immersive-ar", {
          requiredFeatures: ["local-floor"],
          optionalFeatures: ["hit-test", "dom-overlay"],
          domOverlay: { root: mount },
        });
        await renderer.xr.setSession(session);
        applyMode("xr");
        // XRでは床が原点なので、y=0 に置き直す
        productGroup.position.set(0, 0, -distanceRef.current);
        shadow.position.set(0, 0.004, -distanceRef.current);
        session.addEventListener("end", () => {
          applyMode("preview");
          setMode("preview");
        });
      },
    };

    let firstFrame = false;
    const screenOrient = () =>
      THREE.MathUtils.degToRad(
        (window.screen?.orientation?.angle ?? (window as { orientation?: number }).orientation ?? 0) as number,
      );

    renderer.setAnimationLoop(() => {
      if (!renderer.xr.isPresenting) {
        if (mode === "preview") {
          if (!dragging) spinY += 0.0035;
          productGroup.rotation.y = spinY;
        } else {
          productGroup.rotation.y = spinY;
          if (orientation) {
            applyDeviceOrientation(
              camera.quaternion,
              orientation.alpha,
              orientation.beta,
              orientation.gamma,
              screenOrient(),
            );
          } else {
            camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ"));
          }
        }
      }
      renderer.render(scene, camera);
      if (!firstFrame) {
        firstFrame = true;
        setReady(true);
      }
    });

    // ---- 対応状況の判定 ----
    if (navigator.xr?.isSessionSupported) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((ok) => setXrSupported(ok))
        .catch(() => setXrSupported(false));
    } else {
      queueMicrotask(() => setXrSupported(false));
    }
    queueMicrotask(() =>
      setCameraSupported(Boolean(navigator.mediaDevices?.getUserMedia)),
    );

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("deviceorientation", onOrientation);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      ro.disconnect();
      disposeGroup(productGroup);
      disposeGroup(room);
      disposeGroup(person);
      disposeGroup(shadow);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      apiRef.current = null;
    };
    // シーンは1度だけ構築し、以降はAPI経由で更新する。
    // products は model（職種）から決まり、この部品の生存中は変わらない。
  }, [products]);

  // 最新の値をアニメーションループ／シーン構築側から読むための同期
  useEffect(() => {
    humanRef.current = human;
    distanceRef.current = distance;
    colorRef.current = color;
    gyroRef.current = gyro;
  }, [human, distance, color, gyro]);

  useEffect(() => {
    apiRef.current?.setProduct(product);
    apiRef.current?.setColor(color);
  }, [product, color]);
  useEffect(() => {
    apiRef.current?.setHuman(human);
  }, [human]);
  useEffect(() => {
    apiRef.current?.setDistance(distance);
  }, [distance]);

  /* ---------------- カメラ重ね合わせ（iOS / macOS 対応） ---------------- */
  const startCamera = async () => {
    setMessage(null);
    try {
      // iOS はジャイロの利用に明示的な許可が必要（ユーザー操作の中で求める）
      const DOE = window.DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<PermissionState | "granted" | "denied">;
      };
      if (typeof DOE?.requestPermission === "function") {
        const res = await DOE.requestPermission();
        setGyro(res === "granted" ? "active" : "unavailable");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) {
        v.srcObject = stream;
        await v.play().catch(() => {});
      }
      setDistance(2.5);
      distanceRef.current = 2.5;
      apiRef.current?.setMode("camera");
      setMode("camera");
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setMessage(
        name === "NotAllowedError"
          ? "カメラの使用が許可されていません。ブラウザの設定から許可すると、実物大で重ねて表示できます。"
          : "カメラを起動できませんでした。実寸プレビューでご確認ください。",
      );
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) v.srcObject = null;
    setDistance(3);
    distanceRef.current = 3;
    apiRef.current?.setMode("preview");
    setMode("preview");
  };

  // 離脱時にカメラを必ず止める
  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const [w, d, h] = current.size;
  const overlay = mode !== "preview";

  return (
    <div className="grid gap-5 [&>*]:min-w-0 lg:grid-cols-5">
      <DemoStage
        className="min-w-0 lg:col-span-3"
        label="エビスソフト.AR_Viewer"
        status={
          mode === "xr"
            ? "AR SESSION"
            : mode === "camera"
              ? gyro === "active"
                ? "CAMERA + GYRO"
                : "CAMERA"
              : ready
                ? "REAL SCALE 1:1"
                : "LOADING…"
        }
      >
        <div className="relative">
          {/* カメラ映像（重ね合わせモードのときだけ表示） */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            aria-hidden
            className={`absolute inset-0 size-full object-cover ${overlay ? "" : "hidden"}`}
          />

          <div
            ref={mountRef}
            className={`relative h-[320px] w-full cursor-grab active:cursor-grabbing sm:h-[440px] ${
              overlay
                ? ""
                : "bg-[radial-gradient(circle_at_50%_20%,rgba(34,211,238,0.10),transparent_60%)]"
            }`}
          />

          {!ready && !message ? (
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display animate-pulse text-xs tracking-[0.3em] text-slate-500">
                INITIALIZING…
              </span>
            </div>
          ) : null}

          {/* 実寸の表示 */}
          <div className="pointer-events-none absolute top-3 left-3 rounded-lg border border-white/10 bg-ink/75 px-3 py-2 backdrop-blur">
            <p className="text-xs font-bold text-white">{current.name}</p>
            <p className="font-display mt-0.5 text-[11px] text-brand-light tabular-nums">
              W{w} × D{d} × H{h} mm
            </p>
            {current.price > 0 ? (
              <p className="mt-0.5 text-[11px] text-gold-light">
                ¥{current.price.toLocaleString()}
              </p>
            ) : null}
          </div>

          {/* モードごとの操作ヒント */}
          <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-ink/70 px-3 py-1 text-center text-[11px] text-slate-300 backdrop-blur">
            {mode === "camera"
              ? gyro === "active"
                ? "端末を動かすと見回せます／ドラッグで商品を回転"
                : "ドラッグで見回す／下のボタンで商品を回転"
              : mode === "xr"
                ? "床に置かれています"
                : "ドラッグで回転・スライダーで距離"}
          </p>

          {overlay ? (
            <button
              type="button"
              onClick={stopCamera}
              className="absolute top-3 right-3 rounded-lg border border-white/20 bg-ink/75 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur"
            >
              終了
            </button>
          ) : human ? (
            <p className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-brand/30 bg-ink/70 px-3 py-1 text-[11px] text-brand-light backdrop-blur">
              比較用シルエット：身長170cm
            </p>
          ) : null}
        </div>
      </DemoStage>

      <div className="panel space-y-5 p-5 min-w-0 lg:col-span-2">
        {/* 起動方法：端末に合わせて出し分ける */}
        <div className="rounded-xl border border-brand/25 bg-brand/[0.07] p-4">
          <p className="font-display text-[10px] font-bold tracking-[0.25em] text-brand uppercase">
            Augmented Reality
          </p>

          {xrSupported === null || cameraSupported === null ? (
            <p className="mt-2 text-xs text-slate-500">対応状況を確認しています…</p>
          ) : (
            <>
              {xrSupported ? (
                <>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    この端末はWebXRに対応しています。床を検出して、実物大で置けます。
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      apiRef.current?.startXr().catch(() => setMessage("ARを開始できませんでした。"))
                    }
                    className="btn btn-primary mt-3 inline-flex h-10 w-full items-center justify-center text-sm"
                  >
                    <Icon name="ar" className="size-4" />
                    ARで実物大表示
                  </button>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  この端末はWebXRに非対応ですが、
                  <strong className="font-bold text-white">
                    カメラ映像に重ねる方式でARを体験できます
                  </strong>
                  （iPhone / iPad / Mac の Safari でも動作します）。
                </p>
              )}

              {cameraSupported && mode !== "camera" ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${
                    xrSupported
                      ? "border border-white/15 bg-white/5 text-slate-200 hover:border-brand/50"
                      : "bg-gradient-to-r from-brand to-accent text-ink"
                  }`}
                >
                  <Icon name="ar" className="size-4" />
                  カメラに重ねて表示
                </button>
              ) : null}

              {!cameraSupported && !xrSupported ? (
                <p className="mt-2 text-xs text-slate-500">
                  カメラも利用できないため、実寸プレビューのみ表示しています。
                </p>
              ) : null}
            </>
          )}

          {message ? (
            <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100">
              {message}
            </p>
          ) : null}
        </div>

        {models && models.length > 0 && productLabel ? (
          <p className="rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-2 text-xs leading-relaxed text-gold-light">
            {`この職種向けに組み立てた${models.length}種類（${models
              .map((m) => INDUSTRY_MODEL_LABEL[m])
              .join("・")}）を、実寸に直して置いています。実案件では、お客様の「${productLabel}」の3Dデータに差し替えます。`}
          </p>
        ) : null}

        <ControlGroup label="Product / 商品">
          {products.map((p) => (
            <ChipButton key={p.key} active={product === p.key} onClick={() => setProduct(p.key)}>
              {p.name}
            </ChipButton>
          ))}
        </ControlGroup>

        <ControlGroup label="Finish / 仕上げ">
          {COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setColor(c.hex)}
              aria-label={c.label}
              aria-pressed={color === c.hex}
              className={`size-8 rounded-lg border-2 transition-all ${
                color === c.hex ? "scale-110 border-white" : "border-white/20 hover:border-white/50"
              }`}
              style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, "0")}` }}
            />
          ))}
        </ControlGroup>

        <RangeControl
          label={overlay ? "Distance / 置く距離" : "View / 見る距離"}
          value={distance}
          min={overlay ? 1 : 1.5}
          max={overlay ? 6 : 7}
          step={0.1}
          suffix="m"
          onChange={setDistance}
        />

        {overlay ? (
          <ControlGroup label="Rotate / 向き">
            <ChipButton active={false} onClick={() => apiRef.current?.spin(-30)}>
              ← 30°
            </ChipButton>
            <ChipButton active={false} onClick={() => apiRef.current?.spin(30)}>
              30° →
            </ChipButton>
          </ControlGroup>
        ) : (
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <ChipButton active={human} onClick={() => setHuman(!human)}>
              人物シルエットで比較
            </ChipButton>
          </div>
        )}

        <p className="text-xs leading-relaxed text-slate-500">
          モデルはすべて実寸（mm）で構築しています。カメラに重ねたときも、視野角から逆算した実寸で描画しています。
        </p>
      </div>
    </div>
  );
}
