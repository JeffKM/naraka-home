import {
  Color,
  DirectionalLight,
  DoubleSide,
  HemisphereLight,
  Mesh,
  MeshDepthMaterial,
  MeshStandardMaterial,
  NoToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  RGBADepthPacking,
  SRGBColorSpace,
  Scene,
  ShadowMaterial,
  Vector3,
  WebGLRenderer,
  type Texture,
} from "three";
import { BOOKS, type BookId } from "@/lib/book/books";
import { storySrc } from "@/lib/book/art";
import { PAGE, PAGE_NOTE } from "../../book-depth/content";
import { BookModel, CLOSED, OPEN, PAGE_H, PAGE_L, PIVOT, TOP, W } from "./book";
import { HAND_SHAPE, LIFT_TO, TL, closingPose, deskness, fromPlace, handPhase, handShape, handWithdraw, openingPose, slideDrift, toPlace } from "./timeline";
import { Slab } from "./slab";
import { blankPaper, imageTex, leatherBump, loadImage, pageEdges, pageTex, sampleLeather, spineTex } from "./textures";

// 책상 장면 — 투명 캔버스를 책상 그림(DOM 겹) 위에 겹친다. 책의 그림자는 책상 높이의 그림자 받이에 떨어진다.
// 쉬는 동안엔 한 번만 그리고, 교체 중에만 매 프레임 그린다.

const FOV = 28;
const DESK_ELEVATION = (52 * Math.PI) / 180;
const HAND_W = 1.6; // 손(손끝~소맷부리) 부분 폭, 표지 폭 단위
const HAND_SRC = { w: 2100, h: 452, handPart: 700 };
const HAND_YAW = -0.35; // 팔이 앞(보는 쪽)·오른쪽으로 뻗는다
const HAND_TILT = 0.08; // 팔이 어깨 쪽으로 살짝 올라간다 — 손끝 뒤로는 책보다 높아 표지를 뚫지 않는다
const HAND_Z = 0.2;
const HAND_SEGMENTS = 120;
const HAND_JOINTS = { knuckle: 215, wrist: 350 }; // hand-reach 그림에서 손가락 마디·손목 x(px)
const DESK_DRIFT = { desk: 46, back: 14 }; // 교체 중 책상 겹이 옆으로 흐르는 양(px)
const DESK_NEAR = { desk: 1.12, back: 1.05 }; // 펼친 상태(가까이)에서 책상 겹 배율

export interface Fonts {
  serif: string;
  sans: string;
}

interface LoadedBook {
  model: BookModel;
  textures: Texture[];
}

export interface SwapOptions {
  speed: number;
  hand: boolean;
  layers: boolean;
  reduce: boolean;
}

export class Stage {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(FOV, 1, 0.05, 100);
  private readonly light = new DirectionalLight(0xfff0dc, 2.6);
  private readonly books = new Map<BookId, LoadedBook>();
  private readonly shared = { bump: leatherBump(), edges: pageEdges(), blank: blankPaper() };
  private readonly sharedMats: { edges: MeshStandardMaterial; paper: MeshStandardMaterial; sheet: MeshStandardMaterial; endpaper: MeshStandardMaterial };
  private hand: Mesh | null = null;
  private handStrip: Slab | null = null;
  private handPhi: Float32Array | null = null;
  private current: BookId | null = null;
  private view = { k: 1, dRest: 1, dDesk: 1, restX: 0, zOff: 0, mobile: false, w: 1, h: 1 };
  private raf = 0;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly desk: { back: HTMLElement | null; top: HTMLElement | null },
    private readonly fonts: Fonts,
  ) {
    this.renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;

    this.scene.add(new HemisphereLight(new Color("#fff3e2"), new Color("#4a2e30"), 1.9));
    this.light.position.set(-2.2, 6, 3.2);
    this.light.castShadow = true;
    this.light.shadow.mapSize.set(2048, 2048);
    this.light.shadow.bias = -0.0004;
    this.light.shadow.normalBias = 0.01;
    this.light.shadow.radius = 4;
    const sc = this.light.shadow.camera;
    sc.left = -3;
    sc.right = 3;
    sc.top = 3;
    sc.bottom = -3;
    sc.near = 0.5;
    sc.far = 20;
    this.scene.add(this.light, this.light.target);

    // 그림자 받이 — 책상 면(y=0)
    const catcher = new Mesh(new PlaneGeometry(40, 40).rotateX(-Math.PI / 2), new ShadowMaterial({ opacity: 0.42 }));
    catcher.receiveShadow = true;
    this.scene.add(catcher);

    const { bump, edges, blank } = this.shared;
    this.sharedMats = {
      edges: new MeshStandardMaterial({ map: edges, roughness: 0.95 }),
      paper: new MeshStandardMaterial({ map: blank, roughness: 0.95 }),
      sheet: new MeshStandardMaterial({ map: blank, roughness: 0.95, side: DoubleSide }),
      endpaper: new MeshStandardMaterial({ color: "#b89a78", roughness: 0.9, bumpMap: bump, bumpScale: 0.3 }),
    };
  }

  async init(id: BookId) {
    const [handImg] = await Promise.all([loadImage("/home/book/art/hand-reach.webp"), this.ensure(id)]);
    this.makeHand(handImg);
    this.current = id;
    const b = this.books.get(id);
    if (b) this.scene.add(b.model.root);
    this.layout();
  }

  private makeHand(img: HTMLImageElement) {
    const tex = imageTex(img);
    const w = HAND_W * (HAND_SRC.w / HAND_SRC.handPart);
    const h = HAND_W * (HAND_SRC.h / HAND_SRC.handPart);
    // 손끝(그림 왼쪽 끝)이 원점, 팔 쪽으로 +x. 손가락 마디·손목에서 접히는 낱장으로 만든다 (그림 위쪽 = -z)
    this.handStrip = new Slab({ length: w, height: h, thickness: 0, mirror: false, segments: HAND_SEGMENTS });
    this.handPhi = new Float32Array(HAND_SEGMENTS + 1);
    const mat = new MeshStandardMaterial({ map: tex, alphaTest: 0.5, side: DoubleSide, roughness: 0.8 });
    const hand = new Mesh(this.handStrip.geometry, mat);
    hand.castShadow = true;
    hand.customDepthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: tex, alphaTest: 0.5 });
    hand.rotation.order = "YZX";
    hand.visible = false;
    this.hand = hand;
    this.shapeHand(HAND_SHAPE.push.curl, HAND_SHAPE.push.wrist);
  }

  // 손 접기 — 손끝에서 팔 쪽으로 갈수록: 손가락 구간은 curl만큼 올라가고(손끝이 아래로 갈고리),
  // 손목 너머는 wrist만큼 더 올라간다. 접히는 곳은 몇 마디에 걸쳐 부드럽게
  private shapeHand(curl: number, wrist: number) {
    const strip = this.handStrip;
    const phi = this.handPhi;
    if (!strip || !phi) return;
    const n = HAND_SEGMENTS;
    const len = HAND_W * (HAND_SRC.w / HAND_SRC.handPart);
    const px = len / HAND_SRC.w;
    const smooth = (x: number, a: number, b: number) => {
      const u = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return u * u * (3 - 2 * u);
    };
    const knuckle = HAND_JOINTS.knuckle * px;
    const wristAt = HAND_JOINTS.wrist * px;
    for (let i = 0; i <= n; i++) {
      const s = (i / n) * len;
      phi[i] = curl * (1 - smooth(s, knuckle - 0.09, knuckle + 0.09)) + wrist * smooth(s, wristAt - 0.1, wristAt + 0.1);
    }
    strip.update(phi, 0);
  }

  private async ensure(id: BookId): Promise<LoadedBook> {
    const have = this.books.get(id);
    if (have) return have;
    const page = PAGE[id];
    const book = BOOKS.find((b) => b.id === id);
    const [cover, spine, illust] = await Promise.all([
      loadImage(`/home/book/art/cover-${id}.webp`),
      loadImage(`/home/book/art/spine-${id}.webp`),
      loadImage(storySrc(page.story)).catch(() => null),
    ]);
    await Promise.all([document.fonts.load(`800 40px ${this.fonts.serif}`), document.fonts.load(`400 40px ${this.fonts.sans}`)]).catch(() => undefined);
    const leather = sampleLeather(cover);
    const content = {
      kicker: book?.title ?? "",
      title: id === "home" ? "오늘의 나라카" : (book?.title ?? ""),
      illust,
      line: page.line,
      note: PAGE_NOTE,
      serif: this.fonts.serif,
      sans: this.fonts.sans,
    };
    const aspect = PAGE_H / PAGE_L;
    const textures = [imageTex(cover), spineTex(spine, leather), pageTex("left", content, aspect, 21), pageTex("right", content, aspect, 34)];
    const [coverT, spineT, leftT, rightT] = textures;
    const { bump } = this.shared;
    const model = new BookModel({
      leather: new MeshStandardMaterial({ color: leather, roughness: 0.6, bumpMap: bump, bumpScale: 0.8 }),
      endpaper: this.sharedMats.endpaper,
      coverArt: new MeshStandardMaterial({ map: coverT, roughness: 0.62, bumpMap: bump, bumpScale: 0.35 }),
      spine: new MeshStandardMaterial({ map: spineT, roughness: 0.6, bumpMap: bump, bumpScale: 0.6 }),
      pageLeft: new MeshStandardMaterial({ map: leftT, roughness: 0.92 }),
      pageRight: new MeshStandardMaterial({ map: rightT, roughness: 0.92 }),
      edges: this.sharedMats.edges,
      paper: this.sharedMats.paper,
      sheet: this.sharedMats.sheet,
    });
    const loaded = { model, textures };
    this.books.set(id, loaded);
    return loaded;
  }

  preload(id: BookId) {
    void this.ensure(id).catch(() => undefined);
  }

  // 화면 크기 → 카메라 거리. 펼친 양면(표지 포함 2W)이 예전 시험판과 같은 크기로 보이게
  layout() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const mobile = w < 768;
    const top = mobile ? 12 : 24;
    const bottom = mobile ? 132 : 88;
    const stageH = h - top - bottom;
    const k = mobile ? W / (w - 32) : (2 * W) / Math.min(w - 160, (stageH - 24) * 1.5);
    const dRest = (h * k) / 2 / Math.tan((FOV * Math.PI) / 360);
    this.view = {
      k,
      dRest,
      dDesk: dRest * (mobile ? 1 / 0.62 : 2),
      restX: mobile ? W / 2 : 0,
      zOff: ((bottom - top) / 2) * k,
      mobile,
      w,
      h,
    };
    this.pose(TL.end, null);
    this.render();
  }

  private placeCamera(p: number, drift: number) {
    const v = this.view;
    const el = Math.PI / 2 + (DESK_ELEVATION - Math.PI / 2) * p;
    const dist = v.dRest + (v.dDesk - v.dRest) * p;
    const kHere = v.k * (dist / v.dRest);
    const target = new Vector3(
      v.restX + (W / 2 - v.restX) * p + DESK_DRIFT.desk * kHere * drift * p,
      PIVOT * (1 - p),
      v.zOff * (1 + p),
    );
    this.camera.up.set(0, 0, -1);
    this.camera.position.set(target.x, target.y + dist * Math.sin(el), target.z + dist * Math.cos(el));
    this.camera.lookAt(target);
    this.light.target.position.copy(target).setY(0);
    this.light.position.set(target.x - 2.6, 4.2, target.z + 2.4);
  }

  private placeDesk(p: number, drift: number, layers: boolean) {
    const { back, top } = this.desk;
    const set = (el: HTMLElement | null, near: number, d: number) => {
      if (!el) return;
      el.style.transform = layers ? `translateX(${-d * drift * p}px) scale(${near + (1 - near) * p})` : "";
    };
    set(top, DESK_NEAR.desk, DESK_DRIFT.desk);
    set(back, DESK_NEAR.back, DESK_DRIFT.back);
  }

  // t 시점의 장면. swap이 null이면 현재 책이 펼쳐진 채 쉬는 모습
  private pose(t: number, swap: { from: LoadedBook; to: LoadedBook; opts: SwapOptions } | null) {
    if (!swap) {
      const cur = this.current ? this.books.get(this.current) : null;
      if (cur) {
        cur.model.root.position.set(0, 0, 0);
        cur.model.root.rotation.set(0, 0, 0);
        cur.model.setPose(OPEN);
      }
      if (this.hand) this.hand.visible = false;
      this.placeCamera(0, 0);
      this.placeDesk(0, 0, true);
      return;
    }
    const { from, to, opts } = swap;
    const p = deskness(t);
    const drift = slideDrift(t);
    this.placeCamera(p, drift);
    this.placeDesk(p, drift, opts.layers && !this.view.mobile);

    const fp = fromPlace(t);
    from.model.root.position.set(fp.x, 0, 0);
    from.model.root.rotation.set(0, fp.yaw, 0);
    from.model.setPose(t >= TL.closeBounce[1] ? CLOSED : closingPose(t));
    from.model.root.visible = t < TL.slide[1];

    const tp = toPlace(t);
    to.model.root.position.set(tp.x, 0, 0);
    to.model.root.rotation.set(0, tp.yaw, 0);
    const open = t < TL.lift[0] ? CLOSED : openingPose(t);
    to.model.setPose(open);
    to.model.root.visible = tp.visible;

    this.poseHand(t, to, open.cover, opts.hand);
  }

  private poseHand(t: number, to: LoadedBook, cover: number, enabled: boolean) {
    const hand = this.hand;
    if (!hand) return;
    const { phase, u } = handPhase(t);
    hand.visible = enabled && phase !== "hidden";
    if (!hand.visible) return;
    if (hand.parent !== to.model.root) to.model.root.add(hand);
    // 밀어 넣을 땐 손가락을 앞표지 위에 얹고 → 앞마구리 너머로 들었다가 → 쪽 사이(가운데 틈)로 손끝을 넣는다.
    // 넣은 손끝은 책 몸통에 가려 보이지 않는다 (깊이 가림)
    const push = new Vector3(W - 0.24, TOP + 0.006, HAND_Z);
    const over = new Vector3(W + 0.05, TOP + 0.05, HAND_Z);
    const slot = new Vector3(PAGE_L - 0.07, PIVOT, HAND_Z);
    // 틈에 넣은 손끝 — 왼쪽 묶음의 쪽 면 바로 아래에서 묶음과 함께 돈다
    const held = (a: number) => {
      const x = PAGE_L - 0.07;
      const r = -0.003;
      return new Vector3(x * Math.cos(a) - r * Math.sin(a), PIVOT + x * Math.sin(a) + r * Math.cos(a), HAND_Z);
    };
    // 손은 묶음만큼 세우지 않는다 — 손목이 꺾여 팔은 오른쪽에 남는다.
    // 들수록 손목을 돌려(팔 축 회전) 손등이 서고 손가락이 모서리를 감싼 모양이 된다
    const tiltHeld = (a: number) => a * 0.55;
    const rollHeld = (a: number) => (a / LIFT_TO) * 0.6;
    let pos: Vector3;
    let tilt = HAND_TILT;
    let roll = 0;
    if (phase === "push") pos = push;
    else if (phase === "grip") {
      pos = u < 0.5 ? push.clone().lerp(over, u * 2) : over.clone().lerp(slot, (u - 0.5) * 2);
      tilt = HAND_TILT * (1 - u);
    } else if (phase === "lift") {
      pos = held(cover);
      tilt = tiltHeld(cover);
      roll = rollHeld(cover);
    } else {
      // 놓고(손가락을 편 뒤) 거둔다 — 팔이 뻗어 온 쪽으로 빠지며 살짝 들린다
      const a0 = LIFT_TO;
      const t0 = tiltHeld(a0);
      const w = handWithdraw(u);
      tilt = t0 + (HAND_TILT - t0) * w;
      roll = rollHeld(a0) * (1 - w);
      const dir = new Vector3(Math.cos(tilt) * Math.cos(HAND_YAW), Math.sin(tilt), -Math.cos(tilt) * Math.sin(HAND_YAW));
      pos = held(a0).addScaledVector(dir, 3.4 * w).add(new Vector3(0, 0.25 * w, 0));
    }
    const shape = handShape(phase, u, cover);
    this.shapeHand(shape.curl, shape.wrist);
    hand.position.copy(pos);
    hand.rotation.set(roll, HAND_YAW, tilt);
  }

  render() {
    if (!this.disposed) this.renderer.render(this.scene, this.camera);
  }

  async swap(toId: BookId, opts: SwapOptions): Promise<void> {
    if (!this.current || toId === this.current) return;
    const fromId = this.current;
    const [from, to] = await Promise.all([this.ensure(fromId), this.ensure(toId)]);
    if (this.disposed) return;
    this.scene.add(to.model.root);
    const k = opts.reduce ? 1e6 : opts.speed;
    const swap = { from, to, opts };
    await new Promise<void>((resolve) => {
      const start = performance.now();
      const tick = (now: number) => {
        if (this.disposed) return resolve();
        const t = Math.min(TL.end, (now - start) * k);
        this.pose(t, swap);
        this.render();
        if (t >= TL.end) return resolve();
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    });
    if (this.disposed) return;
    this.hand?.removeFromParent();
    this.scene.remove(from.model.root);
    from.model.dispose(from.textures);
    this.books.delete(fromId);
    this.current = toId;
    this.pose(TL.end, null);
    this.render();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    for (const b of this.books.values()) b.model.dispose(b.textures);
    this.books.clear();
    Object.values(this.shared).forEach((t) => t.dispose());
    Object.values(this.sharedMats).forEach((m) => m.dispose());
    this.renderer.dispose();
  }
}
