import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { filamentHex } from "@/lib/model3d";
import type { LabelMount, LabelValue, Model3D, PartColors, ProductImage } from "@/lib/types";

/* -------------------------------------------------------------------------
   Escena 3D sin React: carga modelos .glb, aplica colores por parte y
   ubica piezas sobre una base (ej. muñecos sobre la bandeja).
   ------------------------------------------------------------------------- */

export interface ViewerPiece {
  key: string;
  model?: Model3D;
  colors?: PartColors;
  /** Etiqueta con texto (sólo modelos con labelMount, ej. bandejas) */
  label?: LabelValue;
  /** Si la pieza no tiene modelo 3D, se muestra su foto como tarjeta */
  image?: ProductImage;
  /** Posición [x, z] en metros sobre la base. Si no se indica, se acomoda sola */
  position?: [number, number];
  /** Lugares que ocupa sobre la base (ej. el nacimiento ocupa 2). Por defecto 1 */
  slots?: number;
}

export interface ViewerSpec {
  /** Base sobre la que se apoyan las piezas (ej. bandeja) */
  base?: { key: string; model: Model3D; colors?: PartColors; label?: LabelValue };
  pieces: ViewerPiece[];
  /** Cantidad de lugares (muestra marcas en los lugares vacíos) */
  slots?: number;
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const modelCache = new Map<string, Promise<THREE.Group>>();
const textureCache = new Map<string, Promise<THREE.Texture>>();

function loadModel(src: string) {
  let promise = modelCache.get(src);
  if (!promise) {
    promise = loader.loadAsync(src).then((gltf) => {
      gltf.scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          // Los .glb se exportan sin normales para pesar menos
          if (!o.geometry.attributes.normal) o.geometry.computeVertexNormals();
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      return gltf.scene;
    });
    promise.catch(() => modelCache.delete(src));
    modelCache.set(src, promise);
  }
  return promise;
}

function loadTexture(src: string) {
  let promise = textureCache.get(src);
  if (!promise) {
    promise = new THREE.TextureLoader().loadAsync(src).then((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    });
    textureCache.set(src, promise);
  }
  return promise;
}

/** Instancia un modelo con materiales propios y los colores indicados */
/**
 * Textura del texto con efecto de relieve (sombra abajo, brillo arriba),
 * como si el texto estuviera impreso sobresaliendo de la etiqueta.
 */
function labelTexture(text: string, color: string, aspect: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = Math.max(128, Math.round(2048 / aspect));
  const ctx = canvas.getContext("2d")!;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  let size = canvas.height * 0.58;
  ctx.font = `700 ${size}px ${family}`;
  const maxWidth = canvas.width * 0.86;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) size *= maxWidth / width;
  ctx.font = `700 ${size}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const x = canvas.width / 2;
  const y = canvas.height / 2 + size * 0.04;
  const d = Math.max(2, size * 0.035);
  ctx.fillStyle = "rgba(0,0,0,0.28)"; // sombra del relieve
  ctx.fillText(text, x + d * 0.6, y + d);
  ctx.fillStyle = "rgba(255,255,255,0.35)"; // brillo del borde superior
  ctx.fillText(text, x - d * 0.3, y - d * 0.5);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

/** Rectángulo de esquinas redondeadas con bisel (la etiqueta) */
function roundedPlate(w: number, h: number, depth: number, radius: number) {
  const r = Math.min(radius, h / 2, w / 2);
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const bevel = Math.min(depth * 0.3, r * 0.5);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 10,
  });
  geometry.translate(0, 0, bevel); // de 0 a depth en Z
  return geometry;
}

/**
 * Bandeja con etiqueta: se hace un rebaje plano en el centro del frente (del ancho de la
 * etiqueta) y se coloca la etiqueta delante, 2 mm más ancha por lado y del alto de la
 * bandeja, de modo que el rebaje queda oculto. Los cilindros de encastre quedan escondidos.
 * El modelo debe estar centrado en el origen con el frente hacia +Z.
 */
function addLabel(instance: THREE.Object3D, mount: LabelMount, baseColor: string, label: LabelValue) {
  const mm = 0.001;
  const box = new THREE.Box3().setFromObject(instance);
  const height = box.max.y - box.min.y;
  const zc = box.max.z - mount.cutDepthMm * mm; // plano de corte

  const cx = (box.max.x + box.min.x) / 2;
  const plateW = (box.max.x - box.min.x) * mount.plateWidthRatio;
  // Zona plana de ancho fijo (siempre más angosta que la etiqueta, que la tapa)
  const notchHalf = Math.min(mount.flatWidthMm * mm, plateW - 4 * mm) / 2;

  // 1. Rebaje frontal: se quita sólo la zona delante del plano y dentro del ancho de la etiqueta
  //    (clipIntersection: se recorta únicamente donde se cumplen los tres planos)
  const clips = [
    new THREE.Plane(new THREE.Vector3(0, 0, -1), zc), // z > zc
    new THREE.Plane(new THREE.Vector3(1, 0, 0), -(cx + notchHalf)), // x < cx + notchHalf
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), cx - notchHalf), // x > cx - notchHalf
  ];
  instance.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const m = o.material as THREE.MeshStandardMaterial;
      m.clippingPlanes = clips;
      m.clipIntersection = true;
      m.clipShadows = true;
      m.side = THREE.DoubleSide;
    }
  });

  const own = (mesh: THREE.Mesh) => {
    mesh.userData.ownGeometry = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };
  const group = new THREE.Group();

  // 2. Cara plana que cierra el rebaje (queda detrás de la etiqueta)
  const wall = 4 * mm;
  const face = own(
    new THREE.Mesh(
      new THREE.BoxGeometry(notchHalf * 2, height * 0.98, wall),
      new THREE.MeshStandardMaterial({ color: filamentHex(baseColor), roughness: 0.7 }),
    ),
  );
  face.position.set(cx, box.min.y + height * 0.49, zc - wall / 2);
  group.add(face);

  // 3. Etiqueta frontal: tapa el rebaje (2 mm más ancha por lado)
  const plateH = (mount.plateHeightMm ? mount.plateHeightMm * mm : height) * 0.98;
  const plateT = 3 * mm;
  const gap = 0.6 * mm;
  const plateMaterial = new THREE.MeshStandardMaterial({ color: filamentHex(label.plateColor), roughness: 0.55 });
  const plate = own(new THREE.Mesh(roundedPlate(plateW, plateH, plateT, Math.min(plateH * 0.35, 5 * mm)), plateMaterial));
  const plateY = box.min.y + plateH / 2 + height * 0.01;
  plate.position.set(cx, plateY, zc + gap);
  group.add(plate);

  // Cilindros de encastre (ocultos entre la cara plana y la etiqueta)
  for (const side of [-1, 1]) {
    const peg = own(new THREE.Mesh(new THREE.CylinderGeometry(1.5 * mm, 1.5 * mm, gap + 3 * mm, 16), plateMaterial));
    peg.rotation.x = Math.PI / 2;
    peg.position.set(cx + side * plateW * 0.33, plateY, zc - 1 * mm);
    group.add(peg);
  }

  // 4. Texto en relieve
  if (label.text.trim()) {
    const texture = labelTexture(label.text.trim(), filamentHex(label.textColor), plateW / plateH);
    const text = own(
      new THREE.Mesh(
        new THREE.PlaneGeometry(plateW * 0.97, plateH * 0.9),
        new THREE.MeshStandardMaterial({ map: texture, transparent: true, roughness: 0.45, polygonOffset: true, polygonOffsetFactor: -2 }),
      ),
    );
    text.userData.ownTexture = true;
    text.castShadow = false;
    text.position.set(cx, plateY, zc + gap + plateT + 0.05 * mm);
    group.add(text);
  }
  return group;
}

async function instantiate(model: Model3D, colors?: PartColors, label?: LabelValue) {
  const original = await loadModel(model.src);
  const instance = original.clone(true);
  const parts = new Map(model.parts.map((p) => [p.id, p]));
  instance.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const material = (o.material as THREE.MeshStandardMaterial).clone();
    const part = parts.get(material.name) ?? parts.get(o.name);
    const filament = part && (colors?.[part.id] ?? part.defaultColor);
    if (filament) material.color.set(filamentHex(filament));
    material.roughness = 0.7;
    o.material = material;
  });
  if (model.scale) instance.scale.set(...model.scale);
  const wrapper = new THREE.Group();
  wrapper.add(instance);
  if (label && model.labelMount) {
    const first = model.parts[0];
    wrapper.add(addLabel(instance, model.labelMount, (first && colors?.[first.id]) ?? first?.defaultColor ?? "blanco", label));
  }
  return wrapper;
}

async function photoCard(image: ProductImage) {
  const texture = await loadTexture(image.src);
  const { width = 1, height = 1 } = (texture.image as { width?: number; height?: number }) ?? {};
  const h = 0.055;
  const w = h * (width / height);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
  );
  mesh.position.y = h / 2;
  mesh.castShadow = true;
  mesh.userData.ownGeometry = true;
  const group = new THREE.Group();
  group.add(mesh);
  group.userData.isCard = true;
  return group;
}

type Footprint = { w: number; d: number };
type BaseShape = { hx: number; hz: number; cx: number; cz: number };

/**
 * Posiciones iniciales de cada lugar: en una fila si entran, si no en dos filas
 * (atrás / adelante) intercaladas.
 */
function defaultLayout(slots: number, base: BaseShape, footprints: Footprint[]): [number, number][] {
  const known = footprints.filter(Boolean);
  const avg = known.length ? known.reduce((n, f) => n + f.w, 0) / known.length : 0.05;
  const usable = base.hx * 2 * 0.82;
  const rows = slots <= 2 || slots * avg * 1.05 <= usable ? [slots] : [Math.ceil(slots / 2), Math.floor(slots / 2)];
  const positions: [number, number][] = [];
  rows.forEach((count, r) => {
    const z = rows.length === 1 ? 0 : (r === 0 ? -1 : 1) * base.hz * 0.38;
    const rowWidth = rows.length === 1 ? usable : usable * (count / rows[0]) * (r === 0 ? 1 : 0.9);
    for (let i = 0; i < count; i++) positions.push([base.cx - rowWidth / 2 + (rowWidth / count) * (i + 0.5), base.cz + z]);
  });
  return positions;
}

/** Mantiene una pieza dentro de una base ovalada tipo "estadio" (rectángulo con extremos redondos) */
function clampToBase(x: number, z: number, base: BaseShape, fp: Footprint = { w: 0.03, d: 0.03 }): [number, number] {
  const r = Math.max(fp.w, fp.d) / 2;
  const radius = Math.max(0, base.hz * 0.9 - r);
  const straight = Math.max(0, base.hx - base.hz);
  const lx = x - base.cx;
  const lz = z - base.cz;
  const ex = Math.sign(lx) * Math.min(Math.abs(lx), straight); // centro del extremo más cercano
  const dx = lx - ex;
  const len = Math.hypot(dx, lz);
  if (len <= radius) return [x, z];
  const k = radius / len;
  return [base.cx + ex + dx * k, base.cz + lz * k];
}

function disposeOwned(object: THREE.Object3D) {
  object.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      materials.forEach((m) => m.dispose());
      // Las geometrías de modelos están cacheadas; sólo se liberan las creadas acá
      if (o.userData.ownGeometry) o.geometry.dispose();
      if (o.userData.ownTexture) (o.material as THREE.MeshStandardMaterial).map?.dispose();
    }
  });
}

export class ViewerScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.005, 10);
  private controls: OrbitControls;
  private content = new THREE.Group();
  private ground: THREE.Mesh;
  private raf = 0;
  private needsRender = true;
  private version = 0;
  private fitKey = "";
  private pieceObjects: { key: string; object: THREE.Object3D }[] = [];
  private baseKey?: string;
  private selection?: THREE.Mesh;
  private resizeObserver: ResizeObserver;
  private baseShape?: BaseShape;
  private dragging?: { key: string; object: THREE.Object3D; offset: THREE.Vector3; plane: THREE.Plane; moved: boolean; pointerId: number };

  /** Se llama al soltar una pieza que se movió: posición [x, z] en metros */
  onMove?: (key: string, position: [number, number]) => void;

  onSelect?: (key: string) => void;
  onLoading?: (loading: boolean) => void;
  onError?: (error: unknown) => void;

  constructor(private container: HTMLElement, options: { background: string; accent: string }) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Neutral mantiene el tono real del filamento (ACES lo desatura)
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.shadowMap.enabled = true;
    this.renderer.localClippingEnabled = true; // para el corte frontal de bandejas con etiqueta
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";

    this.scene.background = new THREE.Color(options.background);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(0.15, 0.35, 0.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -0.25, right: 0.25, top: 0.25, bottom: -0.25, near: 0.01, far: 1 });
    sun.shadow.bias = -0.0005;
    this.scene.add(sun, new THREE.HemisphereLight(0xffffff, 0xd8c8c0, 0.35));

    this.ground = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShadowMaterial({ opacity: 0.12 }));
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground, this.content);

    this.selection = new THREE.Mesh(
      new THREE.RingGeometry(0.026, 0.029, 48),
      new THREE.MeshBasicMaterial({ color: options.accent, side: THREE.DoubleSide }),
    );
    this.selection.rotation.x = -Math.PI / 2;
    this.selection.visible = false;
    this.scene.add(this.selection);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.addEventListener("change", () => (this.needsRender = true));

    // En captura: así decidimos antes que OrbitControls si es un arrastre de pieza
    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown, { capture: true });
    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.addEventListener("pointercancel", this.handlePointerUp);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.loop();
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.needsRender = true;
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const moved = this.controls.update();
    if (moved || this.needsRender) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }
  };

  private raycaster(e: PointerEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    return ray;
  }

  /** Pieza (no la base) bajo el puntero */
  private pieceAt(e: PointerEvent) {
    const movable = this.pieceObjects.filter((p) => p.key !== this.baseKey);
    const hit = this.raycaster(e).intersectObjects(movable.map((p) => p.object), true)[0];
    if (!hit) return undefined;
    return movable.find((p) => {
      let found = false;
      p.object.traverse((o) => (found ||= o === hit.object));
      return found;
    });
  }

  private handlePointerDown = (e: PointerEvent) => {
    const piece = this.pieceAt(e);
    if (!piece) return;
    this.onSelect?.(piece.key);
    if (!this.baseShape) return; // sin base no se mueve nada
    // Arrastrar la pieza: OrbitControls no debe enterarse de este gesto
    e.stopImmediatePropagation();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -piece.object.position.y);
    const point = this.raycaster(e).ray.intersectPlane(plane, new THREE.Vector3());
    if (!point) return;
    this.dragging = { ...piece, plane, offset: piece.object.position.clone().sub(point), moved: false, pointerId: e.pointerId };
    this.renderer.domElement.setPointerCapture(e.pointerId);
    this.renderer.domElement.style.cursor = "grabbing";
  };

  private handlePointerMove = (e: PointerEvent) => {
    const drag = this.dragging;
    if (!drag || !this.baseShape || e.pointerId !== drag.pointerId) return;
    const point = this.raycaster(e).ray.intersectPlane(drag.plane, new THREE.Vector3());
    if (!point) return;
    point.add(drag.offset);
    const [x, z] = clampToBase(point.x, point.z, this.baseShape, drag.object.userData.footprint);
    const base = this.pieceObjects.find((p) => p.key === this.baseKey)?.object;
    drag.object.position.set(x, this.surfaceY(base, x, z), z);
    drag.moved = true;
    this.select(drag.key);
  };

  private handlePointerUp = (e: PointerEvent) => {
    const drag = this.dragging;
    if (!drag || e.pointerId !== drag.pointerId) return;
    this.dragging = undefined;
    this.renderer.domElement.releasePointerCapture(e.pointerId);
    this.renderer.domElement.style.cursor = "";
    if (drag.moved) this.onMove?.(drag.key, [drag.object.position.x, drag.object.position.z]);
  };

  /** Altura de la superficie de la base en (x, z), buscando desde arriba */
  private surfaceY(base: THREE.Object3D | undefined, x: number, z: number) {
    if (!base) return 0;
    const ray = new THREE.Raycaster(new THREE.Vector3(x, 1, z), new THREE.Vector3(0, -1, 0));
    return ray.intersectObject(base, true)[0]?.point.y ?? 0;
  }

  async update(spec: ViewerSpec, selectedKey?: string) {
    const version = ++this.version;
    this.onLoading?.(true);
    try {
      const base = spec.base ? await instantiate(spec.base.model, spec.base.colors, spec.base.label) : undefined;
      const pieces = await Promise.all(
        spec.pieces.map(async (p) => ({
          key: p.key,
          object: p.model ? await instantiate(p.model, p.colors, p.label) : p.image ? await photoCard(p.image) : undefined,
        })),
      );
      if (version !== this.version) return; // llegó una actualización más nueva

      const group = new THREE.Group();
      const placed: { key: string; object: THREE.Object3D }[] = [];

      if (base) {
        group.add(base);
        base.updateMatrixWorld(true);
        if (spec.base) placed.push({ key: spec.base.key, object: base });
      }
      const baseBox = base ? new THREE.Box3().setFromObject(base) : undefined;
      const shape: BaseShape | undefined = baseBox && {
        hx: (baseBox.max.x - baseBox.min.x) / 2,
        hz: (baseBox.max.z - baseBox.min.z) / 2,
        cx: (baseBox.max.x + baseBox.min.x) / 2,
        cz: (baseBox.max.z + baseBox.min.z) / 2,
      };
      // Cada pieza ocupa un lugar en la fila (aunque valga por más); los lugares libres se marcan
      const used = spec.pieces.reduce((n, p) => n + (p.slots ?? 1), 0);
      const slots = pieces.length + Math.max(0, (spec.slots ?? used) - used);
      const footprints = pieces.map((p) => {
        if (!p.object) return undefined as unknown as Footprint;
        const size = new THREE.Box3().setFromObject(p.object).getSize(new THREE.Vector3());
        return (p.object.userData.footprint = { w: size.x, d: size.z });
      });
      const layout = shape ? defaultLayout(slots, shape, footprints) : [];

      for (let i = 0; i < slots; i++) {
        const piece = pieces[i];
        const wanted = spec.pieces[i]?.position ?? layout[i] ?? [0, 0];
        const [x, z] = shape ? clampToBase(wanted[0], wanted[1], shape, footprints[i]) : [0, 0];
        const y = this.surfaceY(base, x, z);
        if (piece?.object) {
          piece.object.position.set(x, y, z);
          group.add(piece.object);
          placed.push({ key: piece.key, object: piece.object });
        } else if (base) {
          const marker = new THREE.Mesh(
            new THREE.RingGeometry(0.012, 0.016, 32),
            new THREE.MeshBasicMaterial({ color: 0x9a8a98, transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
          );
          marker.userData.ownGeometry = true;
          marker.rotation.x = -Math.PI / 2;
          marker.position.set(x, y + 0.0005, z);
          group.add(marker);
        }
      }

      this.scene.remove(this.content);
      disposeOwned(this.content);
      this.content = group;
      this.scene.add(group);
      this.pieceObjects = placed;
      this.baseKey = spec.base?.key;
      this.baseShape = shape;

      // Encuadrar la cámara cuando cambia lo que se ve (no al cambiar colores)
      const fitKey = `${spec.base?.model.src}|${spec.base?.model.scale}|${spec.slots ?? used}|${spec.base ? "" : spec.pieces[0]?.model?.src}`;
      if (fitKey !== this.fitKey) {
        this.fitKey = fitKey;
        this.frame(group);
      }
      this.select(selectedKey);
      this.needsRender = true;
    } catch (error) {
      if (version === this.version) this.onError?.(error);
    } finally {
      if (version === this.version) this.onLoading?.(false);
    }
  }

  select(key?: string) {
    if (!this.selection) return;
    const piece = this.pieceObjects.find((p) => p.key === key);
    // El anillo de selección sólo tiene sentido con piezas sobre una base
    if (!piece || !this.baseKey || piece.key === this.baseKey) {
      this.selection.visible = false;
    } else {
      const box = new THREE.Box3().setFromObject(piece.object);
      this.selection.position.set((box.min.x + box.max.x) / 2, box.min.y + 0.0008, (box.min.z + box.max.z) / 2);
      const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 / 0.026;
      this.selection.scale.setScalar(Math.max(0.5, r));
      this.selection.visible = true;
    }
    this.needsRender = true;
  }

  private frame(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    // Encajar tanto en vertical como en horizontal (pantallas angostas en móvil)
    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * this.camera.aspect);
    let distance = sphere.radius / Math.sin(Math.min(vFov, hFov) / 2);
    const direction = new THREE.Vector3(0.35, 0.55, 1).normalize();
    this.controls.target.copy(sphere.center);
    // Ajustar la distancia proyectando las esquinas de la caja: funciona igual para
    // piezas altas (figuras) y largas y planas (ej. el gato flexi)
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (i) => new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z),
    );
    for (let i = 0; i < 3; i++) {
      this.camera.position.copy(sphere.center).addScaledVector(direction, distance);
      this.camera.lookAt(sphere.center);
      this.camera.updateMatrixWorld();
      const extent = Math.max(...corners.map((c) => { const p = c.clone().project(this.camera); return Math.max(Math.abs(p.x), Math.abs(p.y)); }));
      distance *= extent / 0.88;
    }
    this.camera.position.copy(sphere.center).addScaledVector(direction, distance);
    this.camera.near = distance / 100;
    this.camera.far = distance * 10;
    this.camera.updateProjectionMatrix();
    this.controls.minDistance = distance * 0.35;
    this.controls.maxDistance = distance * 2.5;
    this.controls.update();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.version++;
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown, { capture: true });
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.removeEventListener("pointercancel", this.handlePointerUp);
    this.controls.dispose();
    disposeOwned(this.content);
    this.ground.geometry.dispose();
    (this.ground.material as THREE.Material).dispose();
    this.selection?.geometry.dispose();
    (this.selection?.material as THREE.Material | undefined)?.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
