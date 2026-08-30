import * as THREE from "three";

/**
 * ページごとの3D背景オブジェクト。
 *
 * 以前はどのページでも同じ「会社ロゴの立体モデル＋多面体」を出していましたが、
 * ロゴを背景に置くのはやめ、**ページの内容そのものを表す形**に置き換えました。
 * トップページの ONE CONTINUOUS FLIGHT（01〜04）と同じ語彙——球・星形・環・核——を
 * 立体にして、ページごとに違う一つを主役として置きます。
 *
 * 共通の粒子（星野）と床グリッドは ThreeBackground 側が描きます。
 * ここが返すのは「そのページの主役の形」だけです。
 *
 * 設計の約束：
 * - 追加のファイル取得をしない（すべてコードで組み立てる）
 * - dispose() で自分が作ったジオメトリとマテリアルを必ず片付ける
 * - update(t, scrollY) は毎フレーム呼ばれる。重い処理は書かない
 */

export type BgScene = {
  group: THREE.Group;
  update: (t: number, scrollY: number) => void;
  dispose: () => void;
};

/** ページのパスから、どのシーンを出すかを決める */
export type SceneId =
  | "home"
  | "ai"
  | "web"
  | "embedded"
  | "demo"
  | "showcase"
  | "columns"
  | "company"
  | "contact"
  | "quiet";

/** 紫の発光（ブランド） */
const GLOW = 0xb67eff;
/** ミント（第2アクセント） */
const MINT = 0xaaffdc;
/** 淡いラベンダー */
const LAV = 0xe5d6ff;

/**
 * パスからシーンIDを決める。
 * basePath 配信（GitHub Pages）でも効くよう、末尾一致ではなく含有で見る。
 */
export function sceneIdForPath(pathname: string): SceneId {
  const has = (p: string) => pathname === p || pathname.endsWith(p) || pathname.includes(`${p}/`);
  if (has("/ai")) return "ai";
  if (has("/web")) return "web";
  if (has("/embedded")) return "embedded";
  if (has("/demo")) return "demo";
  if (has("/showcase")) return "showcase";
  if (has("/columns")) return "columns";
  if (has("/company")) return "company";
  if (has("/contact") || has("/request")) return "contact";
  if (has("/faq") || has("/privacy") || has("/proposal")) return "quiet";
  return "home";
}

/** まとめて片付けるための小さな入れ物 */
function bin() {
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];
  return {
    geo<T extends THREE.BufferGeometry>(g: T): T {
      geos.push(g);
      return g;
    },
    mat<T extends THREE.Material>(m: T): T {
      mats.push(m);
      return m;
    },
    dispose() {
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
    },
  };
}

/** 線だけで作る球（緯線と経線）。どのシーンでも使う下地 */
function wireSphere(b: ReturnType<typeof bin>, r: number, color: number, opacity: number) {
  const geo = b.geo(new THREE.SphereGeometry(r, 24, 16));
  const mat = b.mat(
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
  );
  return new THREE.LineSegments(b.geo(new THREE.WireframeGeometry(geo)), mat);
}

/** 寝かせた環（トップの .ai-flight-2 に対応する形） */
function ring(b: ReturnType<typeof bin>, r: number, tube: number, color: number, opacity: number) {
  const geo = b.geo(new THREE.TorusGeometry(r, tube, 8, 96));
  const mat = b.mat(new THREE.MeshBasicMaterial({ color, transparent: true, opacity }));
  return new THREE.Mesh(geo, mat);
}

export function createScene(id: SceneId): BgScene {
  const b = bin();
  const group = new THREE.Group();

  switch (id) {
    /* トップ：ラボの観測対象。二重の多面体がゆっくり回る */
    case "home": {
      const outer = new THREE.LineSegments(
        b.geo(new THREE.WireframeGeometry(b.geo(new THREE.IcosahedronGeometry(5.2, 1)))),
        b.mat(new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.18 }))
      );
      const inner = new THREE.LineSegments(
        b.geo(new THREE.WireframeGeometry(b.geo(new THREE.IcosahedronGeometry(3.1, 0)))),
        b.mat(new THREE.LineBasicMaterial({ color: MINT, transparent: true, opacity: 0.12 }))
      );
      group.add(outer, inner);
      return {
        group,
        update(t, sy) {
          group.rotation.y = t * 0.12 + sy * 0.0005;
          group.rotation.x = Math.sin(t * 0.18) * 0.25;
          inner.rotation.y = -t * 0.3;
        },
        dispose: b.dispose,
      };
    }

    /* AI活用：観測される球。まわりを小さな光が周回する（01 OBSERVE） */
    case "ai": {
      const core = wireSphere(b, 4.2, GLOW, 0.2);
      const halo = ring(b, 6.4, 0.02, LAV, 0.35);
      halo.rotation.x = Math.PI / 2 - 0.35;
      const spark = new THREE.Mesh(
        b.geo(new THREE.SphereGeometry(0.14, 12, 12)),
        b.mat(new THREE.MeshBasicMaterial({ color: MINT }))
      );
      group.add(core, halo, spark);
      return {
        group,
        update(t, sy) {
          core.rotation.y = t * 0.16 + sy * 0.0004;
          core.rotation.x = Math.sin(t * 0.2) * 0.18;
          halo.rotation.z = t * 0.3;
          spark.position.set(Math.cos(t * 0.7) * 6.4, Math.sin(t * 1.1) * 1.2, Math.sin(t * 0.7) * 6.4);
        },
        dispose: b.dispose,
      };
    }

    /* Web制作：八面体の「星形」。面が光を拾いながら回る（02 PROTOTYPE） */
    case "web": {
      const star = new THREE.LineSegments(
        b.geo(new THREE.WireframeGeometry(b.geo(new THREE.OctahedronGeometry(5, 0)))),
        b.mat(new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.24 }))
      );
      const shell = new THREE.Mesh(
        b.geo(new THREE.OctahedronGeometry(4.9, 0)),
        b.mat(
          new THREE.MeshBasicMaterial({
            color: GLOW,
            transparent: true,
            opacity: 0.05,
            side: THREE.DoubleSide,
          })
        )
      );
      group.add(star, shell);
      return {
        group,
        update(t, sy) {
          group.rotation.y = t * 0.22 + sy * 0.0006;
          group.rotation.z = Math.sin(t * 0.25) * 0.3;
        },
        dispose: b.dispose,
      };
    }

    /* 組み込み：寝かせた二重の環と、そのあいだを往復する信号（03 INTEGRATE） */
    case "embedded": {
      const outer = ring(b, 6.2, 0.018, GLOW, 0.4);
      const inner = ring(b, 4.1, 0.014, MINT, 0.3);
      outer.rotation.x = Math.PI / 2 - 0.42;
      inner.rotation.x = Math.PI / 2 - 0.42;
      const signal = new THREE.Mesh(
        b.geo(new THREE.SphereGeometry(0.1, 10, 10)),
        b.mat(new THREE.MeshBasicMaterial({ color: MINT }))
      );
      outer.add(signal);
      group.add(outer, inner);
      return {
        group,
        update(t, sy) {
          outer.rotation.z = t * 0.24;
          inner.rotation.z = -t * 0.36;
          group.position.y = Math.sin(t * 0.3) * 0.6 - Math.min(sy * 0.001, 3);
          signal.position.set(Math.cos(t * 1.4) * 6.2, Math.sin(t * 1.4) * 6.2, 0);
        },
        dispose: b.dispose,
      };
    }

    /* できること：ミントの核と、まわりを埋める小さな立方体（04 EVOLVE） */
    case "demo": {
      const core = new THREE.Mesh(
        b.geo(new THREE.IcosahedronGeometry(1.5, 1)),
        b.mat(new THREE.MeshBasicMaterial({ color: MINT, transparent: true, opacity: 0.5 }))
      );
      const cage = new THREE.LineSegments(
        b.geo(new THREE.WireframeGeometry(b.geo(new THREE.BoxGeometry(8, 8, 8, 2, 2, 2)))),
        b.mat(new THREE.LineBasicMaterial({ color: GLOW, transparent: true, opacity: 0.16 }))
      );
      group.add(core, cage);
      return {
        group,
        update(t, sy) {
          core.rotation.y = t * 0.5;
          core.rotation.x = t * 0.2;
          cage.rotation.y = -t * 0.1 + sy * 0.0003;
          cage.rotation.x = Math.sin(t * 0.15) * 0.2;
        },
        dispose: b.dispose,
      };
    }

    /* 職種別デモ：形の違うものが並ぶ棚。3つの立体が別々に回る */
    case "showcase": {
      const shapes = [
        new THREE.OctahedronGeometry(2, 0),
        new THREE.IcosahedronGeometry(1.9, 0),
        new THREE.TorusGeometry(1.5, 0.35, 8, 24),
      ].map((g) => b.geo(g));
      const mats = [GLOW, LAV, MINT].map((c) =>
        b.mat(new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0.22 }))
      );
      const items = shapes.map((g, i) => {
        const m = new THREE.LineSegments(b.geo(new THREE.WireframeGeometry(g)), mats[i]);
        m.position.set((i - 1) * 5.2, 0, 0);
        group.add(m);
        return m;
      });
      return {
        group,
        update(t, sy) {
          items.forEach((m, i) => {
            m.rotation.y = t * (0.18 + i * 0.08);
            m.rotation.x = Math.sin(t * 0.2 + i) * 0.3;
            m.position.y = Math.sin(t * 0.4 + i * 1.4) * 0.7 - Math.min(sy * 0.0008, 2.5);
          });
        },
        dispose: b.dispose,
      };
    }

    /* コラム：静かな層。読み物の邪魔をしないよう、線を水平に寝かせる */
    case "columns": {
      const layers: THREE.Line[] = [];
      for (let i = 0; i < 5; i++) {
        const pts: THREE.Vector3[] = [];
        for (let x = -14; x <= 14; x += 0.5) pts.push(new THREE.Vector3(x, 0, 0));
        const geo = b.geo(new THREE.BufferGeometry().setFromPoints(pts));
        const mat = b.mat(
          new THREE.LineBasicMaterial({ color: i % 2 ? LAV : GLOW, transparent: true, opacity: 0.14 })
        );
        const line = new THREE.Line(geo, mat);
        line.position.y = (i - 2) * 2.4;
        group.add(line);
        layers.push(line);
      }
      return {
        group,
        update(t, sy) {
          layers.forEach((line, i) => {
            const pos = line.geometry.attributes.position as THREE.BufferAttribute;
            for (let k = 0; k < pos.count; k++) {
              const x = pos.getX(k);
              pos.setY(k, Math.sin(x * 0.35 + t * 0.6 + i) * 0.5);
            }
            pos.needsUpdate = true;
            line.position.y = (i - 2) * 2.4 - Math.min(sy * 0.0006, 2);
          });
        },
        dispose: b.dispose,
      };
    }

    /* 会社概要：二重のリングが噛み合う。積み上げてきたものの記号 */
    case "company": {
      const a = ring(b, 5, 0.02, GLOW, 0.35);
      const c = ring(b, 5, 0.02, LAV, 0.28);
      a.rotation.x = Math.PI / 2 - 0.5;
      c.rotation.y = Math.PI / 2 - 0.5;
      group.add(a, c);
      return {
        group,
        update(t, sy) {
          a.rotation.z = t * 0.18;
          c.rotation.z = -t * 0.14;
          group.rotation.y = Math.sin(t * 0.12) * 0.3 + sy * 0.0002;
        },
        dispose: b.dispose,
      };
    }

    /* 相談・問い合わせ：外から中心へ集まってくる粒子。「話が集まる」形 */
    case "contact": {
      const COUNT = 260;
      const pos = new Float32Array(COUNT * 3);
      const seed = new Float32Array(COUNT * 2);
      for (let i = 0; i < COUNT; i++) {
        seed[i * 2] = Math.random() * Math.PI * 2;
        seed[i * 2 + 1] = 2 + Math.random() * 7;
      }
      const geo = b.geo(new THREE.BufferGeometry());
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = b.mat(
        new THREE.PointsMaterial({
          color: GLOW,
          size: 0.1,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      const pts = new THREE.Points(geo, mat);
      group.add(pts);
      return {
        group,
        update(t) {
          const p = geo.attributes.position as THREE.BufferAttribute;
          for (let i = 0; i < COUNT; i++) {
            // 半径がゆっくり縮み、一定より内側へ入ったら外周へ戻す（呼吸するような往復）
            const phase = (t * 0.25 + i * 0.017) % 1;
            const r = seed[i * 2 + 1] * (1 - phase);
            const a2 = seed[i * 2] + t * 0.1;
            p.setXYZ(i, Math.cos(a2) * r, Math.sin(a2 * 1.7) * r * 0.4, Math.sin(a2) * r);
          }
          p.needsUpdate = true;
        },
        dispose: b.dispose,
      };
    }

    /* 規約・FAQ：読む場所なので、いちばん静かな形にする */
    case "quiet":
    default: {
      const q = wireSphere(b, 4.6, GLOW, 0.1);
      group.add(q);
      return {
        group,
        update(t) {
          q.rotation.y = t * 0.05;
        },
        dispose: b.dispose,
      };
    }
  }
}
