import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { Space } from "../../core/api-types";
import type { Cloud } from "../../point-cloud";
import { levelColor } from "./colors";

// Plain class, never put inside Vue reactivity: Vue proxies would wrap every three.js object.
// Renders on demand (on camera change or data change) instead of 60 fps, to save the iPad battery.
export class SpaceScene {
  private readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  private readonly controls: OrbitControls;
  private readonly boxes = new THREE.Group();
  private readonly raycaster = new THREE.Raycaster();
  private readonly resize = new ResizeObserver(() => this.fit());
  // One unit cube shared by all rooms; each mesh is scaled to its size.
  private readonly cube = new THREE.BoxGeometry(1, 1, 1);
  private readonly edges = new THREE.EdgesGeometry(this.cube);
  private readonly edgeMaterial = new THREE.LineBasicMaterial({
    color: "#33415c",
  });
  private readonly selectedMaterial = new THREE.MeshStandardMaterial({
    color: "#ffd400",
  });
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private selected: THREE.Mesh | null = null;
  private points: THREE.Points | null = null;

  constructor(private readonly container: HTMLElement) {
    // The data is Z-up (x, y on the floor, z = height); three.js defaults to Y-up.
    this.camera.up.set(0, 0, 1);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color("#eef1f5");
    this.scene.add(new THREE.HemisphereLight("#ffffff", "#8899aa", 2));
    this.scene.add(this.boxes);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener("change", () => this.render());
    container.appendChild(this.renderer.domElement);
    this.resize.observe(container);
  }

  setSpaces(spaces: Space[], levels: string[]): void {
    this.clearBoxes();
    for (const s of spaces) {
      const mesh = new THREE.Mesh(this.cube, this.materialFor(levels, s.level));
      mesh.scale.set(s.w, s.d, s.h);
      mesh.position.set(s.x + s.w / 2, s.y + s.d / 2, s.z + s.h / 2);
      mesh.userData.space = s;
      mesh.add(new THREE.LineSegments(this.edges, this.edgeMaterial));
      this.boxes.add(mesh);
    }
    this.frame();
  }

  /** Shows the scanned cloud (or removes it with null). The typed arrays are used as they are, no copy. */
  setCloud(cloud: Cloud | null): void {
    if (this.points) {
      this.points.geometry.dispose();
      (this.points.material as THREE.Material).dispose();
      this.scene.remove(this.points);
      this.points = null;
    }
    if (cloud) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(cloud.positions, 3),
      );
      // normalized: the GPU reads 0..255 as 0..1, so colors stay 1 byte each instead of a Float32 copy.
      geometry.setAttribute(
        "color",
        new THREE.BufferAttribute(cloud.colors, 3, true),
      );
      this.points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          size: 0.03,
          sizeAttenuation: true,
          vertexColors: true,
        }),
      );
      this.scene.add(this.points);
    }
    this.render();
  }

  showLevel(level: string | null): void {
    for (const mesh of this.meshes())
      mesh.visible = level === null || this.spaceOf(mesh).level === level;
    this.render();
  }

  select(id: string | null): void {
    if (this.selected) this.selected.material = this.selected.userData.base;
    this.selected =
      this.meshes().find((m) => this.spaceOf(m).id === id) ?? null;
    if (this.selected) {
      this.selected.userData.base = this.selected.material;
      this.selected.material = this.selectedMaterial;
    }
    this.render();
  }

  /** The visible room under a screen point, or null. */
  pick(clientX: number, clientY: number): Space | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    // The raycaster ignores `visible`, so hidden levels are filtered out here.
    const hit = this.raycaster.intersectObjects(
      this.meshes().filter((m) => m.visible),
      false,
    )[0];
    return hit ? this.spaceOf(hit.object as THREE.Mesh) : null;
  }

  get canvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  dispose(): void {
    this.resize.disconnect();
    this.controls.dispose();
    this.clearBoxes();
    this.setCloud(null);
    this.cube.dispose();
    this.edges.dispose();
    this.edgeMaterial.dispose();
    this.selectedMaterial.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private meshes(): THREE.Mesh[] {
    return this.boxes.children as THREE.Mesh[];
  }

  private spaceOf(mesh: THREE.Object3D): Space {
    return mesh.userData.space as Space;
  }

  private materialFor(levels: string[], level: string) {
    let m = this.materials.get(level);
    if (!m) {
      m = new THREE.MeshStandardMaterial({
        color: levelColor(levels, level),
        transparent: true,
        opacity: 0.75,
      });
      this.materials.set(level, m);
    }
    return m;
  }

  private clearBoxes(): void {
    this.boxes.clear();
    for (const m of this.materials.values()) m.dispose();
    this.materials.clear();
    this.selected = null;
  }

  /** Points the camera at the whole building. */
  private frame(): void {
    const box = new THREE.Box3().setFromObject(this.boxes);
    if (box.isEmpty()) return this.render();
    const center = box.getCenter(new THREE.Vector3());
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    this.camera.position
      .copy(center)
      .add(new THREE.Vector3(1, -1.4, 1).multiplyScalar(radius * 1.6));
    this.controls.target.copy(center);
    this.controls.update();
    this.render();
  }

  private fit(): void {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.render();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
