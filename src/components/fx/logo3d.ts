import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import logoFontData from "./logoFont.json";

/**
 * 会社ロゴの3Dモデル。
 *
 * 構成（依頼主のご要望どおり、パーツを分けています）：
 * - `letters` … 押し出した立体文字「YEBISU」。素材・カラーを差し替えられる
 * - `soft`    … 「Soft」。**回転させず固定**
 * - `ring`    … YEBISU の周りを回るリング（別オブジェクト。2本＋軌道上の粒）
 * - `sparks`  … 模型の周りを飛ぶ小さな光
 *
 * 文字は Geist（SIL Open Font License 1.1）の Black を three.js の typeface 形式へ
 * 変換したもの（`logoFont.json`。ロゴとリングの文字に使う字だけのサブセットで約5.8KB）。
 * ビットマップ画像ではなく実際のジオメトリなので、どこから見ても立体で、拡大しても滲みません。
 */

const font = new FontLoader().parse(logoFontData as unknown as Parameters<FontLoader["parse"]>[0]);

/** ブランドのロゴブルー（元のロゴの文字色に合わせた青） */
export const LOGO_BLUE = "#2f6cb0";
/** リングのシアン（サイトのブランドカラー） */
const RING_CYAN = 0x22d3ee;

export type Logo3d = {
  /** シーンに追加するルート */
  group: THREE.Group;
  /** 立体文字「YEBISU」。素材を差し替えるときはこの material を入れ替える */
  letters: THREE.Mesh;
  /** 三角形の数（デモのステータス表示用） */
  triangles: number;
  /** 毎フレーム呼ぶ（t = 経過秒） */
  update: (t: number) => void;
  dispose: () => void;
};

/** 立体文字を作り、原点中心にそろえて返す。 */
function makeText(text: string, size: number, depth: number) {
  const geo = new TextGeometry(text, {
    font,
    size,
    depth,
    curveSegments: 6,
    bevelEnabled: true,
    bevelThickness: size * 0.03,
    bevelSize: size * 0.025,
    bevelSegments: 2,
  });
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -depth / 2);
  return { geo, width: bb.max.x - bb.min.x, height: bb.max.y - bb.min.y };
}

export function createLogo3d(
  options: {
    lettersMaterial?: THREE.Material;
    /** リングだけを大きくする倍率（背景では文字より遥かに大きな軌道にする） */
    ringScale?: number;
  } = {},
): Logo3d {
  const group = new THREE.Group();
  const disposables: { dispose: () => void }[] = [];

  /* --- YEBISU（立体文字） --- */
  const { geo: textGeo, width: textWidth } = makeText("YEBISU", 1, 0.32);
  const lettersMat =
    options.lettersMaterial ??
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(LOGO_BLUE),
      metalness: 0.85,
      roughness: 0.25,
      envMapIntensity: 1.2,
    });
  const letters = new THREE.Mesh(textGeo, lettersMat);
  group.add(letters);
  disposables.push(textGeo);

  /* --- Soft（固定。リングと一緒には回さない） --- */
  const { geo: softGeo } = makeText("Soft", 0.42, 0.16);
  const softMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#a51f38"),
    metalness: 0.55,
    roughness: 0.35,
  });
  const soft = new THREE.Mesh(softGeo, softMat);
  soft.position.set(textWidth / 2 - 0.62, -0.95, 0.02);
  group.add(soft);
  disposables.push(softGeo, softMat);

  /* --- リング（YEBISU の周りを回る。文字とは別オブジェクト） --- */
  const ring = new THREE.Group();
  const ringRadius = textWidth * 0.72;
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(RING_CYAN),
    emissive: new THREE.Color(RING_CYAN),
    emissiveIntensity: 0.9,
    metalness: 0.6,
    roughness: 0.2,
  });
  const ringGeoA = new THREE.TorusGeometry(ringRadius, 0.035, 12, 128);
  const ringGeoB = new THREE.TorusGeometry(ringRadius * 0.82, 0.018, 10, 128);
  const ringA = new THREE.Mesh(ringGeoA, ringMat);
  const ringB = new THREE.Mesh(ringGeoB, ringMat);
  ringB.rotation.z = 0.5;
  // 軌道上を流れる小さな粒（リングと一緒に回る）
  const beadGeo = new THREE.SphereGeometry(0.055, 10, 8);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xd8f7ff });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(Math.cos(a) * ringRadius, Math.sin(a) * ringRadius, 0);
    ringA.add(bead);
  }
  /* --- リングの帯（原画のリボン。言葉はこの上に乗る） --- */
  const bandGeo = new THREE.RingGeometry(ringRadius * 0.9, ringRadius * 1.1, 128);
  const bandMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0x3ea8d8),
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  ringA.add(new THREE.Mesh(bandGeo, bandMat));
  disposables.push(bandGeo, bandMat);

  /* --- リングに乗る言葉（原画と同じ5語・同じ並び） ---
     リングの面に寝かせて置く（＝帯に書かれている状態）。ringA の子なので一緒に回る。
     上半分／下半分で向きを反転させ、静止時は原画と同じように読める向きにしている。 */
  const RING_WORDS: { text: string; deg: number }[] = [
    { text: "AI", deg: 302 },
    { text: "SECURITY", deg: 78 },
    { text: "CLOUD", deg: 140 },
    { text: "NETWORKS", deg: 250 },
    { text: "GLOBAL", deg: 345 },
  ];
  const wordMeshes: THREE.Mesh[] = [];
  const wordMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xdff6ff),
    emissive: new THREE.Color(0x9fe8ff),
    emissiveIntensity: 0.85,
    metalness: 0.3,
    roughness: 0.35,
  });
  disposables.push(wordMat);
  for (const w of RING_WORDS) {
    const { geo } = makeText(w.text, 0.24, 0.02);
    const mesh = new THREE.Mesh(geo, wordMat);
    const rad = (w.deg * Math.PI) / 180;
    mesh.position.set(Math.cos(rad) * ringRadius, Math.sin(rad) * ringRadius, 0.05);
    const upper = w.deg > 0 && w.deg < 180;
    mesh.rotation.z = rad + (upper ? -Math.PI / 2 : Math.PI / 2);
    // 帯に完全に寝かせると真横から見ることになり読めないので、少しだけ手前へ起こす
    mesh.rotateX(0.8);
    ringA.add(mesh);
    wordMeshes.push(mesh);
    disposables.push(geo);
  }

  /* リングの向き（ご指定）：X軸に対して**右上がり45度**、Y軸に対して**奥へ45度**。
     ⚠️ 1つのオブジェクトに rotation.x と rotation.z を両方入れると、three の既定の
     オイラー順（XYZ＝Zから適用）のせいで z は面内の回転になり**見た目が変わらない**。
     そのため「傾ける」用と「起こす」用でグループを入れ子にしている。 */
  ring.add(ringA, ringB);
  ring.rotation.x = -Math.PI / 4; // 奥へ45度
  const ringRoll = new THREE.Group();
  ringRoll.rotation.z = Math.PI / 4; // 右上がり45度
  ringRoll.add(ring);
  // 背景など、リングだけを大きく見せたい場面のための倍率
  ring.scale.setScalar(options.ringScale ?? 1);
  group.add(ringRoll);
  disposables.push(ringGeoA, ringGeoB, ringMat, beadGeo, beadMat);

  /* --- 周りを飛ぶ小さな光 --- */
  const SPARKS = 90;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkSeed: { r: number; y: number; speed: number; phase: number; bob: number }[] = [];
  for (let i = 0; i < SPARKS; i++) {
    sparkSeed.push({
      r: ringRadius * (0.7 + Math.random() * 0.6),
      y: (Math.random() - 0.5) * 1.5,
      speed: 0.15 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      bob: 0.1 + Math.random() * 0.25,
    });
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({
    size: 0.055,
    color: 0xbdf0ff,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  group.add(sparks);

  // 全体をわずかに前傾させる（リングの楕円が見え、正方形の枠に収まりよく入る）
  group.rotation.x = -0.18;
  disposables.push(sparkGeo, sparkMat);

  // 裏返って見える語（リングの向こう側）は180度返して、静止時はすべて読めるようにする
  group.updateMatrixWorld(true);
  {
    const q = new THREE.Quaternion();
    const n = new THREE.Vector3();
    for (const mesh of wordMeshes) {
      mesh.getWorldQuaternion(q);
      n.set(0, 0, 1).applyQuaternion(q);
      if (n.z < 0) mesh.rotateY(Math.PI);
    }
  }

  // 実際にシーンへ出ているメッシュ（文字・Soft・リング・帯・リングの言葉）の合計
  let triangles = 0;
  group.traverse((o) => {
    const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!g || !(o as THREE.Mesh).isMesh) return;
    const idx = g.getIndex();
    triangles += idx ? idx.count / 3 : g.getAttribute("position").count / 3;
  });

  const update = (t: number) => {
    // リングだけが回る（YEBISU と Soft は回さない）
    // ご指定の角度を崩さないよう、回すのは面内（リング自身の軸まわり）だけ
    ringA.rotation.z = t * 0.55;
    ringB.rotation.z = -t * 0.38;
    // 小さな光が模型の周りを流れる
    for (let i = 0; i < SPARKS; i++) {
      const s = sparkSeed[i];
      const a = s.phase + t * s.speed;
      sparkPos[i * 3] = Math.cos(a) * s.r;
      sparkPos[i * 3 + 1] = s.y + Math.sin(t * s.speed * 2 + s.phase) * s.bob;
      sparkPos[i * 3 + 2] = Math.sin(a) * s.r * 0.6;
    }
    sparkGeo.getAttribute("position").needsUpdate = true;
  };
  update(0);

  return {
    group,
    letters,
    triangles: Math.round(triangles),
    update,
    dispose: () => {
      disposables.forEach((d) => d.dispose());
      // letters の material は呼び出し側が管理する（差し替えるため）
    },
  };
}
