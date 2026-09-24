import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Texture } from "three";

// 절차 텍스처 — 외부 이미지 없이 캔버스로 가죽 결·종이 옆면 결·종이 바탕을 그린다

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (!g) throw new Error("캔버스 2D 컨텍스트를 만들 수 없다");
  return { c, g };
}

// 시드 고정 난수 — 새로고침마다 결이 바뀌지 않게
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function colorTex(c: HTMLCanvasElement, repeat = false): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

// 가죽 결 — 범프맵(흑백). 잔주름 + 굵은 얼룩
export function leatherBump(): Texture {
  const { c, g } = canvas(512, 512);
  const r = rng(7);
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const v = 100 + r() * 60;
    g.fillStyle = `rgba(${v},${v},${v},0.35)`;
    g.beginPath();
    g.ellipse(x, y, 1 + r() * 3, 1 + r() * 2, r() * Math.PI, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = "rgba(60,60,60,0.25)";
  for (let i = 0; i < 260; i++) {
    g.lineWidth = 0.6 + r();
    g.beginPath();
    let x = r() * 512;
    let y = r() * 512;
    g.moveTo(x, y);
    for (let k = 0; k < 4; k++) {
      x += (r() - 0.5) * 30;
      y += (r() - 0.5) * 30;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

// 종이 옆면 결 — 쪽과 나란한 가는 줄(v 방향으로 쌓임), 가장자리로 갈수록 바랜 색
export function pageEdges(): Texture {
  // 화면에서 덩어리 두께가 수십 px이므로 줄을 굵고 성기게 둬야 밉맵에서 뭉개지지 않는다
  const { c, g } = canvas(64, 64);
  const r = rng(11);
  g.fillStyle = "#ecdfc2";
  g.fillRect(0, 0, 64, 64);
  for (let y = 1; y < 64; y += 5 + Math.floor(r() * 4)) {
    g.fillStyle = `rgba(112, 82, 52, ${0.28 + r() * 0.3})`;
    g.fillRect(0, y, 64, 2);
  }
  // 위아래(표지에 닿는 쪽)는 그늘
  const grad = g.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, "rgba(70, 45, 25, 0.25)");
  grad.addColorStop(0.2, "rgba(70, 45, 25, 0)");
  grad.addColorStop(0.8, "rgba(70, 45, 25, 0)");
  grad.addColorStop(1, "rgba(70, 45, 25, 0.25)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return colorTex(c, true);
}

// 빈 종이 — 낱장·아랫면용. 옅은 얼룩과 가장자리 바램
export function blankPaper(): Texture {
  const { c, g } = canvas(512, 683);
  paperGround(g, 512, 683, 3);
  return colorTex(c);
}

function paperGround(g: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = rng(seed);
  g.fillStyle = "#d9c3a5";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = (0.08 + r() * 0.25) * w;
    const grad = g.createRadialGradient(x, y, 0, x, y, rad);
    grad.addColorStop(0, `rgba(150, 110, 70, ${0.03 + r() * 0.04})`);
    grad.addColorStop(1, "rgba(150, 110, 70, 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  }
  // 종이 섬유
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(90, 60, 30, ${r() * 0.05})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1);
  }
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  v.addColorStop(0, "rgba(80, 50, 30, 0)");
  v.addColorStop(1, "rgba(80, 50, 30, 0.22)");
  g.fillStyle = v;
  g.fillRect(0, 0, w, h);
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`그림을 불러오지 못했다: ${src}`));
    img.src = src;
  });
}

// 표지 한가운데 위쪽 색 평균 → 책등·모서리·뒤표지 가죽 색
export function sampleLeather(cover: HTMLImageElement): string {
  const { g } = canvas(32, 32);
  g.drawImage(cover, cover.width * 0.2, cover.height * 0.12, cover.width * 0.6, cover.height * 0.22, 0, 0, 32, 32);
  const d = g.getImageData(0, 0, 32, 32).data;
  let r = 0;
  let gg = 0;
  let b = 0;
  for (let i = 0; i < d.length; i += 4) {
    r += d[i];
    gg += d[i + 1];
    b += d[i + 2];
  }
  const n = d.length / 4;
  const k = 0.82; // 모서리는 표지 면보다 조금 어둡다
  return `rgb(${Math.round((r / n) * k)}, ${Math.round((gg / n) * k)}, ${Math.round((b / n) * k)})`;
}

export function imageTex(img: HTMLImageElement): Texture {
  const t = new Texture(img);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

// 책등 — 가죽 색 바탕 위에 책등 그림(투명 배경)을 얹는다. 곡면 u = 뒤표지 → 앞표지
export function spineTex(spine: HTMLImageElement, leather: string): Texture {
  const { c, g } = canvas(128, 480);
  g.fillStyle = leather;
  g.fillRect(0, 0, 128, 480);
  g.drawImage(spine, 0, 0, 128, 480);
  return colorTex(c);
}

// 쪽 내용 — 시험판용. 실제 통합에서는 펼침이 끝나면 DOM 쪽으로 넘긴다
export interface PageContent {
  kicker: string;
  title: string;
  illust: HTMLImageElement | null;
  line: string;
  note: string;
  serif: string; // font-family
  sans: string;
}

const PAGE_W = 1024;

export function pageTex(side: "left" | "right", content: PageContent, aspect: number, seed: number): Texture {
  const w = PAGE_W;
  const h = Math.round(PAGE_W * aspect);
  const { c, g } = canvas(w, h);
  paperGround(g, w, h, seed);
  // 제본선 쪽 그늘 — 왼쪽 쪽은 오른쪽 가장자리, 오른쪽 쪽은 왼쪽 가장자리
  const gut = side === "left" ? g.createLinearGradient(w, 0, w * 0.86, 0) : g.createLinearGradient(0, 0, w * 0.14, 0);
  gut.addColorStop(0, "rgba(60, 35, 20, 0.28)");
  gut.addColorStop(1, "rgba(60, 35, 20, 0)");
  g.fillStyle = gut;
  g.fillRect(0, 0, w, h);

  const ink = "#2a2119";
  const muted = "#6e5c49";
  const padX = w * 0.1;
  let y = h * 0.1;
  g.textBaseline = "top";
  if (side === "left") {
    g.fillStyle = muted;
    g.font = `400 ${w * 0.03}px ${content.sans}`;
    g.fillText(content.kicker, padX, y);
    y += w * 0.055;
    g.fillStyle = ink;
    g.font = `800 ${w * 0.075}px ${content.serif}`;
    g.fillText(content.title, padX, y);
    y += w * 0.13;
    if (content.illust) {
      const iw = w - padX * 2;
      const ih = iw;
      const img = content.illust;
      const s = Math.max(iw / img.width, ih / img.height);
      const sw = iw / s;
      const sh = ih / s;
      g.save();
      g.beginPath();
      g.roundRect(padX, y, iw, ih, 10);
      g.clip();
      g.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, padX, y, iw, ih);
      g.restore();
      // 인쇄된 그림처럼 종이 색을 살짝 먹인다
      g.fillStyle = "rgba(210, 180, 140, 0.12)";
      g.fillRect(padX, y, iw, ih);
    }
  } else {
    g.fillStyle = ink;
    g.font = `400 ${w * 0.042}px ${content.sans}`;
    wrap(g, content.line, padX, y, w - padX * 2, w * 0.07);
    y += w * 0.2;
    g.fillStyle = "rgba(42, 33, 25, 0.2)";
    g.fillRect(padX, y, w - padX * 2, 2);
    y += w * 0.06;
    g.fillStyle = muted;
    g.font = `400 ${w * 0.032}px ${content.sans}`;
    wrap(g, content.note, padX, y, w - padX * 2, w * 0.055);
  }
  const t = colorTex(c);
  if (side === "left") {
    // 왼쪽 쪽은 뒤집힌 묶음의 윗면 — u가 앞마구리(화면 왼쪽)로 가므로 좌우를 뒤집어 붙인다
    t.wrapS = RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
  }
  return t;
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = "";
  for (const ch of text) {
    const next = line + ch;
    if (g.measureText(next).width > maxW && line) {
      g.fillText(line, x, y);
      y += lh;
      line = ch;
    } else line = next;
  }
  if (line) g.fillText(line, x, y);
}
