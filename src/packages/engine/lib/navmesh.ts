import { Point2D, Polygon, Walkbox } from './types';

export function pointInPolygon(point: Point2D, vs: Polygon): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Polygon): Point2D {
  let cx = 0;
  let cy = 0;
  for (const pt of poly) {
    cx += pt[0];
    cy += pt[1];
  }
  return [cx / poly.length, cy / poly.length];
}

export function distance(p1: Point2D, p2: Point2D): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.hypot(dx, dy);
}

export class NavMesh {
  private walkboxes: Walkbox[] = [];
  private adjacencyList: Map<string, string[]> = new Map();

  constructor(boxes: Walkbox[]) {
    this.walkboxes = boxes;
    this.buildAdjacency();
  }

  public setWalkboxes(boxes: Walkbox[]): void {
    this.walkboxes = boxes;
    this.buildAdjacency();
  }

  public getWalkboxes(): Walkbox[] {
    return this.walkboxes;
  }

  private buildAdjacency(): void {
    this.adjacencyList.clear();
    for (const b of this.walkboxes) {
      this.adjacencyList.set(b.id, []);
    }

    for (let i = 0; i < this.walkboxes.length; i++) {
      for (let j = i + 1; j < this.walkboxes.length; j++) {
        const b1 = this.walkboxes[i];
        const b2 = this.walkboxes[j];
        if (this.boxesTouchOrOverlap(b1, b2)) {
          this.adjacencyList.get(b1.id)?.push(b2.id);
          this.adjacencyList.get(b2.id)?.push(b1.id);
        }
      }
    }
  }

  private boxesTouchOrOverlap(b1: Walkbox, b2: Walkbox): boolean {
    const c1 = polygonCentroid(b1.polygon);
    const c2 = polygonCentroid(b2.polygon);
    return distance(c1, c2) < 260;
  }

  public findBoxForPoint(point: Point2D): Walkbox | null {
    for (const box of this.walkboxes) {
      if (pointInPolygon(point, box.polygon)) {
        return box;
      }
    }
    return null;
  }

  public getScaleForPoint(point: Point2D, box?: Walkbox | null): number {
    const b = box || this.findBoxForPoint(point);
    if (!b) return 1.0;

    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of b.polygon) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }

    if (maxY === minY) return b.scaleMax;
    const factor = Math.max(0, Math.min(1, (point[1] - minY) / (maxY - minY)));
    return b.scaleMin + factor * (b.scaleMax - b.scaleMin);
  }

  public findPath(start: Point2D, target: Point2D): Point2D[] {
    const startBox = this.findBoxForPoint(start);
    const targetBox = this.findBoxForPoint(target);

    if (!startBox) {
      return [target];
    }
    if (!targetBox) {
      const clamped = this.clampToNearestWalkbox(target);
      return this.findPath(start, clamped);
    }
    if (startBox.id === targetBox.id) {
      return [start, target];
    }

    const queue: string[] = [startBox.id];
    const visited = new Set<string>([startBox.id]);
    const parent = new Map<string, string>();

    let found = false;
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetBox.id) {
        found = true;
        break;
      }
      const neighbors = this.adjacencyList.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          parent.set(n, current);
          queue.push(n);
        }
      }
    }

    if (!found) {
      return [start, target];
    }

    const pathBoxes: Walkbox[] = [];
    let curId: string | undefined = targetBox.id;
    while (curId) {
      const box = this.walkboxes.find((b) => b.id === curId);
      if (box) pathBoxes.unshift(box);
      curId = parent.get(curId);
    }

    const waypoints: Point2D[] = [start];
    for (let i = 0; i < pathBoxes.length - 1; i++) {
      const c1 = polygonCentroid(pathBoxes[i].polygon);
      const c2 = polygonCentroid(pathBoxes[i + 1].polygon);
      waypoints.push([(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2]);
    }
    waypoints.push(target);
    return waypoints;
  }

  public clampToNearestWalkbox(point: Point2D): Point2D {
    for (const b of this.walkboxes) {
      if (pointInPolygon(point, b.polygon)) {
        return point;
      }
    }

    let nearest: Point2D = point;
    let minDist = Infinity;

    for (const b of this.walkboxes) {
      const poly = b.polygon;
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];
        const dx = p2[0] - p1[0];
        const dy = p2[1] - p1[1];
        const lenSq = dx * dx + dy * dy;

        let proj: Point2D;
        if (lenSq === 0) {
          proj = p1;
        } else {
          let t = ((point[0] - p1[0]) * dx + (point[1] - p1[1]) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          proj = [p1[0] + t * dx, p1[1] + t * dy];
        }

        const d = distance(point, proj);
        if (d < minDist) {
          minDist = d;
          nearest = proj;
        }
      }
    }
    return nearest;
  }
}
