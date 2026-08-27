import * as THREE from "three";

/**
 * 職種別の3Dモデル。
 *
 * 「この職種ならこんな感じ」の説明ではなく、**その職種で実際に見せたい物**を
 * その場で組み立てます（医療なら診療ユニット、製造なら機械部品、不動産なら間取り）。
 * 外部の3Dファイルを読み込まず、基本形状の組み合わせだけで作っているため、
 * **追加のダウンロードがゼロ**です（デモを軽く保つための判断）。
 *
 * 実案件では、ここをお客様のCADデータや3Dスキャンに差し替えます。
 * デモの中でもその旨を必ず出すこと（`Demo3dcg` の注記）。
 *
 * 【素材切り替えとの関係】
 * `themed` に入れたメッシュだけが、デモの「素材・カラー」の切り替え対象になります。
 * 影になる部品（ゴム・木・ガラス面など）は固定の素材にして、
 * 全体が単色にならないようにしています。
 */

export type IndustryModelKey =
  | "cup"
  | "teapot"
  | "gift-box"
  | "dish"
  | "coffee-set"
  | "bento"
  | "dental-unit"
  | "medical-cart"
  | "waiting-sofa"
  | "machine-part"
  | "gearbox"
  | "conveyor"
  | "floorplan"
  | "apartment"
  | "kitchen"
  | "house"
  | "timber-frame"
  | "deck"
  | "desk"
  | "whiteboard"
  | "bookshelf"
  | "documents"
  | "consult-table"
  | "cabinet"
  | "salon-chair"
  | "shampoo-basin"
  | "salon-cart"
  | "dumbbell"
  | "bench-press"
  | "treadmill"
  | "guestroom"
  | "open-air-bath"
  | "front-desk"
  | "truck"
  | "pallet"
  | "forklift"
  | "wheel"
  | "car-body"
  | "car-lift"
  | "crate"
  | "greenhouse"
  | "tractor"
  | "arch"
  | "banquet-table"
  | "cake"
  | "care-bed"
  | "wheelchair"
  | "care-bath"
  | "server"
  | "workstation"
  | "monitor-wall"
  | "garment"
  | "sneaker"
  | "handbag";

export type IndustryModel = {
  group: THREE.Group;
  /** 素材・カラーの切り替え対象（ここに入れたものだけ色が変わる） */
  themed: THREE.Mesh[];
  triangles: number;
  dispose: () => void;
};

/** モデルの表示名（デモ側のラベルに使う） */
export const INDUSTRY_MODEL_LABEL: Record<IndustryModelKey, string> = {
  cup: "マグカップ",
  teapot: "急須",
  "gift-box": "ギフトボックス",
  dish: "会席の一皿",
  "coffee-set": "ドリップセット",
  bento: "重箱の弁当",
  "dental-unit": "歯科診療ユニット",
  "medical-cart": "診療ワゴン",
  "waiting-sofa": "待合ソファ",
  "machine-part": "機械部品",
  gearbox: "歯車ユニット",
  conveyor: "ベルトコンベア",
  floorplan: "間取り",
  apartment: "マンション棟",
  kitchen: "システムキッチン",
  house: "住宅",
  "timber-frame": "木造の躯体",
  deck: "ウッドデッキ",
  desk: "学習机",
  whiteboard: "ホワイトボードと教壇",
  bookshelf: "教材棚",
  documents: "書類一式",
  "consult-table": "相談ブース",
  cabinet: "書庫キャビネット",
  "salon-chair": "サロンチェア",
  "shampoo-basin": "シャンプー台",
  "salon-cart": "施術ワゴン",
  dumbbell: "ダンベル",
  "bench-press": "ベンチプレス",
  treadmill: "ランニングマシン",
  guestroom: "客室",
  "open-air-bath": "露天風呂",
  "front-desk": "フロントカウンター",
  truck: "配送トラック",
  pallet: "パレット積みの荷物",
  forklift: "フォークリフト",
  wheel: "ホイール",
  "car-body": "車体",
  "car-lift": "整備リフト",
  crate: "収穫コンテナ",
  greenhouse: "ビニールハウス",
  tractor: "トラクター",
  arch: "装花アーチ",
  "banquet-table": "円卓のセッティング",
  cake: "ウェディングケーキ",
  "care-bed": "介護ベッド",
  wheelchair: "車いす",
  "care-bath": "手すり付き浴槽",
  server: "サーバーラック",
  workstation: "作業デスク",
  "monitor-wall": "モニタウォール",
  garment: "トルソーと衣服",
  sneaker: "スニーカー",
  handbag: "ハンドバッグ",
};

/* ------------------------------------------------------------------
 * 補助（作るときの決まりごと）
 * ---------------------------------------------------------------- */

/** 固定素材（切り替え対象外）。作りすぎないよう、ここに定義したものだけを使う */
function fixed(color: number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.72, ...opts });
}

const PALETTE = {
  dark: 0x2b3444,
  light: 0xe8edf4,
  wood: 0xb98a54,
  woodDark: 0x8a6238,
  rubber: 0x1b2029,
  fabric: 0x5c6b86,
  green: 0x4fa96b,
  red: 0xc4483a,
  glass: 0x9fd8ef,
  gold: 0xd9b96a,
};

/** メッシュを作って位置・回転・スケールを一度に指定する */
function put(
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  pos: [number, number, number] = [0, 0, 0],
  rot: [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  mesh.rotation.set(...rot);
  return mesh;
}

/** ロクロで挽いた形（カップ・器）を輪郭から作る */
function lathe(points: [number, number][], segments = 48): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

/* ------------------------------------------------------------------
 * 職種ごとのモデル
 * ---------------------------------------------------------------- */

type Build = (themed: THREE.Material) => { group: THREE.Group; themed: THREE.Mesh[] };

const BUILDERS: Record<IndustryModelKey, Build> = {
  /* 小売・EC：陶器のマグカップ（底面・持ち手まで回して見せる） */
  cup: (mat) => {
    const g = new THREE.Group();
    const body = put(
      lathe([
        [0, -1.1],
        [0.92, -1.1],
        [0.95, -0.95],
        [0.86, -0.2],
        [0.9, 1.0],
        [0.82, 1.05],
        [0.78, -0.2],
        [0.84, -0.9],
        [0, -0.92],
      ]),
      mat,
    );
    const handle = put(
      new THREE.TorusGeometry(0.5, 0.11, 20, 48, Math.PI * 1.25),
      mat,
      [1.0, 0.05, 0],
      [0, 0, -Math.PI / 2.4],
    );
    const saucer = put(
      lathe([
        [0, -1.35],
        [1.7, -1.35],
        [1.72, -1.22],
        [0, -1.24],
      ]),
      fixed(PALETTE.light, { roughness: 0.5 }),
    );
    g.add(body, handle, saucer);
    return { group: g, themed: [body, handle] };
  },

  /* 飲食店：椀と皿に盛った一皿 */
  dish: (mat) => {
    const g = new THREE.Group();
    const plate = put(
      lathe([
        [0, -0.55],
        [1.9, -0.35],
        [1.95, -0.2],
        [1.6, -0.3],
        [0, -0.42],
      ]),
      mat,
    );
    const bowl = put(
      lathe([
        [0, -0.3],
        [0.78, 0.35],
        [0.84, 0.42],
        [0.7, 0.3],
        [0, -0.22],
      ]),
      mat,
      [-0.55, 0.05, 0.3],
    );
    const food = put(
      new THREE.SphereGeometry(0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      fixed(PALETTE.red, { roughness: 0.55 }),
      [0.55, -0.22, -0.1],
    );
    const garnish = put(
      new THREE.ConeGeometry(0.16, 0.5, 12),
      fixed(PALETTE.green),
      [0.75, -0.05, 0.35],
      [0.2, 0, 0.35],
    );
    const chopsticks = put(
      new THREE.CylinderGeometry(0.035, 0.02, 2.4, 8),
      fixed(PALETTE.woodDark),
      [0.1, -0.4, 1.15],
      [0, 0, Math.PI / 2],
    );
    g.add(plate, bowl, food, garnish, chopsticks);
    return { group: g, themed: [plate, bowl] };
  },

  /* クリニック・歯科：診療ユニット（チェア＋アーム＋無影灯＋モニタ） */
  "dental-unit": (mat) => {
    const g = new THREE.Group();
    const base = put(new THREE.CylinderGeometry(0.75, 0.95, 0.24, 24), fixed(PALETTE.dark), [0, -1.75, 0]);
    const post = put(new THREE.CylinderGeometry(0.22, 0.26, 1.1, 16), fixed(PALETTE.dark), [0, -1.15, 0]);
    const seat = put(new THREE.BoxGeometry(0.95, 0.22, 2.0), mat, [0, -0.6, 0.1]);
    const backrest = put(new THREE.BoxGeometry(0.9, 1.5, 0.22), mat, [0, 0.05, -0.85], [0.34, 0, 0]);
    const headrest = put(new THREE.BoxGeometry(0.55, 0.4, 0.2), mat, [0, 0.72, -1.28], [0.34, 0, 0]);
    const armPost = put(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 12), fixed(PALETTE.light), [-1.15, -0.3, -0.2]);
    const armH = put(
      new THREE.CylinderGeometry(0.08, 0.08, 1.5, 12),
      fixed(PALETTE.light),
      [-0.45, 0.95, -0.2],
      [0, 0, Math.PI / 2],
    );
    // 無影灯
    const lamp = put(
      lathe([
        [0, 0],
        [0.5, 0.02],
        [0.52, 0.16],
        [0.1, 0.22],
        [0, 0.2],
      ]),
      fixed(PALETTE.light, { metalness: 0.5, roughness: 0.28 }),
      [0.3, 0.8, -0.2],
      [Math.PI, 0, 0],
    );
    const lampGlow = put(
      new THREE.CircleGeometry(0.42, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff6d8 }),
      [0.3, 0.78, -0.2],
      [Math.PI / 2, 0, 0],
    );
    // 器具トレイとモニタ
    const tray = put(new THREE.BoxGeometry(0.7, 0.06, 0.45), fixed(PALETTE.light), [1.0, -0.15, 0.1]);
    const trayArm = put(
      new THREE.CylinderGeometry(0.05, 0.05, 0.9, 10),
      fixed(PALETTE.light),
      [0.6, -0.15, 0.1],
      [0, 0, Math.PI / 2],
    );
    const monitor = put(new THREE.BoxGeometry(0.9, 0.55, 0.06), fixed(PALETTE.dark), [1.35, 0.75, -0.1], [0, -0.4, 0]);
    const screen = put(
      new THREE.PlaneGeometry(0.8, 0.45),
      new THREE.MeshBasicMaterial({ color: 0x2f6f8f }),
      [1.33, 0.75, -0.07],
      [0, -0.4, 0],
    );
    g.add(base, post, seat, backrest, headrest, armPost, armH, lamp, lampGlow, tray, trayArm, monitor, screen);
    g.position.y = 0.35;
    return { group: g, themed: [seat, backrest, headrest] };
  },

  /* 製造業：フランジつきの機械部品（穴・面取り・軸） */
  "machine-part": (mat) => {
    const g = new THREE.Group();
    const flange = put(new THREE.CylinderGeometry(1.5, 1.5, 0.34, 48), mat);
    const collar = put(new THREE.CylinderGeometry(0.85, 1.0, 0.55, 40), mat, [0, 0.42, 0]);
    const shaft = put(new THREE.CylinderGeometry(0.42, 0.42, 1.7, 32), mat, [0, 1.1, 0]);
    const keyway = put(new THREE.BoxGeometry(0.18, 0.9, 0.5), fixed(PALETTE.dark), [0.32, 1.35, 0]);
    g.add(flange, collar, shaft, keyway);
    // ボルト穴（実際に穴は開けず、座ぐりの形で表現する）
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const hole = put(
        new THREE.CylinderGeometry(0.19, 0.19, 0.4, 20),
        fixed(PALETTE.dark, { metalness: 0.6, roughness: 0.35 }),
        [Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15],
      );
      g.add(hole);
    }
    g.rotation.z = 0.12;
    return { group: g, themed: [flange, collar, shaft] };
  },

  /* 不動産：間取り（床・壁・家具のブロック） */
  floorplan: (mat) => {
    const g = new THREE.Group();
    const floor = put(new THREE.BoxGeometry(4.4, 0.16, 3.4), fixed(PALETTE.wood), [0, -1.0, 0]);
    const wallN = put(new THREE.BoxGeometry(4.4, 1.1, 0.12), mat, [0, -0.36, -1.7]);
    const wallW = put(new THREE.BoxGeometry(0.12, 1.1, 3.4), mat, [-2.2, -0.36, 0]);
    const wallMid = put(new THREE.BoxGeometry(0.12, 1.1, 1.9), mat, [0.35, -0.36, -0.75]);
    const bed = put(new THREE.BoxGeometry(1.2, 0.35, 1.7), fixed(PALETTE.fabric), [-1.4, -0.74, -0.6]);
    const sofa = put(new THREE.BoxGeometry(1.5, 0.4, 0.7), fixed(PALETTE.fabric), [1.3, -0.72, 0.7]);
    const table = put(new THREE.BoxGeometry(0.9, 0.1, 0.6), fixed(PALETTE.woodDark), [1.3, -0.5, -0.2]);
    const kitchen = put(new THREE.BoxGeometry(0.5, 0.7, 1.6), fixed(PALETTE.light), [1.85, -0.55, -0.85]);
    g.add(floor, wallN, wallW, wallMid, bed, sofa, table, kitchen);
    g.rotation.x = 0.12;
    return { group: g, themed: [wallN, wallW, wallMid] };
  },

  /* 建設・工務店：切妻屋根の住宅 */
  house: (mat) => {
    const g = new THREE.Group();
    const ground = put(new THREE.BoxGeometry(4.6, 0.14, 4.0), fixed(0x6f7c68), [0, -1.55, 0]);
    const body = put(new THREE.BoxGeometry(2.8, 1.7, 2.2), mat, [0, -0.6, 0]);
    const roof = put(new THREE.ConeGeometry(2.2, 1.2, 4), fixed(PALETTE.dark), [0, 0.85, 0], [0, Math.PI / 4, 0]);
    const door = put(new THREE.BoxGeometry(0.5, 0.9, 0.08), fixed(PALETTE.woodDark), [-0.6, -0.98, 1.12]);
    const win1 = put(
      new THREE.BoxGeometry(0.8, 0.6, 0.08),
      fixed(PALETTE.glass, { metalness: 0.4, roughness: 0.15 }),
      [0.65, -0.4, 1.12],
    );
    const win2 = put(
      new THREE.BoxGeometry(0.08, 0.6, 0.9),
      fixed(PALETTE.glass, { metalness: 0.4, roughness: 0.15 }),
      [1.42, -0.4, -0.1],
    );
    const carport = put(new THREE.BoxGeometry(1.6, 0.08, 1.8), fixed(PALETTE.light), [2.2, -0.35, 0.4]);
    const post1 = put(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10), fixed(PALETTE.light), [2.9, -0.93, 1.2]);
    const post2 = put(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10), fixed(PALETTE.light), [2.9, -0.93, -0.4]);
    g.add(ground, body, roof, door, win1, win2, carport, post1, post2);
    return { group: g, themed: [body] };
  },

  /* 学習塾：学習机と椅子、教材 */
  desk: (mat) => {
    const g = new THREE.Group();
    const top = put(new THREE.BoxGeometry(2.6, 0.12, 1.3), mat, [0, -0.2, 0]);
    const legs = [-1.15, 1.15].flatMap((x) =>
      [-0.5, 0.5].map((z) =>
        put(new THREE.BoxGeometry(0.1, 1.3, 0.1), fixed(PALETTE.dark), [x, -0.88, z]),
      ),
    );
    const chairSeat = put(new THREE.BoxGeometry(0.8, 0.1, 0.8), fixed(PALETTE.fabric), [0, -0.75, 1.5]);
    const chairBack = put(new THREE.BoxGeometry(0.8, 0.7, 0.1), fixed(PALETTE.fabric), [0, -0.35, 1.85]);
    const chairLegs = [-0.3, 0.3].flatMap((x) =>
      [1.2, 1.8].map((z) =>
        put(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), fixed(PALETTE.dark), [x, -1.2, z]),
      ),
    );
    const book1 = put(new THREE.BoxGeometry(0.7, 0.08, 0.95), fixed(PALETTE.red), [-0.5, -0.1, 0]);
    const book2 = put(new THREE.BoxGeometry(0.68, 0.07, 0.92), fixed(0x3f6fb0), [-0.48, -0.02, 0.04]);
    const lampPost = put(new THREE.CylinderGeometry(0.04, 0.1, 0.9, 10), fixed(PALETTE.light), [1.0, 0.3, -0.3]);
    const lampHead = put(
      new THREE.ConeGeometry(0.28, 0.3, 16, 1, true),
      fixed(PALETTE.light, { side: THREE.DoubleSide }),
      [0.8, 0.72, -0.3],
      [0.5, 0, 0.4],
    );
    g.add(top, chairSeat, chairBack, book1, book2, lampPost, lampHead, ...legs, ...chairLegs);
    g.position.z = -0.6;
    return { group: g, themed: [top] };
  },

  /* 士業：書類の束・ファイル・印鑑 */
  documents: (mat) => {
    const g = new THREE.Group();
    const desk = put(new THREE.BoxGeometry(3.4, 0.12, 2.2), fixed(PALETTE.woodDark), [0, -1.1, 0]);
    const stack: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      stack.push(
        put(
          new THREE.BoxGeometry(1.5, 0.035, 2.1),
          mat,
          [-0.6, -0.98 + i * 0.045, 0],
          [0, (i % 2 ? 1 : -1) * 0.02, 0],
        ),
      );
    }
    const folder = put(new THREE.BoxGeometry(1.6, 0.22, 2.2), fixed(0x2c5f8a), [1.15, -0.92, -0.05], [0, 0.08, 0]);
    const sealBody = put(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24), fixed(PALETTE.woodDark), [1.1, -0.75, 0.9]);
    const sealFace = put(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 24), fixed(PALETTE.red), [1.1, -1.0, 0.9]);
    const pen = put(
      new THREE.CylinderGeometry(0.045, 0.03, 1.1, 12),
      fixed(PALETTE.dark),
      [0.2, -0.98, 1.0],
      [0, 0, Math.PI / 2.2],
    );
    g.add(desk, folder, sealBody, sealFace, pen, ...stack);
    return { group: g, themed: stack };
  },

  /* 美容室：サロンチェア */
  "salon-chair": (mat) => {
    const g = new THREE.Group();
    const base = put(new THREE.CylinderGeometry(0.85, 0.95, 0.16, 28), fixed(PALETTE.dark), [0, -1.7, 0]);
    const post = put(new THREE.CylinderGeometry(0.16, 0.2, 1.0, 16), fixed(0xb8bec9, { metalness: 0.8, roughness: 0.25 }), [0, -1.12, 0]);
    const seat = put(new THREE.BoxGeometry(1.5, 0.34, 1.4), mat, [0, -0.5, 0.1]);
    const back = put(new THREE.BoxGeometry(1.4, 1.6, 0.3), mat, [0, 0.35, -0.62], [0.16, 0, 0]);
    const headrest = put(new THREE.BoxGeometry(0.7, 0.42, 0.28), mat, [0, 1.22, -0.85], [0.16, 0, 0]);
    const armL = put(new THREE.BoxGeometry(0.18, 0.16, 1.1), fixed(PALETTE.dark), [-0.75, -0.18, 0.1]);
    const armR = put(new THREE.BoxGeometry(0.18, 0.16, 1.1), fixed(PALETTE.dark), [0.75, -0.18, 0.1]);
    const foot = put(new THREE.BoxGeometry(0.9, 0.1, 0.4), fixed(PALETTE.dark), [0, -1.35, 0.85]);
    const mirror = put(
      new THREE.CylinderGeometry(1.0, 1.0, 0.06, 40),
      fixed(0xdfe9f2, { metalness: 0.9, roughness: 0.08 }),
      [0, 0.4, -1.9],
      [Math.PI / 2, 0, 0],
    );
    g.add(base, post, seat, back, headrest, armL, armR, foot, mirror);
    return { group: g, themed: [seat, back, headrest] };
  },

  /* フィットネス：ダンベル */
  dumbbell: (mat) => {
    const g = new THREE.Group();
    const bar = put(
      new THREE.CylinderGeometry(0.17, 0.17, 2.0, 24),
      fixed(0xc3c9d2, { metalness: 0.95, roughness: 0.22 }),
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    );
    const plates: THREE.Mesh[] = [];
    [-1, 1].forEach((s) => {
      [0.0, 0.32].forEach((o, i) => {
        plates.push(
          put(
            new THREE.CylinderGeometry(i === 0 ? 0.95 : 0.72, i === 0 ? 0.95 : 0.72, 0.26, 32),
            mat,
            [s * (1.0 + o), 0, 0],
            [0, 0, Math.PI / 2],
          ),
        );
      });
    });
    const grip = put(
      new THREE.CylinderGeometry(0.2, 0.2, 0.9, 24),
      fixed(PALETTE.rubber, { roughness: 0.9 }),
      [0, 0, 0],
      [0, 0, Math.PI / 2],
    );
    const mat2 = put(new THREE.BoxGeometry(4.0, 0.1, 2.4), fixed(PALETTE.rubber, { roughness: 0.95 }), [0, -1.35, 0]);
    g.add(bar, grip, mat2, ...plates);
    return { group: g, themed: plates };
  },

  /* 宿泊：客室（畳・布団・障子） */
  guestroom: (mat) => {
    const g = new THREE.Group();
    const tatami = put(new THREE.BoxGeometry(4.2, 0.14, 3.2), fixed(0xbfc48b, { roughness: 0.9 }), [0, -1.2, 0]);
    const futon = put(new THREE.BoxGeometry(1.6, 0.24, 2.2), mat, [-0.9, -1.0, 0.1]);
    const pillow = put(new THREE.BoxGeometry(0.7, 0.16, 0.4), fixed(PALETTE.light), [-0.9, -0.82, -0.75]);
    const shoji = put(new THREE.BoxGeometry(3.6, 1.9, 0.08), fixed(0xf2ecdd), [0, -0.2, -1.6]);
    const frameV = [-1.2, 0, 1.2].map((x) =>
      put(new THREE.BoxGeometry(0.06, 1.9, 0.12), fixed(PALETTE.woodDark), [x, -0.2, -1.55]),
    );
    const frameH = [-0.75, 0.35].map((y) =>
      put(new THREE.BoxGeometry(3.6, 0.06, 0.12), fixed(PALETTE.woodDark), [0, y, -1.55]),
    );
    const table = put(new THREE.BoxGeometry(1.1, 0.1, 0.8), fixed(PALETTE.woodDark), [1.3, -0.75, 0.5]);
    const cushion = put(new THREE.BoxGeometry(0.6, 0.12, 0.6), mat, [1.3, -1.05, 1.3]);
    g.add(tatami, futon, pillow, shoji, table, cushion, ...frameV, ...frameH);
    g.rotation.x = 0.08;
    return { group: g, themed: [futon, cushion] };
  },

  /* 運送：配送トラック */
  truck: (mat) => {
    const g = new THREE.Group();
    const box = put(new THREE.BoxGeometry(2.6, 1.5, 1.5), mat, [-0.55, -0.15, 0]);
    const cab = put(new THREE.BoxGeometry(1.2, 1.1, 1.45), fixed(PALETTE.light), [1.35, -0.35, 0]);
    const windshield = put(
      new THREE.BoxGeometry(0.08, 0.55, 1.3),
      fixed(PALETTE.glass, { metalness: 0.5, roughness: 0.1 }),
      [1.95, -0.1, 0],
    );
    const chassis = put(new THREE.BoxGeometry(4.2, 0.18, 1.3), fixed(PALETTE.dark), [0.1, -0.95, 0]);
    const wheels: THREE.Mesh[] = [];
    [
      [1.35, 0.78],
      [1.35, -0.78],
      [-1.0, 0.78],
      [-1.0, -0.78],
      [-1.65, 0.78],
      [-1.65, -0.78],
    ].forEach(([x, z]) => {
      wheels.push(
        put(
          new THREE.CylinderGeometry(0.42, 0.42, 0.26, 24),
          fixed(PALETTE.rubber, { roughness: 0.95 }),
          [x, -1.15, z],
          [Math.PI / 2, 0, 0],
        ),
      );
    });
    const road = put(new THREE.BoxGeometry(6.5, 0.06, 3.0), fixed(0x3a4150), [0, -1.6, 0]);
    g.add(box, cab, windshield, chassis, road, ...wheels);
    return { group: g, themed: [box] };
  },

  /* 自動車：ホイールとタイヤ */
  wheel: (mat) => {
    const g = new THREE.Group();
    const tire = put(
      new THREE.TorusGeometry(1.45, 0.45, 24, 56),
      fixed(PALETTE.rubber, { roughness: 0.95 }),
      [0, 0, 0],
    );
    const rim = put(new THREE.CylinderGeometry(1.15, 1.15, 0.62, 48), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
    const hub = put(new THREE.CylinderGeometry(0.35, 0.35, 0.72, 24), mat, [0, 0, 0], [Math.PI / 2, 0, 0]);
    const spokes: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2;
      spokes.push(
        put(new THREE.BoxGeometry(0.9, 0.22, 0.34), mat, [Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.16], [0, 0, a]),
      );
    }
    const disc = put(
      new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32),
      fixed(0x8b929d, { metalness: 0.85, roughness: 0.35 }),
      [0, 0, -0.2],
      [Math.PI / 2, 0, 0],
    );
    g.add(tire, rim, hub, disc, ...spokes);
    return { group: g, themed: [rim, hub, ...spokes] };
  },

  /* 農業：収穫コンテナと野菜 */
  crate: (mat) => {
    const g = new THREE.Group();
    const bottom = put(new THREE.BoxGeometry(2.6, 0.12, 1.9), mat, [0, -1.0, 0]);
    const walls = [
      put(new THREE.BoxGeometry(2.6, 0.9, 0.1), mat, [0, -0.55, 0.9]),
      put(new THREE.BoxGeometry(2.6, 0.9, 0.1), mat, [0, -0.55, -0.9]),
      put(new THREE.BoxGeometry(0.1, 0.9, 1.9), mat, [1.25, -0.55, 0]),
      put(new THREE.BoxGeometry(0.1, 0.9, 1.9), mat, [-1.25, -0.55, 0]),
    ];
    const veggies: THREE.Mesh[] = [];
    const colors = [PALETTE.red, PALETTE.green, 0x7a4fa8, 0xe0a92b];
    for (let i = 0; i < 9; i += 1) {
      const c = colors[i % colors.length];
      veggies.push(
        put(
          new THREE.SphereGeometry(0.3, 20, 14),
          fixed(c, { roughness: 0.6 }),
          [-0.9 + (i % 3) * 0.9, -0.55 + Math.floor(i / 3) * 0.12, -0.5 + Math.floor(i / 3) * 0.5],
        ),
      );
    }
    const leaf = put(new THREE.ConeGeometry(0.22, 0.6, 10), fixed(PALETTE.green), [0.9, -0.1, 0.4], [0.3, 0, -0.4]);
    g.add(bottom, leaf, ...walls, ...veggies);
    return { group: g, themed: [bottom, ...walls] };
  },

  /* ブライダル：装花アーチとテーブル */
  arch: (mat) => {
    const g = new THREE.Group();
    const archMesh = put(new THREE.TorusGeometry(1.7, 0.11, 16, 48, Math.PI), mat, [0, -0.2, 0]);
    const legL = put(new THREE.CylinderGeometry(0.11, 0.11, 1.4, 12), mat, [-1.7, -0.9, 0]);
    const legR = put(new THREE.CylinderGeometry(0.11, 0.11, 1.4, 12), mat, [1.7, -0.9, 0]);
    const flowers: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i += 1) {
      const a = (i / 13) * Math.PI;
      const c = [0xf2c9d6, 0xffffff, 0xf6e6b8, PALETTE.green][i % 4];
      flowers.push(
        put(
          new THREE.SphereGeometry(0.16 + (i % 3) * 0.03, 14, 10),
          fixed(c, { roughness: 0.7 }),
          [Math.cos(a) * 1.7, -0.2 + Math.sin(a) * 1.7, (i % 2 ? 0.12 : -0.12)],
        ),
      );
    }
    const table = put(new THREE.CylinderGeometry(0.8, 0.8, 0.08, 32), fixed(0xf7f3ee), [0, -0.75, 1.4]);
    const tableLeg = put(new THREE.CylinderGeometry(0.1, 0.3, 0.85, 16), fixed(0xf7f3ee), [0, -1.2, 1.4]);
    const centerpiece = put(new THREE.SphereGeometry(0.28, 18, 12), fixed(0xf2c9d6), [0, -0.5, 1.4]);
    const runner = put(new THREE.CylinderGeometry(0.82, 0.82, 0.02, 32), fixed(PALETTE.gold), [0, -0.7, 1.4]);
    g.add(archMesh, legL, legR, table, tableLeg, centerpiece, runner, ...flowers);
    return { group: g, themed: [archMesh, legL, legR] };
  },

  /* 介護：介護ベッド（手すり・昇降） */
  "care-bed": (mat) => {
    const g = new THREE.Group();
    const frame = put(new THREE.BoxGeometry(3.2, 0.16, 1.6), fixed(PALETTE.light), [0, -0.75, 0]);
    const mattress = put(new THREE.BoxGeometry(3.0, 0.3, 1.5), mat, [0, -0.52, 0]);
    const backUp = put(new THREE.BoxGeometry(1.2, 0.28, 1.5), mat, [-1.05, -0.16, 0], [0, 0, 0.42]);
    const pillow = put(new THREE.BoxGeometry(0.7, 0.18, 1.0), fixed(0xf3f6fa), [-1.25, 0.16, 0], [0, 0, 0.42]);
    const railL = put(new THREE.BoxGeometry(1.4, 0.5, 0.06), fixed(0xb8bec9, { metalness: 0.7 }), [0.2, -0.2, 0.78]);
    const railR = put(new THREE.BoxGeometry(1.4, 0.5, 0.06), fixed(0xb8bec9, { metalness: 0.7 }), [0.2, -0.2, -0.78]);
    const head = put(new THREE.BoxGeometry(0.1, 0.8, 1.5), fixed(PALETTE.woodDark), [-1.6, -0.4, 0]);
    const foot = put(new THREE.BoxGeometry(0.1, 0.6, 1.5), fixed(PALETTE.woodDark), [1.6, -0.5, 0]);
    const legs = [
      [-1.4, 0.65],
      [-1.4, -0.65],
      [1.4, 0.65],
      [1.4, -0.65],
    ].map(([x, z]) => put(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12), fixed(PALETTE.dark), [x, -1.25, z]));
    g.add(frame, mattress, backUp, pillow, railL, railR, head, foot, ...legs);
    return { group: g, themed: [mattress, backUp] };
  },

  /* IT・SaaS：サーバーラックと流れるデータ */
  server: (mat) => {
    const g = new THREE.Group();
    const rack = put(new THREE.BoxGeometry(1.9, 3.0, 1.3), fixed(PALETTE.dark), [0, -0.1, 0]);
    const units: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      units.push(put(new THREE.BoxGeometry(1.7, 0.26, 0.08), mat, [0, 1.05 - i * 0.36, 0.66]));
    }
    const leds: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      leds.push(
        put(
          new THREE.SphereGeometry(0.045, 10, 8),
          new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x6ee7a8 : 0x38bdf8 }),
          [0.7, 1.05 - i * 0.36, 0.72],
        ),
      );
    }
    const cloud = put(new THREE.SphereGeometry(0.55, 20, 14), fixed(0x9ec9e8, { roughness: 0.4 }), [1.8, 1.5, 0]);
    const cloud2 = put(new THREE.SphereGeometry(0.38, 18, 12), fixed(0x9ec9e8, { roughness: 0.4 }), [2.35, 1.32, 0.1]);
    const linkA = put(
      new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      [1.15, 1.0, 0.3],
      [0, 0, -0.8],
    );
    g.add(rack, cloud, cloud2, linkA, ...units, ...leds);
    return { group: g, themed: units };
  },

  /* アパレル：トルソーに掛けた衣服 */
  garment: (mat) => {
    const g = new THREE.Group();
    const stand = put(new THREE.CylinderGeometry(0.6, 0.75, 0.1, 28), fixed(PALETTE.dark), [0, -1.75, 0]);
    const pole = put(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 12), fixed(PALETTE.dark), [0, -1.2, 0]);
    const torso = put(
      lathe([
        [0, -0.75],
        [0.52, -0.7],
        [0.44, -0.2],
        [0.58, 0.35],
        [0.5, 0.78],
        [0.24, 0.95],
        [0, 0.97],
      ]),
      mat,
    );
    const neck = put(new THREE.CylinderGeometry(0.16, 0.22, 0.34, 20), fixed(PALETTE.light), [0, 1.1, 0]);
    const shoulderL = put(new THREE.SphereGeometry(0.2, 16, 12), mat, [-0.45, 0.78, 0]);
    const shoulderR = put(new THREE.SphereGeometry(0.2, 16, 12), mat, [0.45, 0.78, 0]);
    const skirt = put(
      new THREE.ConeGeometry(0.95, 1.2, 32, 1, true),
      fixed(PALETTE.fabric, { side: THREE.DoubleSide, roughness: 0.85 }),
      [0, -1.15, 0],
    );
    const rail = put(
      new THREE.CylinderGeometry(0.04, 0.04, 2.6, 12),
      fixed(0xb8bec9, { metalness: 0.8 }),
      [1.9, 0.9, 0],
      [Math.PI / 2, 0, 0],
    );
    g.add(stand, pole, torso, neck, shoulderL, shoulderR, skirt, rail);
    return { group: g, themed: [torso, shoulderL, shoulderR] };
  },

  /* ------------------------------------------------------------------
   * 2つめ以降のモデル（職種ごとに3種類そろえるため）
   * ---------------------------------------------------------------- */

  /* 小売・EC：急須（注ぎ口・持ち手・蓋まで回して見せる） */
  teapot: (mat) => {
    const g = new THREE.Group();
    const body = put(
      lathe([
        [0, -0.95],
        [0.55, -0.95],
        [1.05, -0.5],
        [1.1, 0.1],
        [0.72, 0.5],
        [0.66, 0.55],
        [0.62, 0.1],
        [0.98, -0.45],
        [0.5, -0.85],
        [0, -0.85],
      ]),
      mat,
    );
    const lid = put(
      lathe([
        [0, 0.56],
        [0.66, 0.55],
        [0.5, 0.78],
        [0.12, 0.86],
        [0, 0.86],
      ]),
      mat,
      [0, 0.02, 0],
    );
    const knob = put(new THREE.SphereGeometry(0.14, 18, 12), fixed(PALETTE.dark), [0, 0.96, 0]);
    const spout = put(
      new THREE.CylinderGeometry(0.1, 0.24, 1.1, 20),
      mat,
      [-1.0, 0.12, 0],
      [0, 0, Math.PI / 2.6],
    );
    const handle = put(
      new THREE.TorusGeometry(0.42, 0.075, 16, 40, Math.PI * 1.1),
      fixed(PALETTE.woodDark),
      [1.35, 0.05, 0],
      [0, 0, -Math.PI / 2.2],
    );
    const tray = put(
      lathe([
        [0, -1.16],
        [1.55, -1.16],
        [1.58, -1.02],
        [0, -1.04],
      ]),
      fixed(PALETTE.woodDark, { roughness: 0.8 }),
    );
    const teacup = put(
      lathe([
        [0, -0.98],
        [0.34, -0.98],
        [0.4, -0.66],
        [0.35, -0.68],
        [0.3, -0.9],
        [0, -0.9],
      ]),
      mat,
      [1.05, 0, 0.95],
    );
    g.add(body, lid, knob, spout, handle, tray, teacup);
    return { group: g, themed: [body, lid, spout, teacup] };
  },

  /* 小売・EC：リボンをかけたギフトボックス */
  "gift-box": (mat) => {
    const g = new THREE.Group();
    const box = put(new THREE.BoxGeometry(2.4, 1.3, 1.8), mat, [0, -0.55, 0]);
    const lid = put(new THREE.BoxGeometry(2.5, 0.34, 1.9), mat, [0, 0.22, 0]);
    const ribbonA = put(new THREE.BoxGeometry(0.34, 1.72, 1.94), fixed(PALETTE.gold), [0, -0.3, 0]);
    const ribbonB = put(new THREE.BoxGeometry(2.54, 1.72, 0.34), fixed(PALETTE.gold), [0, -0.3, 0]);
    const bowL = put(
      new THREE.TorusGeometry(0.32, 0.1, 14, 28),
      fixed(PALETTE.gold),
      [-0.36, 0.5, 0],
      [Math.PI / 2, 0, 0.5],
    );
    const bowR = put(
      new THREE.TorusGeometry(0.32, 0.1, 14, 28),
      fixed(PALETTE.gold),
      [0.36, 0.5, 0],
      [Math.PI / 2, 0, -0.5],
    );
    const knot = put(new THREE.SphereGeometry(0.14, 16, 12), fixed(PALETTE.gold), [0, 0.46, 0]);
    const card = put(
      new THREE.BoxGeometry(0.7, 0.02, 0.45),
      fixed(0xf5f1e8),
      [1.05, -1.18, 0.9],
      [0, 0.4, 0],
    );
    const table = put(new THREE.BoxGeometry(4.2, 0.12, 3.0), fixed(PALETTE.woodDark), [0, -1.26, 0]);
    g.add(box, lid, ribbonA, ribbonB, bowL, bowR, knot, card, table);
    return { group: g, themed: [box, lid] };
  },

  /* 飲食店：ハンドドリップのコーヒーセット */
  "coffee-set": (mat) => {
    const g = new THREE.Group();
    const server = put(
      lathe([
        [0, -0.95],
        [0.62, -0.95],
        [0.66, -0.45],
        [0.58, 0.15],
        [0.52, 0.2],
        [0.5, -0.45],
        [0.56, -0.85],
        [0, -0.85],
      ]),
      fixed(PALETTE.glass, { transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.08 }),
    );
    const coffee = put(new THREE.CylinderGeometry(0.5, 0.55, 0.6, 28), fixed(0x4a2c1b), [0, -0.6, 0]);
    const dripper = put(
      new THREE.ConeGeometry(0.62, 0.62, 28, 1, true),
      mat,
      [0, 0.5, 0],
      [Math.PI, 0, 0],
    );
    const dripRim = put(new THREE.TorusGeometry(0.6, 0.055, 12, 32), mat, [0, 0.79, 0], [Math.PI / 2, 0, 0]);
    const kettle = put(
      lathe([
        [0, -0.95],
        [0.5, -0.95],
        [0.55, -0.55],
        [0.45, -0.25],
        [0.4, -0.2],
        [0.42, -0.55],
        [0.44, -0.9],
        [0, -0.9],
      ]),
      fixed(0xb8bec9, { metalness: 0.85, roughness: 0.28 }),
      [1.55, 0, -0.2],
    );
    const kettleSpout = put(
      new THREE.CylinderGeometry(0.05, 0.09, 1.0, 14),
      fixed(0xb8bec9, { metalness: 0.85, roughness: 0.28 }),
      [0.95, -0.25, -0.2],
      [0, 0, Math.PI / 2.2],
    );
    const beanBowl = put(
      lathe([
        [0, -0.95],
        [0.45, -0.95],
        [0.52, -0.65],
        [0.46, -0.66],
        [0.4, -0.88],
        [0, -0.88],
      ]),
      mat,
      [-1.5, 0, 0.5],
    );
    const beans: THREE.Mesh[] = [];
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      beans.push(
        put(
          new THREE.SphereGeometry(0.09, 12, 8),
          fixed(0x5b3623, { roughness: 0.65 }),
          [-1.5 + Math.cos(a) * 0.22, -0.72, 0.5 + Math.sin(a) * 0.22],
        ),
      );
    }
    const board = put(new THREE.BoxGeometry(4.4, 0.12, 2.4), fixed(PALETTE.woodDark), [0, -1.06, 0]);
    g.add(server, coffee, dripper, dripRim, kettle, kettleSpout, beanBowl, board, ...beans);
    return { group: g, themed: [dripper, dripRim, beanBowl] };
  },

  /* 飲食店：重箱の弁当（仕切りと中身） */
  bento: (mat) => {
    const g = new THREE.Group();
    const outer = put(new THREE.BoxGeometry(2.6, 0.7, 2.0), mat, [0, -0.65, 0]);
    const inner = put(new THREE.BoxGeometry(2.34, 0.5, 1.76), fixed(0x1b1f28), [0, -0.5, 0]);
    const lid = put(new THREE.BoxGeometry(2.7, 0.26, 2.1), mat, [0.1, 0.9, -1.2], [-0.5, 0, 0]);
    const divider = put(new THREE.BoxGeometry(0.06, 0.42, 1.76), fixed(PALETTE.light), [0.15, -0.42, 0]);
    const divider2 = put(new THREE.BoxGeometry(1.1, 0.42, 0.06), fixed(PALETTE.light), [-0.65, -0.42, 0]);
    const rice = put(new THREE.BoxGeometry(1.0, 0.3, 0.78), fixed(0xf4f1e6), [-0.65, -0.36, -0.44]);
    const ume = put(new THREE.SphereGeometry(0.11, 14, 10), fixed(PALETTE.red), [-0.65, -0.2, -0.44]);
    const egg = put(new THREE.BoxGeometry(0.9, 0.26, 0.6), fixed(0xe8c453), [-0.65, -0.38, 0.42]);
    const fish = put(new THREE.BoxGeometry(0.9, 0.22, 0.6), fixed(0xd08a5c), [0.75, -0.4, -0.44], [0, 0.2, 0]);
    const greens: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      greens.push(
        put(
          new THREE.SphereGeometry(0.15, 12, 9),
          fixed(PALETTE.green, { roughness: 0.7 }),
          [0.5 + (i % 3) * 0.3, -0.36, 0.28 + Math.floor(i / 3) * 0.3],
        ),
      );
    }
    const tray = put(new THREE.BoxGeometry(3.6, 0.1, 2.8), fixed(PALETTE.woodDark), [0, -1.05, 0]);
    g.add(outer, inner, lid, divider, divider2, rice, ume, egg, fish, tray, ...greens);
    return { group: g, themed: [outer, lid] };
  },

  /* クリニック：診療ワゴン（器具トレイつき） */
  "medical-cart": (mat) => {
    const g = new THREE.Group();
    const shelves = [-0.9, -0.2, 0.5].map((y) =>
      put(new THREE.BoxGeometry(1.7, 0.09, 1.2), mat, [0, y, 0]),
    );
    const posts = [
      [-0.78, 0.52],
      [0.78, 0.52],
      [-0.78, -0.52],
      [0.78, -0.52],
    ].map(([x, z]) =>
      put(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 10), fixed(0xb8bec9, { metalness: 0.8 }), [x, -0.2, z]),
    );
    const casters = [
      [-0.78, 0.52],
      [0.78, 0.52],
      [-0.78, -0.52],
      [0.78, -0.52],
    ].map(([x, z]) =>
      put(
        new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16),
        fixed(PALETTE.rubber, { roughness: 0.9 }),
        [x, -1.08, z],
        [Math.PI / 2, 0, 0],
      ),
    );
    const handle = put(
      new THREE.CylinderGeometry(0.05, 0.05, 1.5, 12),
      fixed(0xb8bec9, { metalness: 0.8 }),
      [0, 0.85, -0.52],
      [0, 0, Math.PI / 2],
    );
    const tray = put(new THREE.BoxGeometry(1.1, 0.06, 0.7), fixed(PALETTE.light), [0, 0.58, 0.05]);
    const tools = [-0.3, -0.1, 0.1].map((x) =>
      put(
        new THREE.CylinderGeometry(0.035, 0.02, 0.6, 10),
        fixed(0xdfe6ee, { metalness: 0.9, roughness: 0.2 }),
        [x, 0.64, 0.05],
        [Math.PI / 2, 0, 0.1],
      ),
    );
    const bottle = put(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 18), fixed(0x9fd8ef), [0.55, 0.76, 0.1]);
    const box = put(new THREE.BoxGeometry(0.8, 0.4, 0.5), fixed(0x2c5f8a), [-0.35, 0.0, 0]);
    g.add(handle, tray, bottle, box, ...shelves, ...posts, ...casters, ...tools);
    return { group: g, themed: shelves };
  },

  /* クリニック：待合ソファとローテーブル */
  "waiting-sofa": (mat) => {
    const g = new THREE.Group();
    const seat = put(new THREE.BoxGeometry(3.2, 0.34, 1.1), mat, [0, -0.62, 0]);
    const back = put(new THREE.BoxGeometry(3.2, 0.9, 0.26), mat, [0, -0.1, -0.55], [0.12, 0, 0]);
    const armL = put(new THREE.BoxGeometry(0.26, 0.62, 1.1), mat, [-1.6, -0.5, 0]);
    const armR = put(new THREE.BoxGeometry(0.26, 0.62, 1.1), mat, [1.6, -0.5, 0]);
    const cushions = [-1.0, 0, 1.0].map((x) =>
      put(new THREE.BoxGeometry(0.94, 0.2, 1.0), fixed(PALETTE.light, { roughness: 0.85 }), [x, -0.36, 0.02]),
    );
    const legs = [
      [-1.45, 0.42],
      [1.45, 0.42],
      [-1.45, -0.42],
      [1.45, -0.42],
    ].map(([x, z]) => put(new THREE.CylinderGeometry(0.06, 0.05, 0.5, 10), fixed(PALETTE.woodDark), [x, -1.04, z]));
    const table = put(new THREE.BoxGeometry(1.5, 0.09, 0.8), fixed(PALETTE.woodDark), [0, -0.85, 1.6]);
    const tableLegs = [-0.6, 0.6].map((x) =>
      put(new THREE.BoxGeometry(0.08, 0.42, 0.7), fixed(PALETTE.woodDark), [x, -1.08, 1.6]),
    );
    const magazine = put(new THREE.BoxGeometry(0.5, 0.04, 0.36), fixed(0x2c5f8a), [0.3, -0.78, 1.62], [0, 0.3, 0]);
    const plant = put(new THREE.SphereGeometry(0.34, 16, 12), fixed(PALETTE.green), [2.1, -0.6, -0.2]);
    const pot = put(new THREE.CylinderGeometry(0.24, 0.18, 0.42, 16), fixed(0xd8cfc0), [2.1, -1.05, -0.2]);
    const floor = put(new THREE.BoxGeometry(5.4, 0.08, 4.0), fixed(0x3a4150), [0, -1.3, 0.4]);
    g.add(seat, back, armL, armR, table, magazine, plant, pot, floor, ...cushions, ...legs, ...tableLegs);
    return { group: g, themed: [seat, back, armL, armR] };
  },

  /* 製造業：歯車ユニット（かみ合う2枚の歯車） */
  gearbox: (mat) => {
    const g = new THREE.Group();
    const housing = put(new THREE.BoxGeometry(3.0, 1.9, 0.9), fixed(PALETTE.dark), [0, 0, -0.55]);
    const gear = (r: number, teeth: number, cx: number, cy: number, phase: number) => {
      const parts: THREE.Mesh[] = [];
      const disc = put(new THREE.CylinderGeometry(r, r, 0.4, 40), mat, [cx, cy, 0], [Math.PI / 2, 0, 0]);
      parts.push(disc);
      for (let i = 0; i < teeth; i += 1) {
        const a = (i / teeth) * Math.PI * 2 + phase;
        parts.push(
          put(
            new THREE.BoxGeometry(0.24, 0.3, 0.4),
            mat,
            [cx + Math.cos(a) * (r + 0.1), cy + Math.sin(a) * (r + 0.1), 0],
            [0, 0, a],
          ),
        );
      }
      const hub = put(
        new THREE.CylinderGeometry(0.22, 0.22, 0.9, 20),
        fixed(0x8b929d, { metalness: 0.85, roughness: 0.3 }),
        [cx, cy, 0],
        [Math.PI / 2, 0, 0],
      );
      parts.push(hub);
      return parts;
    };
    const big = gear(1.05, 16, -0.75, 0, 0);
    const small = gear(0.62, 10, 0.95, 0.1, 0.3);
    const belt = put(
      new THREE.TorusGeometry(0.5, 0.06, 12, 32),
      fixed(PALETTE.rubber, { roughness: 0.9 }),
      [0.95, 0.1, 0.32],
    );
    const base = put(new THREE.BoxGeometry(3.6, 0.22, 1.6), fixed(0x6b7382), [0, -1.35, -0.2]);
    g.add(housing, belt, base, ...big, ...small);
    return { group: g, themed: [...big.slice(0, -1), ...small.slice(0, -1)] };
  },

  /* 製造業：ベルトコンベア（搬送ライン） */
  conveyor: (mat) => {
    const g = new THREE.Group();
    const belt = put(new THREE.BoxGeometry(4.4, 0.12, 1.2), fixed(PALETTE.rubber, { roughness: 0.9 }), [0, -0.1, 0]);
    const railL = put(new THREE.BoxGeometry(4.5, 0.28, 0.1), mat, [0, -0.02, 0.65]);
    const railR = put(new THREE.BoxGeometry(4.5, 0.28, 0.1), mat, [0, -0.02, -0.65]);
    const rollers: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i += 1) {
      rollers.push(
        put(
          new THREE.CylinderGeometry(0.16, 0.16, 1.3, 18),
          fixed(0x8b929d, { metalness: 0.8, roughness: 0.3 }),
          [-1.9 + i * 0.76, -0.28, 0],
          [Math.PI / 2, 0, 0],
        ),
      );
    }
    const legs = [-1.7, 1.7].flatMap((x) =>
      [-0.5, 0.5].map((z) => put(new THREE.BoxGeometry(0.12, 1.2, 0.12), mat, [x, -0.85, z])),
    );
    const cargo = [
      [-1.2, 0xc4483a],
      [0.1, 0x3f6fb0],
      [1.4, 0xe0a92b],
    ].map(([x, c]) =>
      put(new THREE.BoxGeometry(0.62, 0.55, 0.62), fixed(c as number), [x as number, 0.26, 0], [0, 0.2, 0]),
    );
    const arm = put(new THREE.BoxGeometry(0.16, 1.4, 0.16), fixed(0xe0a92b), [1.9, 0.85, -0.9]);
    const armH = put(new THREE.BoxGeometry(1.0, 0.16, 0.16), fixed(0xe0a92b), [1.45, 1.5, -0.9]);
    const floor = put(new THREE.BoxGeometry(5.6, 0.08, 3.0), fixed(0x39404e), [0, -1.5, 0]);
    g.add(belt, railL, railR, arm, armH, floor, ...rollers, ...legs, ...cargo);
    return { group: g, themed: [railL, railR, ...legs] };
  },

  /* 不動産：マンション棟（外観） */
  apartment: (mat) => {
    const g = new THREE.Group();
    const body = put(new THREE.BoxGeometry(2.6, 3.4, 1.8), mat, [0, -0.1, 0]);
    const wing = put(new THREE.BoxGeometry(1.2, 2.6, 1.6), mat, [1.85, -0.5, 0]);
    const slabs: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      slabs.push(
        put(new THREE.BoxGeometry(2.75, 0.1, 2.0), fixed(PALETTE.light), [0, -1.5 + i * 0.72, 0]),
      );
    }
    const windows: THREE.Mesh[] = [];
    for (let f = 0; f < 4; f += 1) {
      for (let c = 0; c < 3; c += 1) {
        windows.push(
          put(
            new THREE.BoxGeometry(0.6, 0.44, 0.06),
            fixed(PALETTE.glass, { metalness: 0.4, roughness: 0.12 }),
            [-0.85 + c * 0.85, -1.18 + f * 0.72, 0.92],
          ),
        );
      }
    }
    const rails: THREE.Mesh[] = [];
    for (let f = 0; f < 4; f += 1) {
      rails.push(
        put(
          new THREE.BoxGeometry(2.7, 0.3, 0.05),
          fixed(0xa9b4c4, { metalness: 0.5, roughness: 0.4 }),
          [0, -1.28 + f * 0.72, 1.0],
        ),
      );
    }
    const roof = put(new THREE.BoxGeometry(2.8, 0.2, 2.0), fixed(PALETTE.dark), [0, 1.68, 0]);
    const entrance = put(new THREE.BoxGeometry(1.0, 0.8, 0.12), fixed(PALETTE.glass, { metalness: 0.4 }), [0, -1.4, 0.95]);
    const ground = put(new THREE.BoxGeometry(5.4, 0.12, 3.6), fixed(0x6f7c68), [0.3, -1.86, 0]);
    g.add(body, wing, roof, entrance, ground, ...slabs, ...windows, ...rails);
    return { group: g, themed: [body, wing] };
  },

  /* 不動産：システムキッチン（水回りの見せ場） */
  kitchen: (mat) => {
    const g = new THREE.Group();
    const counter = put(new THREE.BoxGeometry(3.4, 0.1, 1.2), fixed(PALETTE.light, { roughness: 0.4 }), [0, -0.3, 0]);
    const cabinet = put(new THREE.BoxGeometry(3.3, 1.1, 1.1), mat, [0, -0.9, 0]);
    const doors = [-1.05, 0, 1.05].map((x) =>
      put(new THREE.BoxGeometry(0.98, 0.98, 0.06), mat, [x, -0.9, 0.58]),
    );
    const handles = [-1.05, 0, 1.05].map((x) =>
      put(
        new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10),
        fixed(0xb8bec9, { metalness: 0.9, roughness: 0.2 }),
        [x, -0.55, 0.64],
        [0, 0, Math.PI / 2],
      ),
    );
    const sink = put(new THREE.BoxGeometry(0.9, 0.24, 0.7), fixed(0xa9b4c4, { metalness: 0.7, roughness: 0.25 }), [-0.85, -0.4, 0]);
    const faucet = put(
      new THREE.CylinderGeometry(0.045, 0.045, 0.7, 12),
      fixed(0xb8bec9, { metalness: 0.9, roughness: 0.18 }),
      [-0.85, 0.05, -0.4],
    );
    const spout = put(
      new THREE.TorusGeometry(0.18, 0.045, 10, 20, Math.PI / 1.6),
      fixed(0xb8bec9, { metalness: 0.9, roughness: 0.18 }),
      [-0.85, 0.38, -0.28],
      [Math.PI / 2, 0, -0.6],
    );
    const stove = put(new THREE.BoxGeometry(0.9, 0.04, 0.6), fixed(0x1b1f28), [0.95, -0.23, 0]);
    const burners = [-0.2, 0.2].map((d) =>
      put(new THREE.TorusGeometry(0.15, 0.03, 10, 24), fixed(0x3d434f), [0.95 + d, -0.19, 0], [Math.PI / 2, 0, 0]),
    );
    const hood = put(new THREE.CylinderGeometry(0.55, 0.75, 0.4, 4, 1, true), fixed(0xb8bec9, { metalness: 0.7, side: THREE.DoubleSide }), [0.95, 1.15, -0.1], [Math.PI, Math.PI / 4, 0]);
    const upper = put(new THREE.BoxGeometry(1.4, 0.8, 0.45), mat, [-0.9, 1.15, -0.3]);
    const wall = put(new THREE.BoxGeometry(4.0, 3.0, 0.1), fixed(0x39404e), [0, 0.2, -0.62]);
    const floor = put(new THREE.BoxGeometry(4.4, 0.1, 2.4), fixed(PALETTE.woodDark), [0, -1.5, 0.2]);
    g.add(counter, cabinet, sink, faucet, spout, stove, hood, upper, wall, floor, ...doors, ...handles, ...burners);
    return { group: g, themed: [cabinet, upper, ...doors] };
  },

  /* 建設・工務店：木造の躯体（柱・梁・小屋組） */
  "timber-frame": (mat) => {
    const g = new THREE.Group();
    const sill = [
      put(new THREE.BoxGeometry(3.6, 0.18, 0.18), mat, [0, -1.4, 1.2]),
      put(new THREE.BoxGeometry(3.6, 0.18, 0.18), mat, [0, -1.4, -1.2]),
      put(new THREE.BoxGeometry(0.18, 0.18, 2.4), mat, [1.8, -1.4, 0]),
      put(new THREE.BoxGeometry(0.18, 0.18, 2.4), mat, [-1.8, -1.4, 0]),
    ];
    const posts = [
      [-1.8, 1.2],
      [1.8, 1.2],
      [-1.8, -1.2],
      [1.8, -1.2],
      [0, 1.2],
      [0, -1.2],
    ].map(([x, z]) => put(new THREE.BoxGeometry(0.18, 2.0, 0.18), mat, [x, -0.4, z]));
    const beams = [
      put(new THREE.BoxGeometry(3.8, 0.2, 0.2), mat, [0, 0.65, 1.2]),
      put(new THREE.BoxGeometry(3.8, 0.2, 0.2), mat, [0, 0.65, -1.2]),
      put(new THREE.BoxGeometry(0.2, 0.2, 2.6), mat, [1.8, 0.65, 0]),
      put(new THREE.BoxGeometry(0.2, 0.2, 2.6), mat, [-1.8, 0.65, 0]),
    ];
    const ridge = put(new THREE.BoxGeometry(3.8, 0.18, 0.18), mat, [0, 1.75, 0]);
    const rafters: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      const x = -1.6 + i * 0.8;
      rafters.push(put(new THREE.BoxGeometry(0.12, 1.7, 0.12), mat, [x, 1.2, 0.65], [-0.62, 0, 0]));
      rafters.push(put(new THREE.BoxGeometry(0.12, 1.7, 0.12), mat, [x, 1.2, -0.65], [0.62, 0, 0]));
    }
    const brace = put(new THREE.BoxGeometry(0.12, 2.4, 0.12), fixed(PALETTE.woodDark), [-0.9, -0.4, -1.2], [0, 0, 0.72]);
    const slab = put(new THREE.BoxGeometry(4.2, 0.16, 3.0), fixed(0x8a8f98), [0, -1.56, 0]);
    g.add(ridge, brace, slab, ...sill, ...posts, ...beams, ...rafters);
    return { group: g, themed: [...posts, ...beams, ...rafters, ridge, ...sill] };
  },

  /* 建設・工務店：ウッドデッキ（外構の提案） */
  deck: (mat) => {
    const g = new THREE.Group();
    const planks: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i += 1) {
      planks.push(put(new THREE.BoxGeometry(3.6, 0.1, 0.32), mat, [0, -0.6, -1.4 + i * 0.36]));
    }
    const joists = [-1.5, 0, 1.5].map((x) =>
      put(new THREE.BoxGeometry(0.14, 0.3, 3.2), fixed(PALETTE.woodDark), [x, -0.82, 0]),
    );
    const legs = [-1.5, 1.5].flatMap((x) =>
      [-1.3, 1.3].map((z) => put(new THREE.BoxGeometry(0.16, 0.6, 0.16), fixed(PALETTE.woodDark), [x, -1.25, z])),
    );
    const railPosts = [-1.7, -0.55, 0.6, 1.7].map((x) =>
      put(new THREE.BoxGeometry(0.14, 1.1, 0.14), mat, [x, 0.0, -1.5]),
    );
    const rail = put(new THREE.BoxGeometry(3.7, 0.12, 0.2), mat, [0, 0.52, -1.5]);
    const railLow = put(new THREE.BoxGeometry(3.7, 0.08, 0.14), mat, [0, 0.05, -1.5]);
    const step = put(new THREE.BoxGeometry(1.4, 0.1, 0.34), mat, [0.7, -0.95, 1.55]);
    const chair = put(new THREE.BoxGeometry(0.6, 0.08, 0.6), fixed(PALETTE.light), [-1.0, -0.2, 0.5]);
    const chairBack = put(new THREE.BoxGeometry(0.6, 0.5, 0.08), fixed(PALETTE.light), [-1.0, 0.05, 0.24], [0.3, 0, 0]);
    const planter = put(new THREE.BoxGeometry(0.5, 0.4, 0.5), fixed(0xd8cfc0), [1.3, -0.35, 0.9]);
    const plant = put(new THREE.SphereGeometry(0.3, 14, 10), fixed(PALETTE.green), [1.3, 0.0, 0.9]);
    const lawn = put(new THREE.BoxGeometry(5.4, 0.1, 4.4), fixed(0x6f7c68), [0, -1.6, 0]);
    g.add(rail, railLow, step, chair, chairBack, planter, plant, lawn, ...planks, ...joists, ...legs, ...railPosts);
    return { group: g, themed: [...planks, rail, railLow, ...railPosts, step] };
  },

  /* 学習塾：ホワイトボードと教壇 */
  whiteboard: (mat) => {
    const g = new THREE.Group();
    const board = put(new THREE.BoxGeometry(3.6, 2.0, 0.1), fixed(0xf5f7fa, { roughness: 0.35 }), [0, 0.35, 0]);
    const frameT = put(new THREE.BoxGeometry(3.76, 0.12, 0.18), mat, [0, 1.41, 0]);
    const frameB = put(new THREE.BoxGeometry(3.76, 0.12, 0.18), mat, [0, -0.71, 0]);
    const frameL = put(new THREE.BoxGeometry(0.12, 2.12, 0.18), mat, [-1.82, 0.35, 0]);
    const frameR = put(new THREE.BoxGeometry(0.12, 2.12, 0.18), mat, [1.82, 0.35, 0]);
    const tray = put(new THREE.BoxGeometry(3.2, 0.08, 0.24), mat, [0, -0.82, 0.14], [0.2, 0, 0]);
    const markers = [-0.5, -0.25, 0].map((x, i) =>
      put(
        new THREE.CylinderGeometry(0.045, 0.045, 0.34, 10),
        fixed([PALETTE.dark, PALETTE.red, 0x3f6fb0][i]),
        [x, -0.76, 0.16],
        [0, 0, Math.PI / 2],
      ),
    );
    // 板書（数式の線を細い板で表す）
    const writing = [
      [-0.9, 0.85, 1.2],
      [-0.4, 0.5, 2.2],
      [-1.0, 0.15, 1.0],
      [0.2, -0.2, 1.6],
    ].map(([x, y, w]) =>
      put(new THREE.BoxGeometry(w, 0.05, 0.02), fixed(0x3f6fb0), [x, y, 0.07]),
    );
    const legs = [-1.5, 1.5].map((x) =>
      put(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12), fixed(PALETTE.dark), [x, -1.42, 0]),
    );
    const feet = [-1.5, 1.5].map((x) =>
      put(new THREE.BoxGeometry(0.16, 0.1, 0.9), fixed(PALETTE.dark), [x, -2.05, 0]),
    );
    const podium = put(new THREE.BoxGeometry(0.9, 1.0, 0.55), mat, [2.4, -1.5, 0.7]);
    const podiumTop = put(new THREE.BoxGeometry(1.0, 0.08, 0.65), fixed(PALETTE.woodDark), [2.4, -0.96, 0.7], [-0.12, 0, 0]);
    g.add(board, frameT, frameB, frameL, frameR, tray, podium, podiumTop, ...markers, ...writing, ...legs, ...feet);
    g.position.y = 0.3;
    return { group: g, themed: [frameT, frameB, frameL, frameR, tray, podium] };
  },

  /* 学習塾：教材棚（テキストが並ぶ本棚） */
  bookshelf: (mat) => {
    const g = new THREE.Group();
    const sideL = put(new THREE.BoxGeometry(0.12, 3.4, 0.9), mat, [-1.5, 0, 0]);
    const sideR = put(new THREE.BoxGeometry(0.12, 3.4, 0.9), mat, [1.5, 0, 0]);
    const top = put(new THREE.BoxGeometry(3.12, 0.12, 0.9), mat, [0, 1.64, 0]);
    const bottom = put(new THREE.BoxGeometry(3.12, 0.12, 0.9), mat, [0, -1.64, 0]);
    const back = put(new THREE.BoxGeometry(3.0, 3.3, 0.06), fixed(0x39404e), [0, 0, -0.44]);
    const shelves = [-0.82, 0.0, 0.82].map((y) =>
      put(new THREE.BoxGeometry(2.9, 0.1, 0.86), mat, [0, y, 0]),
    );
    const bookColors = [0xc4483a, 0x3f6fb0, 0x4fa96b, 0xe0a92b, 0x7a4fa8, 0xd8cfc0];
    const books: THREE.Mesh[] = [];
    [-1.58, -0.76, 0.06, 0.88].forEach((base, row) => {
      let x = -1.36;
      for (let i = 0; i < 12; i += 1) {
        const w = 0.1 + ((i + row) % 3) * 0.045;
        const h = 0.6 + ((i * 7 + row) % 3) * 0.06;
        books.push(
          put(
            new THREE.BoxGeometry(w, h, 0.62),
            fixed(bookColors[(i + row * 2) % bookColors.length], { roughness: 0.7 }),
            [x + w / 2, base + 0.06 + h / 2, 0.02],
            [0, 0, i === 11 ? 0.22 : 0],
          ),
        );
        x += w + 0.02;
        if (x > 1.3) break;
      }
    });
    const globe = put(new THREE.SphereGeometry(0.26, 18, 12), fixed(0x2c5f8a), [1.05, 1.94, 0]);
    g.add(sideL, sideR, top, bottom, back, globe, ...shelves, ...books);
    return { group: g, themed: [sideL, sideR, top, bottom, ...shelves] };
  },

  /* 士業：相談ブース（机・椅子・パーティション） */
  "consult-table": (mat) => {
    const g = new THREE.Group();
    const top = put(new THREE.BoxGeometry(2.6, 0.1, 1.3), mat, [0, -0.3, 0]);
    const apron = put(new THREE.BoxGeometry(2.4, 0.24, 0.1), mat, [0, -0.5, -0.55]);
    const legs = [-1.15, 1.15].flatMap((x) =>
      [-0.5, 0.5].map((z) => put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [x, -0.95, z])),
    );
    const chairA = [
      put(new THREE.BoxGeometry(0.7, 0.1, 0.7), fixed(PALETTE.fabric), [0, -0.75, 1.35]),
      put(new THREE.BoxGeometry(0.7, 0.7, 0.1), fixed(PALETTE.fabric), [0, -0.4, 1.68], [0.12, 0, 0]),
    ];
    const chairB = [
      put(new THREE.BoxGeometry(0.7, 0.1, 0.7), fixed(PALETTE.fabric), [0, -0.75, -1.35]),
      put(new THREE.BoxGeometry(0.7, 0.7, 0.1), fixed(PALETTE.fabric), [0, -0.4, -1.68], [-0.12, 0, 0]),
    ];
    const chairLegs = [1.35, -1.35].flatMap((z) =>
      [-0.26, 0.26].flatMap((x) =>
        [-0.26, 0.26].map((dz) =>
          put(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), fixed(PALETTE.dark), [x, -1.18, z + dz]),
        ),
      ),
    );
    const papers = [0, 0.03].map((y, i) =>
      put(new THREE.BoxGeometry(0.6, 0.02, 0.85), fixed(0xf5f1e8), [-0.4, -0.23 + y, 0], [0, i ? 0.06 : -0.04, 0]),
    );
    const pen = put(
      new THREE.CylinderGeometry(0.03, 0.02, 0.5, 10),
      fixed(PALETTE.dark),
      [0.05, -0.22, 0.25],
      [0, 0.4, Math.PI / 2],
    );
    const tablet = put(new THREE.BoxGeometry(0.7, 0.03, 0.5), fixed(PALETTE.dark), [0.75, -0.23, 0.05], [0, -0.2, 0]);
    const screen = put(
      new THREE.PlaneGeometry(0.62, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x2f6f8f }),
      [0.75, -0.21, 0.05],
      [-Math.PI / 2, 0, -0.2],
    );
    const partition = put(new THREE.BoxGeometry(3.2, 1.8, 0.1), fixed(0x4b5568), [0, -0.2, -2.2]);
    const floor = put(new THREE.BoxGeometry(5.0, 0.08, 4.4), fixed(0x39404e), [0, -1.58, 0]);
    g.add(top, apron, pen, tablet, screen, partition, floor, ...legs, ...chairA, ...chairB, ...chairLegs, ...papers);
    return { group: g, themed: [top, apron] };
  },

  /* 士業：書庫キャビネット（引き出しとファイル） */
  cabinet: (mat) => {
    const g = new THREE.Group();
    const body = put(new THREE.BoxGeometry(2.2, 2.8, 1.1), mat, [0, -0.2, 0]);
    const drawers: THREE.Mesh[] = [];
    const handles: THREE.Mesh[] = [];
    const labels: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i += 1) {
      const y = -1.35 + i * 0.7;
      drawers.push(put(new THREE.BoxGeometry(2.0, 0.62, 0.08), fixed(0xd9dee6), [0, y, 0.56]));
      handles.push(
        put(
          new THREE.CylinderGeometry(0.035, 0.035, 0.8, 10),
          fixed(0x8b929d, { metalness: 0.85, roughness: 0.25 }),
          [0, y, 0.63],
          [0, 0, Math.PI / 2],
        ),
      );
      labels.push(put(new THREE.BoxGeometry(0.5, 0.14, 0.02), fixed(0x2c5f8a), [-0.62, y + 0.2, 0.62]));
    }
    // いちばん上の引き出しだけ開けて、中のファイルを見せる
    const openBox = put(new THREE.BoxGeometry(1.9, 0.55, 0.9), fixed(0xc7ced8), [0, 0.75, 1.05]);
    const files: THREE.Mesh[] = [];
    const fileColors = [0x2c5f8a, 0xc4483a, 0x4fa96b, 0xe0a92b];
    for (let i = 0; i < 8; i += 1) {
      files.push(
        put(
          new THREE.BoxGeometry(1.7, 0.6, 0.07),
          fixed(fileColors[i % 4], { roughness: 0.75 }),
          [0, 0.85, 0.72 + i * 0.085],
          [i === 7 ? 0.16 : 0, 0, 0],
        ),
      );
    }
    const top = put(new THREE.BoxGeometry(2.32, 0.1, 1.2), fixed(PALETTE.woodDark), [0, 1.25, 0]);
    const plant = put(new THREE.ConeGeometry(0.26, 0.7, 12), fixed(PALETTE.green), [0.7, 1.65, 0]);
    const pot = put(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 14), fixed(0xd8cfc0), [0.7, 1.45, 0]);
    const base = put(new THREE.BoxGeometry(2.1, 0.14, 1.0), fixed(PALETTE.dark), [0, -1.67, 0]);
    g.add(body, openBox, top, plant, pot, base, ...drawers, ...handles, ...labels, ...files);
    return { group: g, themed: [body] };
  },

  /* 美容室：シャンプー台 */
  "shampoo-basin": (mat) => {
    const g = new THREE.Group();
    const base = put(new THREE.BoxGeometry(1.5, 0.24, 2.6), fixed(PALETTE.dark), [0, -1.62, 0.2]);
    const seat = put(new THREE.BoxGeometry(1.3, 0.3, 1.7), mat, [0, -0.9, 0.55]);
    const back = put(new THREE.BoxGeometry(1.25, 1.7, 0.3), mat, [0, -0.35, -0.55], [0.62, 0, 0]);
    const legRest = put(new THREE.BoxGeometry(1.2, 0.24, 1.0), mat, [0, -1.05, 1.7], [-0.18, 0, 0]);
    const bowl = put(
      lathe([
        [0, 0],
        [0.72, 0.12],
        [0.8, 0.5],
        [0.74, 0.52],
        [0.66, 0.16],
        [0, 0.06],
      ]),
      fixed(0xf1f4f8, { roughness: 0.25 }),
      [0, -0.1, -1.35],
      [0.35, 0, 0],
    );
    const neckRest = put(
      new THREE.TorusGeometry(0.3, 0.09, 14, 28, Math.PI),
      fixed(PALETTE.rubber, { roughness: 0.85 }),
      [0, 0.2, -1.05],
      [0.4, 0, Math.PI],
    );
    const faucet = put(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 12),
      fixed(0xb8bec9, { metalness: 0.9, roughness: 0.18 }),
      [0, 0.5, -1.85],
    );
    const hose = put(
      new THREE.TorusGeometry(0.26, 0.045, 10, 24, Math.PI * 1.2),
      fixed(0xb8bec9, { metalness: 0.7, roughness: 0.3 }),
      [0.3, 0.6, -1.7],
      [0.3, 0, -0.4],
    );
    const bottles = [-0.5, -0.25].map((x, i) =>
      put(
        new THREE.CylinderGeometry(0.11, 0.11, 0.44, 14),
        fixed(i ? 0x9fd8ef : 0xf2c9d6),
        [x, 0.5, -2.1],
      ),
    );
    const shelf = put(new THREE.BoxGeometry(1.4, 0.08, 0.4), fixed(PALETTE.light), [0, 0.24, -2.1]);
    const towel = put(new THREE.BoxGeometry(0.6, 0.14, 0.4), fixed(PALETTE.light), [0.55, 0.34, -2.05]);
    g.add(base, seat, back, legRest, bowl, neckRest, faucet, hose, shelf, towel, ...bottles);
    g.rotation.y = 0.5;
    return { group: g, themed: [seat, back, legRest] };
  },

  /* 美容室：施術ワゴン（ドライヤー・道具一式） */
  "salon-cart": (mat) => {
    const g = new THREE.Group();
    const trays = [-0.95, -0.3, 0.35].map((y) =>
      put(new THREE.BoxGeometry(1.4, 0.08, 1.0), mat, [0, y, 0]),
    );
    const lips = [-0.95, -0.3, 0.35].flatMap((y) => [
      put(new THREE.BoxGeometry(1.4, 0.14, 0.06), mat, [0, y + 0.1, 0.47]),
      put(new THREE.BoxGeometry(1.4, 0.14, 0.06), mat, [0, y + 0.1, -0.47]),
    ]);
    const posts = [
      [-0.62, 0.42],
      [0.62, 0.42],
      [-0.62, -0.42],
      [0.62, -0.42],
    ].map(([x, z]) =>
      put(new THREE.CylinderGeometry(0.045, 0.045, 1.5, 10), fixed(0xb8bec9, { metalness: 0.8 }), [x, -0.3, z]),
    );
    const casters = [
      [-0.62, 0.42],
      [0.62, 0.42],
      [-0.62, -0.42],
      [0.62, -0.42],
    ].map(([x, z]) =>
      put(
        new THREE.CylinderGeometry(0.12, 0.12, 0.07, 14),
        fixed(PALETTE.rubber, { roughness: 0.9 }),
        [x, -1.16, z],
        [Math.PI / 2, 0, 0],
      ),
    );
    // ドライヤー
    const dryerBody = put(
      new THREE.CylinderGeometry(0.22, 0.26, 0.7, 20),
      fixed(PALETTE.dark),
      [0.35, 0.62, 0],
      [0, 0, Math.PI / 2.2],
    );
    const dryerGrip = put(new THREE.BoxGeometry(0.16, 0.5, 0.2), fixed(PALETTE.dark), [0.15, 0.38, 0], [0, 0, 0.3]);
    const dryerNose = put(
      new THREE.CylinderGeometry(0.16, 0.2, 0.22, 18),
      fixed(0xb8bec9, { metalness: 0.7 }),
      [0.72, 0.78, 0],
      [0, 0, Math.PI / 2.2],
    );
    // 道具
    const scissorsA = put(
      new THREE.BoxGeometry(0.5, 0.03, 0.05),
      fixed(0xdfe6ee, { metalness: 0.9, roughness: 0.15 }),
      [-0.4, 0.42, 0.15],
      [0, 0.25, 0],
    );
    const scissorsB = put(
      new THREE.BoxGeometry(0.5, 0.03, 0.05),
      fixed(0xdfe6ee, { metalness: 0.9, roughness: 0.15 }),
      [-0.4, 0.42, 0.15],
      [0, -0.25, 0],
    );
    const comb = put(new THREE.BoxGeometry(0.44, 0.02, 0.14), fixed(PALETTE.dark), [-0.35, 0.42, -0.2], [0, 0.5, 0]);
    const bottles = [-0.4, -0.05, 0.3].map((x, i) =>
      put(
        new THREE.CylinderGeometry(0.12, 0.12, 0.5, 14),
        fixed([0xf2c9d6, 0x9fd8ef, 0xe0a92b][i]),
        [x, -0.02, 0],
      ),
    );
    const roller = put(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), fixed(0xd8cfc0), [0.3, -0.68, 0.2], [0, 0, Math.PI / 2]);
    g.add(
      dryerBody,
      dryerGrip,
      dryerNose,
      scissorsA,
      scissorsB,
      comb,
      roller,
      ...trays,
      ...lips,
      ...posts,
      ...casters,
      ...bottles,
    );
    return { group: g, themed: [...trays, ...lips] };
  },

  /* フィットネス：ベンチプレス */
  "bench-press": (mat) => {
    const g = new THREE.Group();
    const pad = put(new THREE.BoxGeometry(2.4, 0.24, 0.7), mat, [0, -0.5, 0]);
    const padHead = put(new THREE.BoxGeometry(0.7, 0.24, 0.66), mat, [-1.35, -0.38, 0], [0, 0, 0.22]);
    const frame = put(new THREE.BoxGeometry(2.6, 0.12, 0.16), fixed(PALETTE.dark), [0, -0.68, 0]);
    const legA = put(new THREE.BoxGeometry(0.14, 0.9, 0.9), fixed(PALETTE.dark), [1.0, -1.15, 0]);
    const legB = put(new THREE.BoxGeometry(0.14, 0.9, 0.9), fixed(PALETTE.dark), [-1.0, -1.15, 0]);
    const rackL = put(new THREE.BoxGeometry(0.16, 2.2, 0.16), fixed(PALETTE.dark), [-1.5, -0.5, 0.75]);
    const rackR = put(new THREE.BoxGeometry(0.16, 2.2, 0.16), fixed(PALETTE.dark), [-1.5, -0.5, -0.75]);
    const hookL = put(new THREE.BoxGeometry(0.3, 0.2, 0.14), fixed(PALETTE.red), [-1.35, 0.55, 0.75]);
    const hookR = put(new THREE.BoxGeometry(0.3, 0.2, 0.14), fixed(PALETTE.red), [-1.35, 0.55, -0.75]);
    const bar = put(
      new THREE.CylinderGeometry(0.07, 0.07, 3.0, 20),
      fixed(0xc3c9d2, { metalness: 0.95, roughness: 0.22 }),
      [-1.3, 0.66, 0],
      [Math.PI / 2, 0, 0],
    );
    const plates: THREE.Mesh[] = [];
    [-1, 1].forEach((s) => {
      [0, 0.28].forEach((o, i) => {
        plates.push(
          put(
            new THREE.CylinderGeometry(i === 0 ? 0.62 : 0.44, i === 0 ? 0.62 : 0.44, 0.16, 28),
            mat,
            [-1.3, 0.66, s * (1.05 + o)],
            [Math.PI / 2, 0, 0],
          ),
        );
      });
    });
    const floorMat = put(new THREE.BoxGeometry(4.4, 0.1, 2.8), fixed(PALETTE.rubber, { roughness: 0.95 }), [-0.2, -1.62, 0]);
    g.add(pad, padHead, frame, legA, legB, rackL, rackR, hookL, hookR, bar, floorMat, ...plates);
    return { group: g, themed: [pad, padHead, ...plates] };
  },

  /* フィットネス：ランニングマシン */
  treadmill: (mat) => {
    const g = new THREE.Group();
    const deck = put(new THREE.BoxGeometry(2.8, 0.22, 1.2), mat, [0, -1.0, 0]);
    const belt = put(new THREE.BoxGeometry(2.4, 0.08, 0.9), fixed(PALETTE.rubber, { roughness: 0.95 }), [0, -0.86, 0]);
    const railL = put(new THREE.BoxGeometry(2.6, 0.14, 0.16), mat, [0, -0.82, 0.62]);
    const railR = put(new THREE.BoxGeometry(2.6, 0.14, 0.16), mat, [0, -0.82, -0.62]);
    const uprightL = put(new THREE.BoxGeometry(0.16, 1.8, 0.16), fixed(PALETTE.dark), [-1.15, 0.0, 0.55], [-0.16, 0, 0]);
    const uprightR = put(new THREE.BoxGeometry(0.16, 1.8, 0.16), fixed(PALETTE.dark), [-1.15, 0.0, -0.55], [0.16, 0, 0]);
    const console_ = put(new THREE.BoxGeometry(0.24, 0.8, 1.5), fixed(PALETTE.dark), [-1.25, 1.05, 0], [0, 0, 0.25]);
    const screen = put(
      new THREE.PlaneGeometry(0.62, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x2f6f8f }),
      [-1.13, 1.05, 0],
      [0, Math.PI / 2, 0.25],
    );
    const handleL = put(
      new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12),
      fixed(PALETTE.rubber, { roughness: 0.85 }),
      [-0.85, 0.62, 0.62],
      [Math.PI / 2.6, 0, 0],
    );
    const handleR = put(
      new THREE.CylinderGeometry(0.06, 0.06, 0.9, 12),
      fixed(PALETTE.rubber, { roughness: 0.85 }),
      [-0.85, 0.62, -0.62],
      [-Math.PI / 2.6, 0, 0],
    );
    const rollerA = put(
      new THREE.CylinderGeometry(0.14, 0.14, 0.9, 16),
      fixed(0x8b929d, { metalness: 0.8 }),
      [1.2, -0.86, 0],
      [Math.PI / 2, 0, 0],
    );
    const rollerB = put(
      new THREE.CylinderGeometry(0.14, 0.14, 0.9, 16),
      fixed(0x8b929d, { metalness: 0.8 }),
      [-1.2, -0.86, 0],
      [Math.PI / 2, 0, 0],
    );
    const floorMat = put(new THREE.BoxGeometry(3.6, 0.08, 1.9), fixed(PALETTE.rubber, { roughness: 0.95 }), [0, -1.15, 0]);
    g.add(deck, belt, railL, railR, uprightL, uprightR, console_, screen, handleL, handleR, rollerA, rollerB, floorMat);
    return { group: g, themed: [deck, railL, railR] };
  },

  /* 宿泊：露天風呂（岩風呂と湯船） */
  "open-air-bath": (mat) => {
    const g = new THREE.Group();
    const deckFloor = put(new THREE.BoxGeometry(5.2, 0.16, 4.2), fixed(PALETTE.woodDark), [0, -1.3, 0]);
    const tub = put(
      lathe([
        [0, -1.1],
        [1.6, -1.1],
        [1.62, 0.1],
        [1.42, 0.12],
        [1.4, -0.95],
        [0, -0.95],
      ]),
      mat,
    );
    const water = put(
      new THREE.CylinderGeometry(1.4, 1.4, 0.06, 40),
      fixed(0x76c6e0, { transparent: true, opacity: 0.75, roughness: 0.15, metalness: 0.1 }),
      [0, -0.06, 0],
    );
    const rocks: THREE.Mesh[] = [];
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const r = 1.9 + (i % 3) * 0.12;
      rocks.push(
        put(
          new THREE.DodecahedronGeometry(0.36 + (i % 4) * 0.07),
          fixed(0x5c6068, { roughness: 0.95 }),
          [Math.cos(a) * r, -0.95 + (i % 2) * 0.12, Math.sin(a) * r],
          [i * 0.7, i * 1.1, i * 0.4],
        ),
      );
    }
    const spoutPost = put(new THREE.CylinderGeometry(0.09, 0.09, 1.3, 12), fixed(0xc7b489), [-1.9, -0.3, -0.6]);
    const spout = put(
      new THREE.CylinderGeometry(0.09, 0.09, 0.9, 12),
      fixed(0xc7b489),
      [-1.55, 0.3, -0.6],
      [0, 0, Math.PI / 2.4],
    );
    const stream = put(
      new THREE.CylinderGeometry(0.05, 0.05, 0.7, 10),
      fixed(0x9fd8ef, { transparent: true, opacity: 0.7 }),
      [-1.2, -0.05, -0.6],
    );
    const fence: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i += 1) {
      fence.push(
        put(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 10), fixed(0xa98f5f), [-2.4 + i * 0.6, -0.5, -2.4]),
      );
    }
    const lantern = put(new THREE.BoxGeometry(0.34, 0.34, 0.34), fixed(0xf6efd8), [2.2, -0.6, -1.4]);
    const bucket = put(new THREE.CylinderGeometry(0.24, 0.2, 0.3, 16), fixed(0xc7b489), [1.9, -1.0, 1.4]);
    g.add(deckFloor, tub, water, spoutPost, spout, stream, lantern, bucket, ...rocks, ...fence);
    return { group: g, themed: [tub] };
  },

  /* 宿泊：フロントカウンター */
  "front-desk": (mat) => {
    const g = new THREE.Group();
    const counter = put(new THREE.BoxGeometry(3.4, 1.2, 0.9), mat, [0, -0.7, 0.4]);
    const top = put(new THREE.BoxGeometry(3.6, 0.12, 1.1), fixed(PALETTE.woodDark), [0, -0.04, 0.4]);
    const front = put(new THREE.BoxGeometry(3.44, 0.9, 0.06), fixed(0xd8cfc0), [0, -0.7, 0.87]);
    const backWall = put(new THREE.BoxGeometry(4.0, 3.0, 0.12), fixed(0x3a4150), [0, 0.3, -1.4]);
    const keyBox = put(new THREE.BoxGeometry(2.0, 1.2, 0.16), mat, [0, 0.55, -1.3]);
    const slots: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        slots.push(
          put(
            new THREE.BoxGeometry(0.3, 0.26, 0.06),
            fixed(0x1b1f28),
            [-0.8 + c * 0.4, 0.15 + r * 0.4, -1.22],
          ),
        );
      }
    }
    const sign = put(new THREE.BoxGeometry(1.5, 0.34, 0.06), fixed(PALETTE.gold), [0, 1.5, -1.3]);
    const bell = put(new THREE.SphereGeometry(0.14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), fixed(PALETTE.gold, { metalness: 0.8, roughness: 0.25 }), [1.2, 0.03, 0.4]);
    const monitor = put(new THREE.BoxGeometry(0.8, 0.5, 0.06), fixed(PALETTE.dark), [-1.0, 0.28, 0.15], [0, 0.3, 0]);
    const screen = put(
      new THREE.PlaneGeometry(0.7, 0.42),
      new THREE.MeshBasicMaterial({ color: 0x2f6f8f }),
      [-1.0, 0.28, 0.19],
      [0, 0.3, 0],
    );
    const plant = put(new THREE.SphereGeometry(0.4, 16, 12), fixed(PALETTE.green), [2.3, -0.4, 0.2]);
    const pot = put(new THREE.CylinderGeometry(0.26, 0.2, 0.5, 16), fixed(0xd8cfc0), [2.3, -0.95, 0.2]);
    const floor = put(new THREE.BoxGeometry(5.6, 0.1, 4.0), fixed(0x4a4038), [0, -1.35, 0.4]);
    g.add(counter, top, front, backWall, keyBox, sign, bell, monitor, screen, plant, pot, floor, ...slots);
    return { group: g, themed: [counter, keyBox] };
  },

  /* 運送：パレット積みの荷物 */
  pallet: (mat) => {
    const g = new THREE.Group();
    const deckBoards: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      deckBoards.push(
        put(new THREE.BoxGeometry(2.4, 0.1, 0.32), fixed(PALETTE.wood), [0, -1.25, -0.9 + i * 0.45]),
      );
    }
    const stringers = [-0.9, 0, 0.9].map((z) =>
      put(new THREE.BoxGeometry(2.4, 0.16, 0.16), fixed(PALETTE.woodDark), [0, -1.4, z]),
    );
    const feet = [-1.0, 0, 1.0].flatMap((x) =>
      [-0.9, 0, 0.9].map((z) => put(new THREE.BoxGeometry(0.3, 0.16, 0.3), fixed(PALETTE.woodDark), [x, -1.56, z])),
    );
    const boxes: THREE.Mesh[] = [];
    const layout: [number, number, number][] = [
      [-0.6, -0.86, -0.5],
      [0.6, -0.86, -0.5],
      [-0.6, -0.86, 0.5],
      [0.6, -0.86, 0.5],
      [-0.6, -0.06, -0.5],
      [0.6, -0.06, -0.5],
      [-0.6, -0.06, 0.5],
      [0.6, -0.06, 0.5],
      [0, 0.74, 0],
    ];
    layout.forEach(([x, y, z], i) => {
      boxes.push(put(new THREE.BoxGeometry(1.1, 0.72, 0.9), mat, [x, y, z], [0, i === 8 ? 0.18 : 0, 0]));
    });
    const tapes = layout.map(([x, y, z], i) =>
      put(new THREE.BoxGeometry(1.12, 0.08, 0.1), fixed(PALETTE.woodDark), [x, y + 0.37, z], [0, i === 8 ? 0.18 : 0, 0]),
    );
    const label = put(new THREE.BoxGeometry(0.4, 0.28, 0.02), fixed(0xf5f1e8), [-0.6, -0.06, 0.96]);
    const wrap = put(
      new THREE.CylinderGeometry(1.15, 1.15, 1.6, 24, 1, true),
      fixed(0xdfeaf2, { transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
      [0, -0.46, 0],
    );
    const floor = put(new THREE.BoxGeometry(4.2, 0.08, 3.2), fixed(0x39404e), [0, -1.68, 0]);
    g.add(label, wrap, floor, ...deckBoards, ...stringers, ...feet, ...boxes, ...tapes);
    return { group: g, themed: boxes };
  },

  /* 運送：フォークリフト */
  forklift: (mat) => {
    const g = new THREE.Group();
    const body = put(new THREE.BoxGeometry(1.9, 0.9, 1.3), mat, [-0.35, -0.55, 0]);
    const hood = put(new THREE.BoxGeometry(0.9, 0.5, 1.2), mat, [-1.0, 0.05, 0]);
    const seat = put(new THREE.BoxGeometry(0.6, 0.14, 0.7), fixed(PALETTE.dark), [-0.35, -0.02, 0]);
    const seatBack = put(new THREE.BoxGeometry(0.14, 0.6, 0.7), fixed(PALETTE.dark), [-0.68, 0.28, 0]);
    const cage = [
      put(new THREE.BoxGeometry(0.1, 1.5, 0.1), fixed(PALETTE.dark), [-1.15, 0.75, 0.6]),
      put(new THREE.BoxGeometry(0.1, 1.5, 0.1), fixed(PALETTE.dark), [-1.15, 0.75, -0.6]),
      put(new THREE.BoxGeometry(0.1, 1.5, 0.1), fixed(PALETTE.dark), [0.1, 0.75, 0.6]),
      put(new THREE.BoxGeometry(0.1, 1.5, 0.1), fixed(PALETTE.dark), [0.1, 0.75, -0.6]),
      put(new THREE.BoxGeometry(1.4, 0.1, 1.4), fixed(PALETTE.dark), [-0.5, 1.5, 0]),
    ];
    const mastL = put(new THREE.BoxGeometry(0.14, 2.6, 0.14), fixed(0x8b929d, { metalness: 0.7 }), [0.75, 0.15, 0.5]);
    const mastR = put(new THREE.BoxGeometry(0.14, 2.6, 0.14), fixed(0x8b929d, { metalness: 0.7 }), [0.75, 0.15, -0.5]);
    const carriage = put(new THREE.BoxGeometry(0.12, 0.7, 1.2), mat, [0.86, -0.55, 0]);
    const forkL = put(new THREE.BoxGeometry(1.2, 0.08, 0.18), fixed(0x8b929d, { metalness: 0.8 }), [1.5, -0.86, 0.34]);
    const forkR = put(new THREE.BoxGeometry(1.2, 0.08, 0.18), fixed(0x8b929d, { metalness: 0.8 }), [1.5, -0.86, -0.34]);
    const load = put(new THREE.BoxGeometry(0.9, 0.7, 0.9), fixed(PALETTE.wood), [1.5, -0.46, 0]);
    const wheels = [
      [-1.0, 0.68],
      [-1.0, -0.68],
      [0.3, 0.6],
      [0.3, -0.6],
    ].map(([x, z], i) =>
      put(
        new THREE.CylinderGeometry(i < 2 ? 0.34 : 0.26, i < 2 ? 0.34 : 0.26, 0.24, 20),
        fixed(PALETTE.rubber, { roughness: 0.95 }),
        [x, i < 2 ? -1.06 : -1.14, z],
        [Math.PI / 2, 0, 0],
      ),
    );
    const floor = put(new THREE.BoxGeometry(5.0, 0.08, 3.0), fixed(0x39404e), [0, -1.42, 0]);
    g.add(body, hood, seat, seatBack, mastL, mastR, carriage, forkL, forkR, load, floor, ...cage, ...wheels);
    return { group: g, themed: [body, hood, carriage] };
  },

  /* 自動車：車体（外装のカラーを見せる） */
  "car-body": (mat) => {
    const g = new THREE.Group();
    const lower = put(new THREE.BoxGeometry(4.2, 0.7, 1.8), mat, [0, -0.7, 0]);
    const hoodF = put(new THREE.BoxGeometry(1.2, 0.34, 1.7), mat, [1.5, -0.22, 0], [0, 0, -0.06]);
    const trunk = put(new THREE.BoxGeometry(1.1, 0.34, 1.7), mat, [-1.55, -0.22, 0], [0, 0, 0.05]);
    const cabin = put(new THREE.BoxGeometry(2.1, 0.72, 1.6), mat, [-0.15, 0.0, 0]);
    const roof = put(new THREE.BoxGeometry(1.9, 0.14, 1.55), mat, [-0.2, 0.38, 0]);
    const windshield = put(
      new THREE.BoxGeometry(0.1, 0.6, 1.5),
      fixed(PALETTE.glass, { metalness: 0.5, roughness: 0.08, transparent: true, opacity: 0.7 }),
      [0.95, 0.05, 0],
      [0, 0, 0.5],
    );
    const rearGlass = put(
      new THREE.BoxGeometry(0.1, 0.6, 1.5),
      fixed(PALETTE.glass, { metalness: 0.5, roughness: 0.08, transparent: true, opacity: 0.7 }),
      [-1.2, 0.05, 0],
      [0, 0, -0.5],
    );
    const sideGlass = [0.78, -0.78].map((z) =>
      put(
        new THREE.BoxGeometry(1.7, 0.5, 0.06),
        fixed(PALETTE.glass, { metalness: 0.5, roughness: 0.08, transparent: true, opacity: 0.7 }),
        [-0.15, 0.08, z],
      ),
    );
    const wheels = [
      [1.3, 0.9],
      [1.3, -0.9],
      [-1.3, 0.9],
      [-1.3, -0.9],
    ].flatMap(([x, z]) => [
      put(
        new THREE.CylinderGeometry(0.46, 0.46, 0.3, 24),
        fixed(PALETTE.rubber, { roughness: 0.95 }),
        [x, -1.02, z],
        [Math.PI / 2, 0, 0],
      ),
      put(
        new THREE.CylinderGeometry(0.26, 0.26, 0.32, 20),
        fixed(0xc3c9d2, { metalness: 0.9, roughness: 0.2 }),
        [x, -1.02, z],
        [Math.PI / 2, 0, 0],
      ),
    ]);
    const lights = [0.72, -0.72].map((z) =>
      put(
        new THREE.BoxGeometry(0.12, 0.2, 0.4),
        new THREE.MeshBasicMaterial({ color: 0xfff3d0 }),
        [2.08, -0.42, z],
      ),
    );
    const tail = [0.72, -0.72].map((z) =>
      put(new THREE.BoxGeometry(0.1, 0.18, 0.36), fixed(PALETTE.red), [-2.08, -0.42, z]),
    );
    const road = put(new THREE.BoxGeometry(6.5, 0.06, 3.4), fixed(0x3a4150), [0, -1.45, 0]);
    g.add(lower, hoodF, trunk, cabin, roof, windshield, rearGlass, road, ...sideGlass, ...wheels, ...lights, ...tail);
    return { group: g, themed: [lower, hoodF, trunk, cabin, roof] };
  },

  /* 自動車：整備リフト（2柱リフトに車を載せた状態） */
  "car-lift": (mat) => {
    const g = new THREE.Group();
    const floor = put(new THREE.BoxGeometry(5.6, 0.12, 4.0), fixed(0x4b5262), [0, -1.75, 0]);
    const postL = put(new THREE.BoxGeometry(0.34, 3.0, 0.34), mat, [0, -0.2, 1.5]);
    const postR = put(new THREE.BoxGeometry(0.34, 3.0, 0.34), mat, [0, -0.2, -1.5]);
    const beam = put(new THREE.BoxGeometry(0.28, 0.28, 3.4), mat, [0, 1.35, 0]);
    const baseL = put(new THREE.BoxGeometry(1.0, 0.16, 0.6), fixed(PALETTE.dark), [0, -1.6, 1.5]);
    const baseR = put(new THREE.BoxGeometry(1.0, 0.16, 0.6), fixed(PALETTE.dark), [0, -1.6, -1.5]);
    const arms = [
      [1.5, 1.1],
      [1.5, -1.1],
      [-1.5, 1.1],
      [-1.5, -1.1],
    ].map(([x, z]) => put(new THREE.BoxGeometry(1.7, 0.16, 0.22), mat, [x * 0.62, -0.3, z]));
    const padsPos: [number, number][] = [
      [1.35, 1.1],
      [1.35, -1.1],
      [-1.35, 1.1],
      [-1.35, -1.1],
    ];
    const pads = padsPos.map(([x, z]) =>
      put(new THREE.CylinderGeometry(0.16, 0.16, 0.16, 16), fixed(PALETTE.rubber, { roughness: 0.9 }), [x, -0.14, z]),
    );
    // リフトに載っている車（下回りを見せるため、簡略化した車体）
    const carBody = put(new THREE.BoxGeometry(3.6, 0.6, 1.7), fixed(0x9aa4b4, { metalness: 0.5, roughness: 0.4 }), [0, 0.3, 0]);
    const carCabin = put(new THREE.BoxGeometry(1.8, 0.5, 1.5), fixed(0x9aa4b4, { metalness: 0.5, roughness: 0.4 }), [-0.2, 0.82, 0]);
    const carWheels = [
      [1.15, 0.88],
      [1.15, -0.88],
      [-1.15, 0.88],
      [-1.15, -0.88],
    ].map(([x, z]) =>
      put(
        new THREE.CylinderGeometry(0.38, 0.38, 0.24, 20),
        fixed(PALETTE.rubber, { roughness: 0.95 }),
        [x, 0.28, z],
        [Math.PI / 2, 0, 0],
      ),
    );
    const exhaust = put(
      new THREE.CylinderGeometry(0.08, 0.08, 2.6, 12),
      fixed(0x8b929d, { metalness: 0.85, roughness: 0.3 }),
      [-0.2, -0.05, 0.3],
      [0, 0, Math.PI / 2],
    );
    const toolbox = put(new THREE.BoxGeometry(0.8, 0.9, 0.5), fixed(PALETTE.red), [2.3, -1.24, -1.3]);
    g.add(floor, postL, postR, beam, baseL, baseR, carBody, carCabin, exhaust, toolbox, ...arms, ...pads, ...carWheels);
    return { group: g, themed: [postL, postR, beam, ...arms] };
  },

  /* 農業：ビニールハウス */
  greenhouse: (mat) => {
    const g = new THREE.Group();
    const ground = put(new THREE.BoxGeometry(5.0, 0.14, 3.6), fixed(0x6b5a44), [0, -1.4, 0]);
    const cover = put(
      new THREE.CylinderGeometry(1.6, 1.6, 4.0, 28, 1, true, 0, Math.PI),
      fixed(0xdfeaf2, { transparent: true, opacity: 0.24, side: THREE.DoubleSide, roughness: 0.2 }),
      [0, -1.3, 0],
      [0, 0, Math.PI / 2],
    );
    const hoops: THREE.Mesh[] = [];
    for (let i = 0; i < 5; i += 1) {
      hoops.push(
        put(
          new THREE.TorusGeometry(1.6, 0.05, 10, 32, Math.PI),
          mat,
          [-1.8 + i * 0.9, -1.3, 0],
          [0, Math.PI / 2, 0],
        ),
      );
    }
    const ridge = put(new THREE.CylinderGeometry(0.05, 0.05, 4.0, 10), mat, [0, 0.3, 0], [0, 0, Math.PI / 2]);
    const sideBar = [1.55, -1.55].map((z) =>
      put(new THREE.CylinderGeometry(0.045, 0.045, 4.0, 10), mat, [0, -0.9, z], [0, 0, Math.PI / 2]),
    );
    const doorFrame = put(new THREE.TorusGeometry(1.6, 0.06, 10, 32, Math.PI), mat, [2.1, -1.3, 0], [0, Math.PI / 2, 0]);
    // 畝と作物
    const rows: THREE.Mesh[] = [];
    [-0.85, 0.0, 0.85].forEach((z, r) => {
      rows.push(put(new THREE.BoxGeometry(3.6, 0.2, 0.5), fixed(0x5b4a36), [-0.2, -1.22, z]));
      for (let i = 0; i < 5; i += 1) {
        rows.push(
          put(
            new THREE.SphereGeometry(0.22, 14, 10),
            fixed(PALETTE.green, { roughness: 0.75 }),
            [-1.7 + i * 0.8, -0.96, z],
          ),
        );
        if ((i + r) % 2 === 0) {
          rows.push(
            put(
              new THREE.SphereGeometry(0.09, 10, 8),
              fixed(PALETTE.red, { roughness: 0.6 }),
              [-1.7 + i * 0.8 + 0.16, -0.86, z + 0.12],
            ),
          );
        }
      }
    });
    g.add(cover, ridge, doorFrame, ground, ...hoops, ...sideBar, ...rows);
    return { group: g, themed: [...hoops, ridge, ...sideBar, doorFrame] };
  },

  /* 農業：トラクター */
  tractor: (mat) => {
    const g = new THREE.Group();
    const body = put(new THREE.BoxGeometry(2.2, 0.8, 1.1), mat, [-0.1, -0.5, 0]);
    const nose = put(new THREE.BoxGeometry(1.3, 0.6, 0.9), mat, [1.35, -0.55, 0]);
    const cabin = [
      put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [-0.9, 0.5, 0.5]),
      put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [-0.9, 0.5, -0.5]),
      put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [0.35, 0.5, 0.5]),
      put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [0.35, 0.5, -0.5]),
      put(new THREE.BoxGeometry(1.5, 0.1, 1.2), mat, [-0.28, 1.1, 0]),
    ];
    const seat = put(new THREE.BoxGeometry(0.5, 0.12, 0.6), fixed(PALETTE.dark), [-0.5, -0.02, 0]);
    const seatBack = put(new THREE.BoxGeometry(0.12, 0.5, 0.6), fixed(PALETTE.dark), [-0.78, 0.22, 0]);
    const wheelBack = [0.62, -0.62].flatMap((z) => [
      put(
        new THREE.CylinderGeometry(0.85, 0.85, 0.34, 24),
        fixed(PALETTE.rubber, { roughness: 0.95 }),
        [-0.7, -0.65, z],
        [Math.PI / 2, 0, 0],
      ),
      put(
        new THREE.CylinderGeometry(0.34, 0.34, 0.36, 18),
        mat,
        [-0.7, -0.65, z],
        [Math.PI / 2, 0, 0],
      ),
    ]);
    const wheelFront = [0.5, -0.5].flatMap((z) => [
      put(
        new THREE.CylinderGeometry(0.44, 0.44, 0.24, 20),
        fixed(PALETTE.rubber, { roughness: 0.95 }),
        [1.5, -1.06, z],
        [Math.PI / 2, 0, 0],
      ),
      put(
        new THREE.CylinderGeometry(0.18, 0.18, 0.26, 14),
        mat,
        [1.5, -1.06, z],
        [Math.PI / 2, 0, 0],
      ),
    ]);
    const exhaust = put(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 12), fixed(PALETTE.dark), [0.85, 0.1, 0.35]);
    const light = put(
      new THREE.BoxGeometry(0.1, 0.16, 0.3),
      new THREE.MeshBasicMaterial({ color: 0xfff3d0 }),
      [2.0, -0.35, 0.3],
    );
    const field = put(new THREE.BoxGeometry(6.0, 0.1, 3.4), fixed(0x6b5a44), [0, -1.55, 0]);
    g.add(body, nose, seat, seatBack, exhaust, light, field, ...cabin, ...wheelBack, ...wheelFront);
    return { group: g, themed: [body, nose] };
  },

  /* ブライダル：円卓のセッティング */
  "banquet-table": (mat) => {
    const g = new THREE.Group();
    const top = put(new THREE.CylinderGeometry(1.9, 1.9, 0.1, 48), mat, [0, -0.3, 0]);
    const cloth = put(
      new THREE.CylinderGeometry(1.92, 2.05, 1.1, 48, 1, true),
      mat,
      [0, -0.88, 0],
    );
    const leg = put(new THREE.CylinderGeometry(0.16, 0.5, 1.2, 20), fixed(PALETTE.dark), [0, -1.0, 0]);
    const settings: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      const x = Math.cos(a) * 1.32;
      const z = Math.sin(a) * 1.32;
      settings.push(put(new THREE.CylinderGeometry(0.32, 0.3, 0.04, 28), fixed(0xf7f3ee), [x, -0.23, z]));
      settings.push(put(new THREE.CylinderGeometry(0.18, 0.16, 0.05, 24), fixed(PALETTE.gold), [x, -0.19, z]));
      // グラス
      settings.push(
        put(
          lathe([
            [0, 0],
            [0.11, 0.01],
            [0.03, 0.06],
            [0.03, 0.2],
            [0.11, 0.34],
            [0.09, 0.34],
            [0.02, 0.2],
            [0.02, 0.05],
            [0, 0.04],
          ]),
          fixed(0xdfeaf2, { transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.1 }),
          [x * 1.18, -0.25, z * 1.18],
        ),
      );
      // ナプキン
      settings.push(
        put(
          new THREE.ConeGeometry(0.1, 0.28, 10),
          fixed(0xf2c9d6),
          [x * 0.82, -0.11, z * 0.82],
        ),
      );
    }
    const centerBowl = put(new THREE.CylinderGeometry(0.3, 0.22, 0.26, 20), fixed(PALETTE.gold), [0, -0.12, 0]);
    const flowers: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i += 1) {
      const a = (i / 9) * Math.PI * 2;
      flowers.push(
        put(
          new THREE.SphereGeometry(0.14, 14, 10),
          fixed([0xf2c9d6, 0xffffff, 0xf6e6b8, PALETTE.green][i % 4], { roughness: 0.7 }),
          [Math.cos(a) * 0.24, 0.05 + (i % 3) * 0.06, Math.sin(a) * 0.24],
        ),
      );
    }
    const candle = put(new THREE.CylinderGeometry(0.06, 0.06, 0.34, 12), fixed(0xf7f3ee), [0.55, -0.11, 0.4]);
    const flame = put(new THREE.SphereGeometry(0.05, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a }), [0.55, 0.1, 0.4]);
    const floor = put(new THREE.BoxGeometry(5.4, 0.08, 5.4), fixed(0x4a4038), [0, -1.62, 0]);
    g.add(top, cloth, leg, centerBowl, candle, flame, floor, ...settings, ...flowers);
    return { group: g, themed: [top, cloth] };
  },

  /* ブライダル：ウェディングケーキ */
  cake: (mat) => {
    const g = new THREE.Group();
    const stand = put(new THREE.CylinderGeometry(1.5, 1.6, 0.12, 40), fixed(PALETTE.gold, { metalness: 0.7, roughness: 0.3 }), [0, -1.35, 0]);
    const standLeg = put(new THREE.CylinderGeometry(0.24, 0.5, 0.4, 24), fixed(PALETTE.gold, { metalness: 0.7, roughness: 0.3 }), [0, -1.6, 0]);
    const tier1 = put(new THREE.CylinderGeometry(1.25, 1.3, 0.8, 44), mat, [0, -0.88, 0]);
    const tier2 = put(new THREE.CylinderGeometry(0.9, 0.95, 0.72, 40), mat, [0, -0.1, 0]);
    const tier3 = put(new THREE.CylinderGeometry(0.58, 0.62, 0.62, 36), mat, [0, 0.58, 0]);
    const rims = [
      put(new THREE.TorusGeometry(1.28, 0.06, 12, 44), fixed(0xf7f3ee), [0, -1.26, 0], [Math.PI / 2, 0, 0]),
      put(new THREE.TorusGeometry(0.93, 0.055, 12, 40), fixed(0xf7f3ee), [0, -0.45, 0], [Math.PI / 2, 0, 0]),
      put(new THREE.TorusGeometry(0.6, 0.05, 12, 36), fixed(0xf7f3ee), [0, 0.28, 0], [Math.PI / 2, 0, 0]),
    ];
    const berries: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2;
      berries.push(
        put(new THREE.SphereGeometry(0.11, 12, 9), fixed(PALETTE.red, { roughness: 0.5 }), [
          Math.cos(a) * 1.12,
          -0.46,
          Math.sin(a) * 1.12,
        ]),
      );
    }
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 + 0.3;
      berries.push(
        put(new THREE.SphereGeometry(0.1, 12, 9), fixed(0xf2c9d6, { roughness: 0.6 }), [
          Math.cos(a) * 0.8,
          0.28,
          Math.sin(a) * 0.8,
        ]),
      );
    }
    const topFlowers: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2;
      topFlowers.push(
        put(
          new THREE.SphereGeometry(0.13, 12, 9),
          fixed([0xf2c9d6, 0xffffff, PALETTE.green][i % 3], { roughness: 0.7 }),
          [Math.cos(a) * 0.24, 0.95 + (i % 2) * 0.07, Math.sin(a) * 0.24],
        ),
      );
    }
    const topper = put(new THREE.TorusGeometry(0.18, 0.035, 10, 26), fixed(PALETTE.gold, { metalness: 0.8, roughness: 0.25 }), [0, 1.25, 0], [0.35, 0, 0]);
    const knife = put(
      new THREE.BoxGeometry(1.1, 0.02, 0.09),
      fixed(0xdfe6ee, { metalness: 0.9, roughness: 0.15 }),
      [1.7, -1.24, 0.5],
      [0, 0.4, 0],
    );
    const table = put(new THREE.BoxGeometry(4.4, 0.1, 3.0), fixed(0xf7f3ee), [0, -1.72, 0]);
    g.add(stand, standLeg, tier1, tier2, tier3, topper, knife, table, ...rims, ...berries, ...topFlowers);
    return { group: g, themed: [tier1, tier2, tier3] };
  },

  /* 介護：車いす */
  wheelchair: (mat) => {
    const g = new THREE.Group();
    const seat = put(new THREE.BoxGeometry(1.1, 0.14, 1.0), mat, [0, -0.35, 0]);
    const back = put(new THREE.BoxGeometry(1.1, 1.1, 0.12), mat, [0, 0.22, -0.5], [0.12, 0, 0]);
    const frame = [
      put(new THREE.BoxGeometry(0.08, 0.9, 0.08), fixed(PALETTE.dark), [-0.52, -0.8, 0.42]),
      put(new THREE.BoxGeometry(0.08, 0.9, 0.08), fixed(PALETTE.dark), [0.52, -0.8, 0.42]),
      put(new THREE.BoxGeometry(0.08, 1.7, 0.08), fixed(PALETTE.dark), [-0.52, 0.1, -0.52], [0.12, 0, 0]),
      put(new THREE.BoxGeometry(0.08, 1.7, 0.08), fixed(PALETTE.dark), [0.52, 0.1, -0.52], [0.12, 0, 0]),
      put(new THREE.BoxGeometry(1.1, 0.08, 0.08), fixed(PALETTE.dark), [0, -0.44, 0.42]),
    ];
    const arms = [-0.62, 0.62].flatMap((x) => [
      put(new THREE.BoxGeometry(0.12, 0.1, 0.85), fixed(PALETTE.rubber, { roughness: 0.85 }), [x, 0.05, -0.05]),
      put(new THREE.BoxGeometry(0.08, 0.45, 0.08), fixed(PALETTE.dark), [x, -0.18, 0.3]),
    ]);
    const grips = [-0.52, 0.52].map((x) =>
      put(
        new THREE.CylinderGeometry(0.06, 0.06, 0.24, 12),
        fixed(PALETTE.rubber, { roughness: 0.9 }),
        [x, 0.92, -0.75],
        [Math.PI / 2.2, 0, 0],
      ),
    );
    const bigWheels = [-0.72, 0.72].flatMap((z) => [
      put(
        new THREE.TorusGeometry(0.72, 0.06, 14, 40),
        fixed(PALETTE.rubber, { roughness: 0.9 }),
        [0, -0.5, z * 0.95],
        [0, Math.PI / 2, 0],
      ),
      put(
        new THREE.TorusGeometry(0.58, 0.035, 12, 36),
        fixed(0xb8bec9, { metalness: 0.85, roughness: 0.25 }),
        [0, -0.5, z * 1.06],
        [0, Math.PI / 2, 0],
      ),
      put(
        new THREE.CylinderGeometry(0.1, 0.1, 0.14, 14),
        fixed(0x8b929d, { metalness: 0.8 }),
        [0, -0.5, z * 0.95],
        [Math.PI / 2, 0, 0],
      ),
    ]);
    const spokes: THREE.Mesh[] = [];
    [-0.68, 0.68].forEach((z) => {
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI;
        spokes.push(
          put(
            new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6),
            fixed(0xb8bec9, { metalness: 0.8 }),
            [0, -0.5, z],
            [0, 0, a],
          ),
        );
      }
    });
    const casters = [-0.5, 0.5].flatMap((z) => [
      put(
        new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16),
        fixed(PALETTE.rubber, { roughness: 0.9 }),
        [0.95, -1.06, z],
        [Math.PI / 2, 0, 0],
      ),
      put(new THREE.BoxGeometry(0.07, 0.4, 0.07), fixed(PALETTE.dark), [0.95, -0.86, z]),
    ]);
    const footplate = put(new THREE.BoxGeometry(0.5, 0.06, 0.85), fixed(PALETTE.dark), [0.9, -1.05, 0], [0, 0, -0.1]);
    const floor = put(new THREE.BoxGeometry(4.0, 0.08, 3.2), fixed(0x39404e), [0, -1.28, 0]);
    g.add(seat, back, footplate, floor, ...frame, ...arms, ...grips, ...bigWheels, ...spokes, ...casters);
    return { group: g, themed: [seat, back] };
  },

  /* 介護：手すり付き浴槽（入浴設備） */
  "care-bath": (mat) => {
    const g = new THREE.Group();
    const tub = put(
      lathe(
        [
          [0, -0.9],
          [1.15, -0.9],
          [1.18, 0.35],
          [1.0, 0.36],
          [0.98, -0.76],
          [0, -0.76],
        ],
        40,
      ),
      mat,
    );
    const water = put(
      new THREE.CylinderGeometry(0.98, 0.98, 0.05, 40),
      fixed(0x76c6e0, { transparent: true, opacity: 0.7, roughness: 0.12 }),
      [0, 0.1, 0],
    );
    const step = put(new THREE.BoxGeometry(1.5, 0.34, 0.7), fixed(0xd9dee6, { roughness: 0.6 }), [0, -1.05, 1.5]);
    const rail1 = put(
      new THREE.TorusGeometry(0.42, 0.06, 12, 28, Math.PI),
      fixed(0xb8bec9, { metalness: 0.85, roughness: 0.2 }),
      [-1.25, 0.55, 0],
      [Math.PI / 2, 0, 0],
    );
    const rail2 = put(
      new THREE.CylinderGeometry(0.06, 0.06, 1.6, 14),
      fixed(0xb8bec9, { metalness: 0.85, roughness: 0.2 }),
      [1.35, 0.7, 0],
      [Math.PI / 2, 0, 0],
    );
    const railPosts = [-0.7, 0.7].map((z) =>
      put(
        new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12),
        fixed(0xb8bec9, { metalness: 0.85, roughness: 0.2 }),
        [1.35, 0.36, z],
      ),
    );
    const chair = put(new THREE.BoxGeometry(0.7, 0.1, 0.6), fixed(0xd9dee6), [1.9, -0.5, -1.2]);
    const chairLegs = [-0.24, 0.24].flatMap((x) =>
      [-0.2, 0.2].map((z) =>
        put(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), fixed(0xb8bec9, { metalness: 0.7 }), [1.9 + x, -0.85, -1.2 + z]),
      ),
    );
    const shower = put(
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 12),
      fixed(0xb8bec9, { metalness: 0.85, roughness: 0.2 }),
      [-1.9, 0.5, -1.5],
    );
    const head = put(
      new THREE.CylinderGeometry(0.16, 0.12, 0.16, 18),
      fixed(0xdfe6ee, { metalness: 0.8, roughness: 0.25 }),
      [-1.9, 1.34, -1.5],
    );
    const wall = put(new THREE.BoxGeometry(5.0, 3.0, 0.12), fixed(0xe3e8ee, { roughness: 0.6 }), [0, 0.2, -2.1]);
    const floor = put(new THREE.BoxGeometry(5.0, 0.1, 4.2), fixed(0xc7ced8, { roughness: 0.7 }), [0, -1.28, 0]);
    g.add(tub, water, step, rail1, rail2, chair, shower, head, wall, floor, ...railPosts, ...chairLegs);
    return { group: g, themed: [tub, step] };
  },

  /* IT・SaaS：作業デスク（開発環境） */
  workstation: (mat) => {
    const g = new THREE.Group();
    const top = put(new THREE.BoxGeometry(3.2, 0.1, 1.4), mat, [0, -0.3, 0]);
    const legs = [-1.45, 1.45].flatMap((x) =>
      [-0.55, 0.55].map((z) => put(new THREE.BoxGeometry(0.1, 1.2, 0.1), fixed(PALETTE.dark), [x, -0.95, z])),
    );
    const monitorA = put(new THREE.BoxGeometry(1.5, 0.9, 0.07), fixed(PALETTE.dark), [-0.45, 0.42, -0.35], [0, 0.22, 0]);
    const screenA = put(
      new THREE.PlaneGeometry(1.38, 0.8),
      new THREE.MeshBasicMaterial({ color: 0x1e4f6b }),
      [-0.45, 0.42, -0.31],
      [0, 0.22, 0],
    );
    const monitorB = put(new THREE.BoxGeometry(1.2, 0.8, 0.07), fixed(PALETTE.dark), [1.05, 0.36, -0.4], [0, -0.35, 0]);
    const screenB = put(
      new THREE.PlaneGeometry(1.1, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x1b3b52 }),
      [1.05, 0.36, -0.36],
      [0, -0.35, 0],
    );
    // 画面の中のコード行
    const lines: THREE.Mesh[] = [];
    for (let i = 0; i < 7; i += 1) {
      lines.push(
        put(
          new THREE.PlaneGeometry(0.3 + ((i * 5) % 8) * 0.09, 0.045),
          new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x6ee7a8 : 0x9fd8ef }),
          [-0.95 + ((i * 5) % 8) * 0.045, 0.72 - i * 0.1, -0.29],
          [0, 0.22, 0],
        ),
      );
    }
    const stands = [
      put(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10), fixed(PALETTE.dark), [-0.45, -0.02, -0.35]),
      put(new THREE.BoxGeometry(0.5, 0.05, 0.3), fixed(PALETTE.dark), [-0.45, -0.23, -0.35]),
      put(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 10), fixed(PALETTE.dark), [1.05, -0.04, -0.4]),
      put(new THREE.BoxGeometry(0.45, 0.05, 0.28), fixed(PALETTE.dark), [1.05, -0.23, -0.4]),
    ];
    const keyboard = put(new THREE.BoxGeometry(1.2, 0.06, 0.42), fixed(0x39404e), [-0.35, -0.22, 0.3]);
    const mouse = put(new THREE.SphereGeometry(0.12, 14, 10), fixed(0x39404e), [0.55, -0.21, 0.32]);
    const tower = put(new THREE.BoxGeometry(0.55, 1.1, 1.0), fixed(PALETTE.dark), [-1.9, -0.85, -0.2]);
    const towerLeds = [0, 1, 2].map((i) =>
      put(
        new THREE.SphereGeometry(0.04, 8, 6),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
        [-1.62, -0.5 + i * 0.14, -0.2],
      ),
    );
    const mug = put(new THREE.CylinderGeometry(0.14, 0.12, 0.3, 16), fixed(PALETTE.light), [1.35, -0.1, 0.4]);
    const chairSeat = put(new THREE.BoxGeometry(0.85, 0.12, 0.85), fixed(PALETTE.fabric), [0, -0.8, 1.6]);
    const chairBack = put(new THREE.BoxGeometry(0.85, 0.9, 0.12), fixed(PALETTE.fabric), [0, -0.3, 2.0], [-0.12, 0, 0]);
    g.add(
      top,
      monitorA,
      screenA,
      monitorB,
      screenB,
      keyboard,
      mouse,
      tower,
      mug,
      chairSeat,
      chairBack,
      ...legs,
      ...stands,
      ...lines,
      ...towerLeds,
    );
    return { group: g, themed: [top] };
  },

  /* IT・SaaS：モニタウォール（ダッシュボードの壁） */
  "monitor-wall": (mat) => {
    const g = new THREE.Group();
    const wall = put(new THREE.BoxGeometry(4.6, 3.0, 0.16), fixed(0x2a3140), [0, 0.15, -0.2]);
    const bezels: THREE.Mesh[] = [];
    const screens: THREE.Mesh[] = [];
    const widgets: THREE.Mesh[] = [];
    const cells: [number, number, number, number][] = [
      [-1.4, 0.85, 1.9, 1.1],
      [0.75, 0.85, 2.0, 1.1],
      [-1.75, -0.5, 1.2, 1.1],
      [-0.2, -0.5, 1.5, 1.1],
      [1.45, -0.5, 1.5, 1.1],
    ];
    cells.forEach(([x, y, w, h], i) => {
      bezels.push(put(new THREE.BoxGeometry(w, h, 0.08), mat, [x, y, -0.1]));
      screens.push(
        put(
          new THREE.PlaneGeometry(w - 0.12, h - 0.12),
          new THREE.MeshBasicMaterial({ color: i % 2 ? 0x14364a : 0x123043 }),
          [x, y, -0.05],
        ),
      );
      // 中身（棒グラフ・折れ線・数値のブロック）
      if (i % 2 === 0) {
        for (let b = 0; b < 5; b += 1) {
          const bh = 0.15 + ((b * 3 + i) % 4) * 0.14;
          widgets.push(
            put(
              new THREE.PlaneGeometry(0.12, bh),
              new THREE.MeshBasicMaterial({ color: b % 2 ? 0x38bdf8 : 0x6ee7a8 }),
              [x - (w - 0.5) / 2 + b * 0.19, y - h / 2 + 0.12 + bh / 2, -0.04],
            ),
          );
        }
      } else {
        for (let s = 0; s < 6; s += 1) {
          widgets.push(
            put(
              new THREE.PlaneGeometry(0.22, 0.045),
              new THREE.MeshBasicMaterial({ color: s % 3 === 0 ? 0xffd27a : 0x9fd8ef }),
              [x - (w - 0.6) / 2 + s * 0.24, y - 0.1 + Math.sin(s * 1.2) * 0.22, -0.04],
              [0, 0, Math.sin(s * 1.2) * 0.5],
            ),
          );
        }
      }
    });
    const console_ = put(new THREE.BoxGeometry(3.0, 0.12, 0.9), mat, [0, -1.35, 0.9]);
    const consoleLegs = [-1.2, 1.2].map((x) =>
      put(new THREE.BoxGeometry(0.12, 0.6, 0.7), fixed(PALETTE.dark), [x, -1.7, 0.9]),
    );
    const keyboards = [-0.8, 0.8].map((x) =>
      put(new THREE.BoxGeometry(0.9, 0.05, 0.34), fixed(PALETTE.dark), [x, -1.26, 1.0]),
    );
    const floor = put(new THREE.BoxGeometry(5.4, 0.08, 3.2), fixed(0x323a49), [0, -2.02, 0.6]);
    g.add(wall, console_, floor, ...bezels, ...screens, ...widgets, ...consoleLegs, ...keyboards);
    g.position.y = 0.25;
    return { group: g, themed: [...bezels, console_] };
  },

  /* アパレル：スニーカー */
  sneaker: (mat) => {
    const g = new THREE.Group();
    const outsole = put(new THREE.BoxGeometry(2.6, 0.22, 1.0), fixed(PALETTE.rubber, { roughness: 0.9 }), [0, -1.0, 0]);
    const outsoleToe = put(
      new THREE.CylinderGeometry(0.5, 0.5, 1.0, 24, 1, false, 0, Math.PI),
      fixed(PALETTE.rubber, { roughness: 0.9 }),
      [1.3, -1.0, 0],
      [Math.PI / 2, 0, -Math.PI / 2],
    );
    const midsole = put(new THREE.BoxGeometry(2.62, 0.34, 1.02), fixed(0xf1f4f8, { roughness: 0.6 }), [0, -0.72, 0]);
    const midToe = put(
      new THREE.CylinderGeometry(0.51, 0.51, 1.02, 24, 1, false, 0, Math.PI),
      fixed(0xf1f4f8, { roughness: 0.6 }),
      [1.3, -0.72, 0],
      [Math.PI / 2, 0, -Math.PI / 2],
    );
    const upper = put(new THREE.SphereGeometry(0.66, 26, 18), mat, [0.35, -0.45, 0]);
    upper.scale.set(1.85, 0.85, 0.78);
    const heel = put(new THREE.SphereGeometry(0.55, 22, 16), mat, [-1.0, -0.3, 0]);
    heel.scale.set(0.9, 1.05, 0.78);
    const collar = put(
      new THREE.TorusGeometry(0.36, 0.11, 14, 30),
      fixed(PALETTE.dark, { roughness: 0.8 }),
      [-0.55, 0.1, 0],
      [Math.PI / 2, 0, 0.12],
    );
    const tongue = put(new THREE.BoxGeometry(0.7, 0.14, 0.5), fixed(PALETTE.dark, { roughness: 0.8 }), [0.05, 0.06, 0], [0, 0, -0.2]);
    const laces: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i += 1) {
      laces.push(
        put(
          new THREE.CylinderGeometry(0.035, 0.035, 0.62, 8),
          fixed(0xf5f1e8),
          [0.55 - i * 0.28, -0.05 + i * 0.04, 0],
          [Math.PI / 2, 0, i % 2 ? 0.3 : -0.3],
        ),
      );
    }
    const swoosh = put(
      new THREE.BoxGeometry(1.3, 0.14, 0.04),
      fixed(PALETTE.dark, { roughness: 0.7 }),
      [0.35, -0.5, 0.42],
      [0, 0, -0.12],
    );
    const heelTab = put(new THREE.BoxGeometry(0.3, 0.3, 0.04), fixed(PALETTE.dark), [-1.5, -0.15, 0]);
    const floor = put(new THREE.BoxGeometry(4.0, 0.08, 2.4), fixed(0x39404e), [0, -1.16, 0]);
    g.add(
      outsole,
      outsoleToe,
      midsole,
      midToe,
      upper,
      heel,
      collar,
      tongue,
      swoosh,
      heelTab,
      floor,
      ...laces,
    );
    return { group: g, themed: [upper, heel] };
  },

  /* アパレル：ハンドバッグ */
  handbag: (mat) => {
    const g = new THREE.Group();
    const body = put(new THREE.BoxGeometry(2.2, 1.5, 0.9), mat, [0, -0.35, 0]);
    const bodyTop = put(
      new THREE.CylinderGeometry(0.45, 0.45, 2.2, 24, 1, false, 0, Math.PI),
      mat,
      [0, 0.4, 0],
      [0, 0, Math.PI / 2],
    );
    const flap = put(new THREE.BoxGeometry(2.24, 0.7, 0.06), mat, [0, 0.1, 0.47]);
    const flapEdge = put(new THREE.BoxGeometry(2.24, 0.08, 0.1), fixed(PALETTE.gold, { metalness: 0.7, roughness: 0.3 }), [0, -0.26, 0.48]);
    const clasp = put(
      new THREE.CylinderGeometry(0.16, 0.16, 0.1, 20),
      fixed(PALETTE.gold, { metalness: 0.85, roughness: 0.22 }),
      [0, -0.1, 0.52],
      [Math.PI / 2, 0, 0],
    );
    const handle = put(
      new THREE.TorusGeometry(0.55, 0.07, 16, 40, Math.PI),
      mat,
      [0, 0.85, 0],
      [0, 0, 0],
    );
    const rings = [-0.55, 0.55].map((x) =>
      put(
        new THREE.TorusGeometry(0.11, 0.035, 10, 20),
        fixed(PALETTE.gold, { metalness: 0.85, roughness: 0.22 }),
        [x, 0.82, 0],
        [0, Math.PI / 2, 0],
      ),
    );
    const stitches: THREE.Mesh[] = [];
    for (let i = 0; i < 12; i += 1) {
      stitches.push(
        put(
          new THREE.BoxGeometry(0.1, 0.03, 0.02),
          fixed(0xf5f1e8),
          [-1.0 + i * 0.18, -1.02, 0.46],
        ),
      );
    }
    const feet = [-0.85, 0.85].flatMap((x) =>
      [-0.35, 0.35].map((z) =>
        put(
          new THREE.SphereGeometry(0.07, 12, 8),
          fixed(PALETTE.gold, { metalness: 0.85, roughness: 0.25 }),
          [x, -1.12, z],
        ),
      ),
    );
    const stand = put(new THREE.BoxGeometry(3.0, 0.1, 1.8), fixed(PALETTE.woodDark), [0, -1.22, 0]);
    g.add(body, bodyTop, flap, flapEdge, clasp, handle, stand, ...rings, ...stitches, ...feet);
    return { group: g, themed: [body, bodyTop, flap, handle] };
  },
};

/* ------------------------------------------------------------------
 * 組み立て
 * ---------------------------------------------------------------- */

/** 三角形の数を数える（デモの性能表示に使う） */
function countTriangles(group: THREE.Group): number {
  let n = 0;
  group.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry;
    const idx = geo.getIndex();
    n += idx ? idx.count / 3 : geo.getAttribute("position").count / 3;
  });
  return Math.round(n);
}

/**
 * 職種別モデルを組み立てる。
 * @param key   職種のモデル種別
 * @param themedMaterial 素材・カラー切り替えの対象になる素材（デモ側が差し替える）
 */
export function createIndustryModel(
  key: IndustryModelKey,
  themedMaterial: THREE.Material,
): IndustryModel {
  const { group, themed } = BUILDERS[key](themedMaterial);
  group.scale.setScalar(0.95);

  return {
    group,
    themed,
    triangles: countTriangles(group),
    dispose: () => {
      group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        // 切り替え対象の素材はデモ側が管理しているので、ここでは破棄しない
        if (!themed.includes(mesh)) {
          const m = mesh.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else m.dispose();
        }
      });
    },
  };
}
