/**
 * キャラクター「CHROMA」の顔を、SVG1枚に落とし込んだもの。
 *
 * 3Dモデル（Mascot3d.tsx）と同じ構成——クロームの多面体・暗いバイザー・
 * 紫に光る横一文字の目・斜めの光輪——を、正面固定のシルエットで描いています。
 *
 * ここで3Dを使わない理由：
 *   - チャット内では発言のたびに小さなアイコンが並ぶ。WebGLキャンバスを何枚も
 *     持つと、それだけでGPUのコンテキスト上限（ブラウザによっては8〜16枚）に達する
 *   - 16px 前後まで縮むため、金属反射は情報として見えない
 *   - 起動役のフォールバックにもそのまま使える（WebGL が無い環境でも顔が出る）
 */
export function MascotFace({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`mascot ${className}`} aria-hidden="true" focusable="false">
      <defs>
        {/* クロームの面。左上から光が当たり、右下へ落ちる */}
        <linearGradient id="chroma-body" x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.34" stopColor="#c9c2dd" />
          <stop offset="0.58" stopColor="#4b4459" />
          <stop offset="0.8" stopColor="#e5d6ff" />
          <stop offset="1" stopColor="#2a2436" />
        </linearGradient>
        {/* 目のにじみ */}
        <radialGradient id="chroma-glow">
          <stop offset="0" stopColor="#d9b8ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#b67eff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 光輪（本体の後ろ側） */}
      <ellipse
        cx="24"
        cy="24"
        rx="22"
        ry="8"
        fill="none"
        stroke="#b67eff"
        strokeWidth="1.4"
        opacity="0.75"
        transform="rotate(-18 24 24)"
      />

      {/* 本体：多面体のシルエット（3Dモデルの正二十面体を正面から見た輪郭） */}
      <polygon
        points="24,4 36,11 40,24 33,37 24,42 15,37 8,24 12,11"
        fill="url(#chroma-body)"
        stroke="#f4effa"
        strokeOpacity="0.35"
        strokeWidth="0.7"
      />
      {/* 稜線（面の分割線。金属の折れを示す最小限だけ） */}
      <g stroke="#0b0711" strokeOpacity="0.28" strokeWidth="0.6" fill="none">
        <path d="M24 4 24 42M8 24 40 24M12 11 33 37M36 11 15 37" />
      </g>

      {/* 顔：暗いバイザー */}
      <circle cx="24" cy="24" r="11" fill="#0b0711" />
      {/* 目：紫の横一文字（まばたきはCSS側で scaleY させる） */}
      <ellipse cx="24" cy="24" rx="9.5" ry="4.5" fill="url(#chroma-glow)" />
      <g className="mascot-eyes">
        <rect x="16.5" y="22.6" width="15" height="2.8" rx="1.4" fill="#b67eff" />
        <rect x="18.5" y="23" width="4" height="1.4" rx="0.7" fill="#ffffff" opacity="0.85" />
      </g>

      {/* 光輪（本体の手前側。奥→本体→手前の順に重ねて立体に見せる） */}
      <path
        d="M2.6 30.8A22 8 0 0 0 45.4 17.2"
        fill="none"
        stroke="#e5d6ff"
        strokeWidth="1.4"
        opacity="0.9"
        transform="rotate(-18 24 24)"
      />
    </svg>
  );
}
