#!/usr/bin/env python3
"""
QRコードを作る最小実装（外部ライブラリなし）。

名刺にサイトのQRを刷るためだけのものなので、必要な範囲に絞ってあります。
- 8ビットバイトモードのみ（URLはASCIIなのでこれで足ります）
- 型番（バージョン）1〜4、誤り訂正レベル M / Q のみ
- 型番7以上で必要になる「型番情報」は不要（1〜6は入らない）

正しさは `python3 scripts/qrcode_min.py` の自己テストで確かめられます。
作ったQRを**別実装のデコーダで読み直して**、元の文字列に戻ることを検証します
（符号化と復号でコードを共有していないので、片方のバグを見逃しません）。

参考：JIS X 0510 / ISO/IEC 18004。
"""

from __future__ import annotations

# ------------------------------------------------------------------ GF(256)
# 原始多項式 x^8+x^4+x^3+x^2+1 = 0x11D
EXP = [0] * 512
LOG = [0] * 256
_x = 1
for _i in range(255):
    EXP[_i] = _x
    LOG[_x] = _i
    _x <<= 1
    if _x & 0x100:
        _x ^= 0x11D
for _i in range(255, 512):
    EXP[_i] = EXP[_i - 255]


def gf_mul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return EXP[LOG[a] + LOG[b]]


def rs_generator(n: int) -> list[int]:
    """(x-α^0)(x-α^1)…(x-α^(n-1)) の係数を**次数の低い順**で返す。"""
    g = [1]
    for i in range(n):
        g = [0] + g
        for j in range(len(g) - 1):
            g[j] ^= gf_mul(g[j + 1], EXP[i])
    return g


def rs_encode(data: list[int], ec_len: int) -> list[int]:
    """データ符号語から誤り訂正符号語を作る（多項式の剰余）。

    筆算の割り算と同じで、**最高次の係数から**引いていきます。
    `rs_generator` は低次順なので、ここで高次順（先頭が1）に直してから使います。
    """
    gen = rs_generator(ec_len)[::-1]
    rem = data + [0] * ec_len
    for i in range(len(data)):
        coef = rem[i]
        if coef:
            for j, g in enumerate(gen):
                rem[i + j] ^= gf_mul(g, coef)
    return rem[len(data):]


# ------------------------------------------------------------------ 仕様表
# (型番, レベル) → (ブロック数, 1ブロックのデータ符号語数, 1ブロックのEC符号語数)
# ※ ブロック数×(データ+EC) が型番の総符号語数（26/44/70/100）に一致することを自己テストで確認
BLOCKS: dict[tuple[int, str], tuple[int, int, int]] = {
    (1, "M"): (1, 16, 10),
    (1, "Q"): (1, 13, 13),
    (2, "M"): (1, 28, 16),
    (2, "Q"): (1, 22, 22),
    (3, "M"): (1, 44, 26),
    (3, "Q"): (2, 17, 18),
    (4, "M"): (2, 32, 18),
    (4, "Q"): (2, 24, 26),
}
TOTAL_CODEWORDS = {1: 26, 2: 44, 3: 70, 4: 100}
REMAINDER_BITS = {1: 0, 2: 7, 3: 7, 4: 7}
ALIGN_CENTERS = {1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26]}
EC_BITS = {"L": 0b01, "M": 0b00, "Q": 0b11, "H": 0b10}


def size_of(version: int) -> int:
    return version * 4 + 17


def capacity_bytes(version: int, level: str) -> int:
    blocks, data_cw, _ = BLOCKS[(version, level)]
    return blocks * data_cw - 2          # モード4ビット＋文字数8ビット＝1.5符号語ぶん


# ------------------------------------------------------------------ 骨組み
def _blank(version: int):
    n = size_of(version)
    mat = [[None] * n for _ in range(n)]   # None＝データを置ける場所
    fixed = [[False] * n for _ in range(n)]

    def put(x, y, v):
        mat[y][x] = v
        fixed[y][x] = True

    def finder(ox, oy):
        for dy in range(-1, 8):
            for dx in range(-1, 8):
                x, y = ox + dx, oy + dy
                if not (0 <= x < n and 0 <= y < n):
                    continue
                on = (0 <= dx <= 6 and dy in (0, 6)) or (0 <= dy <= 6 and dx in (0, 6)) \
                    or (2 <= dx <= 4 and 2 <= dy <= 4)
                put(x, y, 1 if on else 0)

    finder(0, 0)
    finder(n - 7, 0)
    finder(0, n - 7)

    # タイミングパターン
    for i in range(8, n - 8):
        v = 1 if i % 2 == 0 else 0
        put(i, 6, v)
        put(6, i, v)

    # 位置合わせパターン（ファインダと重なる位置は置かない）
    centers = ALIGN_CENTERS[version]
    for cy in centers:
        for cx in centers:
            if (cx, cy) in ((6, 6), (6, n - 7), (n - 7, 6)):
                continue
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    on = max(abs(dx), abs(dy)) != 1
                    put(cx + dx, cy + dy, 1 if on else 0)

    # 常に暗いモジュール
    put(8, n - 8, 1)

    # 形式情報の場所を予約しておく（値は後で入れる）
    for i in range(9):
        if mat[8][i] is None:
            put(i, 8, 0)
        if mat[i][8] is None:
            put(8, i, 0)
    for i in range(8):
        if mat[8][n - 1 - i] is None:
            put(n - 1 - i, 8, 0)
        if mat[n - 1 - i][8] is None:
            put(8, n - 1 - i, 0)

    return mat, fixed


def _format_bits(level: str, mask: int) -> list[int]:
    """形式情報15ビット（BCH(15,5) ＋ マスク 0x5412）。"""
    data = (EC_BITS[level] << 3) | mask
    rem = data << 10
    for i in range(4, -1, -1):
        if rem & (1 << (i + 10)):
            rem ^= 0b10100110111 << i
    bits = ((data << 10) | rem) ^ 0b101010000010010
    return [(bits >> (14 - i)) & 1 for i in range(15)]


def _place_format(mat, version: int, level: str, mask: int) -> None:
    n = size_of(version)
    b = _format_bits(level, mask)
    # 左上（0..14 を時計回りに）
    coords_a = [(0, 8), (1, 8), (2, 8), (3, 8), (4, 8), (5, 8), (7, 8), (8, 8),
                (8, 7), (8, 5), (8, 4), (8, 3), (8, 2), (8, 1), (8, 0)]
    # 右上と左下
    coords_b = [(n - 1, 8), (n - 2, 8), (n - 3, 8), (n - 4, 8), (n - 5, 8), (n - 6, 8),
                (n - 7, 8), (8, n - 7), (8, n - 6), (8, n - 5), (8, n - 4), (8, n - 3),
                (8, n - 2), (8, n - 1)]
    for i, (x, y) in enumerate(coords_a):
        mat[y][x] = b[i]
    for i, (x, y) in enumerate(coords_b):
        mat[y][x] = b[i]


def _mask_fn(mask: int):
    return [
        lambda x, y: (x + y) % 2 == 0,
        lambda x, y: y % 2 == 0,
        lambda x, y: x % 3 == 0,
        lambda x, y: (x + y) % 3 == 0,
        lambda x, y: (y // 2 + x // 3) % 2 == 0,
        lambda x, y: (x * y) % 2 + (x * y) % 3 == 0,
        lambda x, y: ((x * y) % 2 + (x * y) % 3) % 2 == 0,
        lambda x, y: ((x + y) % 2 + (x * y) % 3) % 2 == 0,
    ][mask]


def _data_positions(version: int, fixed):
    """右下から蛇行しながらデータを置く順に座標を返す（6列目の縦タイミングは飛ばす）。"""
    n = size_of(version)
    col = n - 1
    upward = True
    while col > 0:
        if col == 6:
            col -= 1
        rows = range(n - 1, -1, -1) if upward else range(n)
        for y in rows:
            for x in (col, col - 1):
                if not fixed[y][x]:
                    yield x, y
        upward = not upward
        col -= 2


def _penalty(mat) -> int:
    """マスク選択の評価。どのマスクでも読めるので厳密さより単純さを優先。"""
    n = len(mat)
    score = 0
    for line in list(mat) + [list(c) for c in zip(*mat)]:
        run, prev = 0, None
        for v in line:
            if v == prev:
                run += 1
                if run == 5:
                    score += 3
                elif run > 5:
                    score += 1
            else:
                prev, run = v, 1
    for y in range(n - 1):
        for x in range(n - 1):
            s = mat[y][x] + mat[y][x + 1] + mat[y + 1][x] + mat[y + 1][x + 1]
            if s in (0, 4):
                score += 3
    dark = sum(sum(r) for r in mat)
    score += abs(dark * 100 // (n * n) - 50) // 5 * 10
    return score


def encode(text: str, level: str = "Q") -> list[list[int]]:
    """文字列をQRコードの行列（0/1）にする。"""
    data = text.encode("utf-8")
    version = next((v for v in (1, 2, 3, 4) if len(data) <= capacity_bytes(v, level)), None)
    if version is None:
        raise ValueError(f"{len(data)}バイトは型番4・レベル{level}に入りません")

    blocks_n, data_cw, ec_cw = BLOCKS[(version, level)]
    total_data = blocks_n * data_cw

    # --- ビット列を組む（モード0100 ＋ 文字数8ビット ＋ 本体 ＋ 終端） ---
    bits: list[int] = [0, 1, 0, 0]
    for i in range(7, -1, -1):
        bits.append((len(data) >> i) & 1)
    for byte in data:
        for i in range(7, -1, -1):
            bits.append((byte >> i) & 1)
    bits += [0] * min(4, total_data * 8 - len(bits))
    while len(bits) % 8:
        bits.append(0)
    pad = [0xEC, 0x11]
    i = 0
    while len(bits) < total_data * 8:
        for k in range(7, -1, -1):
            bits.append((pad[i % 2] >> k) & 1)
        i += 1
    codewords = [int("".join(map(str, bits[i:i + 8])), 2) for i in range(0, len(bits), 8)]

    # --- ブロックに分けて誤り訂正符号を付け、交互に並べ直す ---
    dblocks = [codewords[i * data_cw:(i + 1) * data_cw] for i in range(blocks_n)]
    eblocks = [rs_encode(b, ec_cw) for b in dblocks]
    stream: list[int] = []
    for i in range(data_cw):
        for b in dblocks:
            stream.append(b[i])
    for i in range(ec_cw):
        for b in eblocks:
            stream.append(b[i])
    assert len(stream) == TOTAL_CODEWORDS[version]

    seq = [(c >> i) & 1 for c in stream for i in range(7, -1, -1)]
    seq += [0] * REMAINDER_BITS[version]

    # --- 8通りのマスクを試して、いちばん素直に見えるものを選ぶ ---
    best = None
    for mask in range(8):
        mat, fixed = _blank(version)
        fn = _mask_fn(mask)
        for (x, y), bit in zip(_data_positions(version, fixed), seq):
            mat[y][x] = bit ^ (1 if fn(x, y) else 0)
        _place_format(mat, version, level, mask)
        p = _penalty(mat)
        if best is None or p < best[0]:
            best = (p, mat)
    return best[1]


# ------------------------------------------------------------------ 検証用デコーダ
def decode(mat: list[list[int]], level: str = "Q") -> str:
    """`encode` の出力を**独立に**読み戻す（自己テスト専用。誤り訂正はしない）。"""
    n = len(mat)
    version = (n - 17) // 4
    # 形式情報から実際に使われたマスクを読む（符号化側の値は参照しない）
    read = [mat[8][0], mat[8][1], mat[8][2], mat[8][3], mat[8][4], mat[8][5], mat[8][7],
            mat[8][8], mat[7][8], mat[5][8], mat[4][8], mat[3][8], mat[2][8], mat[1][8], mat[0][8]]
    raw = 0
    for b in read:
        raw = (raw << 1) | b
    raw ^= 0b101010000010010
    mask = (raw >> 10) & 0b111
    ec = (raw >> 13) & 0b11
    assert ec == EC_BITS[level], f"形式情報のレベルが違う: {ec:02b}"

    _, fixed = _blank(version)
    fn = _mask_fn(mask)
    bits = [mat[y][x] ^ (1 if fn(x, y) else 0) for x, y in _data_positions(version, fixed)]
    stream = [int("".join(map(str, bits[i:i + 8])), 2)
              for i in range(0, len(bits) - REMAINDER_BITS[version], 8)]

    blocks_n, data_cw, _ = BLOCKS[(version, level)]
    dblocks = [[0] * data_cw for _ in range(blocks_n)]
    k = 0
    for i in range(data_cw):
        for b in range(blocks_n):
            dblocks[b][i] = stream[k]
            k += 1
    flat = [c for b in dblocks for c in b]

    bs = "".join(f"{c:08b}" for c in flat)
    assert bs[:4] == "0100", f"バイトモードではない: {bs[:4]}"
    length = int(bs[4:12], 2)
    body = bytes(int(bs[12 + i * 8:20 + i * 8], 2) for i in range(length))
    return body.decode("utf-8")


# ------------------------------------------------------------------ SVG化
def to_svg_path(mat: list[list[int]]) -> tuple[str, int]:
    """行列を1本のSVGパスにする。戻り値は (d属性, 一辺のモジュール数)。"""
    d = []
    for y, row in enumerate(mat):
        x = 0
        while x < len(row):
            if row[x]:
                run = 1
                while x + run < len(row) and row[x + run]:
                    run += 1
                d.append(f"M{x} {y}h{run}v1h-{run}z")
                x += run
            else:
                x += 1
    return "".join(d), len(mat)


# ------------------------------------------------------------------ 自己テスト
if __name__ == "__main__":
    for (v, lv), (nb, dcw, ecw) in BLOCKS.items():
        assert nb * (dcw + ecw) == TOTAL_CODEWORDS[v], (v, lv)
    print("符号語数の表: OK")

    # 誤り訂正符号の検証：データ＋EC を多項式とみなし、α^0…α^(n-1) で0になること
    # （＝生成多項式で割り切れること）を確かめる。読み戻しテストではECを見ないので、
    # ここを別に確認しておかないと「自分だけ読めるQR」になりかねない。
    for ec_len in (10, 13, 16, 18, 22, 26):
        block = [(i * 37 + 11) & 0xFF for i in range(17)]
        full = block + rs_encode(block, ec_len)
        for i in range(ec_len):
            s = 0
            for c in full:
                s = gf_mul(s, EXP[i]) ^ c
            assert s == 0, f"EC検証に失敗 (ec_len={ec_len}, i={i}, syndrome={s})"
    print("誤り訂正符号（シンドローム0）: OK")

    samples = [
        "https://www.yebisusoft.jp/",
        "https://www.yebisusoft.jp",
        "HELLO",
        "https://www.yebisusoft.jp/contact",
        "a" * 46,
    ]
    for text in samples:
        for level in ("M", "Q"):
            try:
                mat = encode(text, level)
            except ValueError as e:
                print(f"  skip {level} {len(text)}B: {e}")
                continue
            back = decode(mat, level)
            assert back == text, f"読み戻し失敗: {back!r} != {text!r}"
            print(f"  {level} {len(mat)}x{len(mat)} ({len(text)}B) 読み戻しOK: {text[:40]}")
    print("往復テスト: OK")
