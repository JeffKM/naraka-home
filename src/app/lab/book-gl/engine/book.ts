import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Material,
  type Texture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { SEGMENTS, Slab, gutterPhi, gutterRise } from "./slab";

// 책 한 권 — 단위: 표지 폭 W = 1. 좌표: x = 책등(0) → 앞마구리, y = 위(두께), z = 쪽 아래쪽(머리가 -z)
// 닫힌 책을 아래에서부터: 뒤표지판 → 오른쪽 속지 묶음 → 왼쪽 속지 묶음 → 앞표지판.
// 앞표지판·왼쪽 묶음·낱장은 경첩(x=0, y=PIVOT)을 축으로 z축 회전해 왼쪽으로 펼쳐진다 (π = 다 펼침).
// 두 묶음 두께가 같아서, 다 펼치면 왼쪽 절반이 책상(y=0)에 정확히 닿는다.
export const W = 1;
export const H = 4 / 3;
export const BOARD = 0.02; // 표지판 두께
export const BLOCK = 0.055; // 속지 묶음 하나의 두께
export const SQUARE = 0.022; // 표지가 속지보다 튀어나온 폭
export const PIVOT = BOARD + BLOCK;
export const PAGE_L = W - SQUARE;
export const PAGE_H = H - SQUARE * 2;
export const TOP = PIVOT * 2; // 닫힌 책 윗면 높이
export const SHEETS = 3;

export interface BookMaterials {
  leather: MeshStandardMaterial;
  endpaper: MeshStandardMaterial;
  coverArt: MeshStandardMaterial;
  spine: MeshStandardMaterial;
  pageLeft: MeshStandardMaterial;
  pageRight: MeshStandardMaterial;
  edges: MeshStandardMaterial;
  paper: MeshStandardMaterial;
  sheet: MeshStandardMaterial;
}

export interface BookPose {
  cover: number; // 앞표지 각도 (0 닫힘 ~ π 펼침)
  bundle: number; // 왼쪽 묶음 밑동 각도
  bend: number; // 왼쪽 묶음 휨 (+ = 끝이 닫힌 쪽으로 처짐)
  gutter: number; // 제본선 휨 0 ~ 1
  sheets: { angle: number; bend: number }[];
}

export const CLOSED: BookPose = { cover: 0, bundle: 0, bend: 0, gutter: 0, sheets: [] };
export const OPEN: BookPose = { cover: Math.PI, bundle: Math.PI, bend: 0, gutter: 1, sheets: [] };

const shadowed = (m: Mesh) => {
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
};

export class BookModel {
  readonly root = new Group();
  private readonly coverGroup = new Group();
  private readonly bundleGroup = new Group();
  private readonly sheetGroups: Group[] = [];
  private readonly right: Slab;
  private readonly left: Slab;
  private readonly sheets: Slab[] = [];
  private readonly sheetMeshes: Mesh[] = [];
  private readonly spineGeo = new BufferGeometry();
  private readonly phi = new Float32Array(SEGMENTS + 1);
  private readonly riseCache = new Map<number, number>();

  constructor(private readonly mats: BookMaterials) {
    const { leather, endpaper, coverArt, spine, pageLeft, pageRight, edges, paper, sheet } = mats;
    // 표지판 면 순서: +x, -x, +y, -y, +z, -z
    const boardGeo = new RoundedBoxGeometry(W, BOARD, H, 2, 0.006);
    const back = shadowed(new Mesh(boardGeo, [leather, leather, endpaper, leather, leather, leather]));
    back.position.set(W / 2, BOARD / 2, 0);
    this.root.add(back);

    this.right = new Slab({ length: PAGE_L, height: PAGE_H, thickness: BLOCK, mirror: false });
    const rightMesh = shadowed(new Mesh(this.right.geometry, [pageRight, edges, paper]));
    rightMesh.position.y = PIVOT;
    this.root.add(rightMesh);

    this.coverGroup.position.y = PIVOT;
    const front = shadowed(new Mesh(boardGeo, [leather, leather, leather, endpaper, leather, leather]));
    front.position.set(W / 2, BLOCK + BOARD / 2, 0);
    const artGeo = new PlaneGeometry(W - 0.01, H - 0.01).rotateX(-Math.PI / 2);
    const art = shadowed(new Mesh(artGeo, coverArt));
    art.position.set(W / 2, BLOCK + BOARD + 0.0008, 0);
    this.coverGroup.add(front, art);
    this.root.add(this.coverGroup);

    this.bundleGroup.position.y = PIVOT;
    this.left = new Slab({ length: PAGE_L, height: PAGE_H, thickness: BLOCK, mirror: true });
    this.bundleGroup.add(shadowed(new Mesh(this.left.geometry, [pageLeft, edges, paper])));
    this.root.add(this.bundleGroup);

    for (let i = 0; i < SHEETS; i++) {
      const g = new Group();
      g.position.y = PIVOT;
      const s = new Slab({ length: PAGE_L, height: PAGE_H, thickness: 0, mirror: true });
      const m = shadowed(new Mesh(s.geometry, sheet));
      m.visible = false;
      g.add(m);
      this.root.add(g);
      this.sheetGroups.push(g);
      this.sheets.push(s);
      this.sheetMeshes.push(m);
    }

    // 책등 — 뒤표지판 바깥 모서리(0,0)와 앞표지판 바깥 모서리를 잇는 둥근 곡면
    const K = 16;
    this.spineGeo.setAttribute("position", new BufferAttribute(new Float32Array((K + 1) * 2 * 3), 3));
    const uv = new Float32Array((K + 1) * 2 * 2);
    const idx: number[] = [];
    for (let k = 0; k <= K; k++) {
      uv.set([k / K, 1, k / K, 0], k * 4);
      if (k < K) {
        const a = k * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
    }
    this.spineGeo.setAttribute("uv", new BufferAttribute(uv, 2));
    this.spineGeo.setIndex(idx);
    const spineMesh = shadowed(new Mesh(this.spineGeo, spine));
    this.root.add(spineMesh);
    spine.side = DoubleSide;

    this.setPose(OPEN);
  }

  private rise(g: number) {
    const key = Math.round(g * 100);
    let r = this.riseCache.get(key);
    if (r === undefined) {
      r = gutterRise(key / 100, PAGE_L);
      this.riseCache.set(key, r);
    }
    return r;
  }

  setPose(p: BookPose) {
    const rise = this.rise(p.gutter);
    this.right.update(gutterPhi(this.phi, p.gutter, 0), -rise);
    this.left.update(gutterPhi(this.phi, p.gutter, p.bend), -rise);
    this.coverGroup.rotation.z = p.cover;
    this.bundleGroup.rotation.z = p.bundle;
    for (let i = 0; i < SHEETS; i++) {
      const s = p.sheets[i];
      const apart = s ? p.bundle - s.angle : 0;
      const m = this.sheetMeshes[i];
      m.visible = apart > 0.004;
      if (!m.visible || !s) continue;
      this.sheetGroups[i].rotation.z = s.angle;
      // 묶음 쪽 면에서 아주 조금씩 떨어뜨려 겹침 깜빡임을 피한다
      this.sheets[i].update(gutterPhi(this.phi, p.gutter, s.bend), -rise + 0.0012 * (i + 1));
    }
    this.updateSpine(p.cover);
  }

  private updateSpine(cover: number) {
    const K = 16;
    const r = BLOCK + BOARD;
    const bx = -r * Math.sin(cover);
    const by = PIVOT + r * Math.cos(cover);
    const len = Math.hypot(bx, by);
    const bulge = len * 0.28;
    const cx = bx / 2 + (len > 1e-6 ? -by / len : 0) * bulge;
    const cy = by / 2 + (len > 1e-6 ? bx / len : 0) * bulge;
    const pos = this.spineGeo.getAttribute("position") as BufferAttribute;
    const a = pos.array as Float32Array;
    for (let k = 0; k <= K; k++) {
      const t = k / K;
      const x = 2 * (1 - t) * t * cx + t * t * bx;
      const y = 2 * (1 - t) * t * cy + t * t * by;
      a.set([x, y, -H / 2, x, y, H / 2], k * 6);
    }
    pos.needsUpdate = true;
    this.spineGeo.computeVertexNormals();
    this.spineGeo.computeBoundingSphere();
  }

  dispose(textures: Texture[]) {
    this.root.traverse((o) => {
      if (o instanceof Mesh) o.geometry.dispose();
    });
    const own: Material[] = [this.mats.coverArt, this.mats.spine, this.mats.pageLeft, this.mats.pageRight, this.mats.leather];
    own.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
  }
}
