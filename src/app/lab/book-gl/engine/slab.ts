import { BufferAttribute, BufferGeometry } from "three";

// 휘는 종이 덩어리(속지 묶음)와 낱장 — 책등(x=0)에서 앞마구리(+x)로 뻗는 단면 곡선을 z(쪽 높이) 방향으로 민다.
// 곡선은 "쪽 면"(글이 보이는 면)이고, 덩어리 몸통은 법선 반대쪽(아래)으로 두께만큼 붙는다.
// 매 프레임 각도 분포(phi)만 바꿔 위치·법선을 다시 채운다 — 정점 배열은 처음 한 번만 만든다.

export const SEGMENTS = 36;

export interface SlabShape {
  length: number; // 책등 → 앞마구리 (쪽 폭)
  height: number; // 쪽 높이 (z, 가운데 0)
  thickness: number; // 0이면 낱장
  mirror: boolean; // y 뒤집기 — 왼쪽(경첩) 묶음은 같은 모양을 뒤집어 쓴다
}

// 각도 분포 phi[i] (i = 0..SEGMENTS)와 시작점 → 쪽 면 곡선 점·법선
export function centerline(phi: Float32Array, length: number, y0: number) {
  const n = SEGMENTS;
  const ds = length / n;
  const px = new Float32Array(n + 1);
  const py = new Float32Array(n + 1);
  const nx = new Float32Array(n + 1);
  const ny = new Float32Array(n + 1);
  px[0] = 0;
  py[0] = y0;
  for (let i = 0; i < n; i++) {
    const a = (phi[i] + phi[i + 1]) / 2;
    px[i + 1] = px[i] + Math.cos(a) * ds;
    py[i + 1] = py[i] + Math.sin(a) * ds;
  }
  for (let i = 0; i <= n; i++) {
    nx[i] = -Math.sin(phi[i]);
    ny[i] = Math.cos(phi[i]);
  }
  return { px, py, nx, ny };
}

// 덩어리: 윗면(쪽, 그룹0) · 옆면 3개(앞마구리·머리·꼬리, 그룹1) · 아랫면(그룹2)
// 낱장: 윗면만(그룹0, 양면 재질로 그린다)
export class Slab {
  readonly geometry = new BufferGeometry();
  private readonly pos: BufferAttribute;
  private readonly nor: BufferAttribute;

  constructor(private readonly shape: SlabShape) {
    const n = SEGMENTS;
    const solid = shape.thickness > 0;
    // 면별 정점 수: 윗면·아랫면 (n+1)*2, 머리·꼬리 (n+1)*2, 앞마구리 4
    const counts = solid ? [(n + 1) * 2, (n + 1) * 2, (n + 1) * 2, 4, (n + 1) * 2] : [(n + 1) * 2];
    const total = counts.reduce((a, b) => a + b, 0);
    this.pos = new BufferAttribute(new Float32Array(total * 3), 3);
    this.nor = new BufferAttribute(new Float32Array(total * 3), 3);
    const uv = new Float32Array(total * 2);
    const index: number[] = [];
    const flip = shape.mirror;

    // 띠 하나(i 따라 두 줄) — 인덱스와 UV. front=true면 윗면 방향으로 감는다
    const strip = (base: number, front: boolean, uvOf: (i: number, side: 0 | 1) => [number, number]) => {
      for (let i = 0; i <= n; i++) {
        for (const side of [0, 1] as const) {
          const [u, v] = uvOf(i, side);
          uv[(base + i * 2 + side) * 2] = u;
          uv[(base + i * 2 + side) * 2 + 1] = v;
        }
      }
      for (let i = 0; i < n; i++) {
        const a = base + i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        const ccw = front !== flip;
        if (ccw) index.push(a, b, c, c, b, d);
        else index.push(a, c, b, c, d, b);
      }
    };

    // 윗면: side0 = 머리(z=-h/2, 그림 위쪽 v=1), side1 = 꼬리
    let base = 0;
    strip(base, true, (i, side) => [i / n, side === 0 ? 1 : 0]);
    this.geometry.addGroup(0, n * 6, 0);
    if (solid) {
      // 머리 옆면: side0 = 쪽 면, side1 = 몸통 (v가 두께 방향)
      base += (n + 1) * 2;
      strip(base, false, (i, side) => [i / n, side]);
      // 꼬리 옆면
      base += (n + 1) * 2;
      strip(base, true, (i, side) => [i / n, side]);
      // 앞마구리: 4점 (쪽 머리, 쪽 꼬리, 몸통 머리, 몸통 꼬리)
      base += (n + 1) * 2;
      const f = base;
      uv.set([0, 0, 1, 0, 0, 1, 1, 1], f * 2);
      if (!flip) index.push(f, f + 1, f + 2, f + 1, f + 3, f + 2);
      else index.push(f, f + 2, f + 1, f + 1, f + 2, f + 3);
      this.geometry.addGroup(n * 6, n * 12 + 6, 1);
      // 아랫면
      base += 4;
      strip(base, false, (i, side) => [i / n, side === 0 ? 1 : 0]);
      this.geometry.addGroup(n * 18 + 6, n * 6, 2);
    }
    this.geometry.setIndex(index);
    this.geometry.setAttribute("position", this.pos);
    this.geometry.setAttribute("normal", this.nor);
    this.geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  }

  // phi: 각 마디의 기울기(라디안, 0 = 수평). y0: 책등 쪽 시작 높이
  update(phi: Float32Array, y0: number) {
    const { length, height, thickness, mirror } = this.shape;
    const n = SEGMENTS;
    const { px, py, nx, ny } = centerline(phi, length, y0);
    const s = mirror ? -1 : 1;
    const p = this.pos.array as Float32Array;
    const q = this.nor.array as Float32Array;
    const h2 = height / 2;
    let k = 0;
    const put = (x: number, y: number, z: number, a: number, b: number, c: number) => {
      p[k] = x;
      p[k + 1] = y * s;
      p[k + 2] = z;
      q[k] = a;
      q[k + 1] = b * s;
      q[k + 2] = c;
      k += 3;
    };
    // 윗면
    for (let i = 0; i <= n; i++) {
      put(px[i], py[i], -h2, nx[i], ny[i], 0);
      put(px[i], py[i], h2, nx[i], ny[i], 0);
    }
    if (thickness > 0) {
      const bx = (i: number) => px[i] - nx[i] * thickness;
      const by = (i: number) => py[i] - ny[i] * thickness;
      for (let i = 0; i <= n; i++) {
        put(px[i], py[i], -h2, 0, 0, -1);
        put(bx(i), by(i), -h2, 0, 0, -1);
      }
      for (let i = 0; i <= n; i++) {
        put(px[i], py[i], h2, 0, 0, 1);
        put(bx(i), by(i), h2, 0, 0, 1);
      }
      const ex = Math.cos(Math.atan2(ny[n], nx[n]) - Math.PI / 2);
      const ey = Math.sin(Math.atan2(ny[n], nx[n]) - Math.PI / 2);
      put(px[n], py[n], -h2, ex, ey, 0);
      put(px[n], py[n], h2, ex, ey, 0);
      put(bx(n), by(n), -h2, ex, ey, 0);
      put(bx(n), by(n), h2, ex, ey, 0);
      for (let i = 0; i <= n; i++) {
        put(bx(i), by(i), -h2, -nx[i], -ny[i], 0);
        put(bx(i), by(i), h2, -nx[i], -ny[i], 0);
      }
    }
    this.pos.needsUpdate = true;
    this.nor.needsUpdate = true;
    this.geometry.computeBoundingSphere();
  }
}

// 제본선 쪽 휨 — 책등에서 솟아 평평해지는 각도 분포. amp 0(닫힘) ~ 1(펼침)
export const GUTTER_ANGLE = 0.62;
export const GUTTER_SPAN = 0.17; // 쪽 폭 대비

export function gutterPhi(out: Float32Array, amp: number, bend: number, bendPow = 1.6) {
  const n = SEGMENTS;
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const g = Math.max(0, 1 - s / GUTTER_SPAN);
    out[i] = GUTTER_ANGLE * amp * g * g + bend * Math.pow(s, bendPow);
  }
  return out;
}

// 휨 때문에 솟는 높이 — 평평한 부분이 원래 쪽 높이에 오도록 시작점을 그만큼 내린다
export function gutterRise(amp: number, length: number) {
  const n = SEGMENTS;
  const phi = gutterPhi(new Float32Array(n + 1), amp, 0);
  let y = 0;
  for (let i = 0; i < n; i++) y += Math.sin((phi[i] + phi[i + 1]) / 2) * (length / n);
  return y;
}
