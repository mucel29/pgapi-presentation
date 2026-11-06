export type Vec3 = [number, number, number];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const normalize = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(...a) || 1));
export const reflect = (d: Vec3, n: Vec3) => sub(d, mul(n, 2 * dot(d, n)));
export function refract(d: Vec3, n: Vec3, eta: number): Vec3 | null {
  const cos = Math.min(-dot(d, n), 1);
  const perpendicular = mul(add(d, mul(n, cos)), eta);
  const parallelSquared = 1 - dot(perpendicular, perpendicular);
  return parallelSquared < 0 ? null : sub(perpendicular, mul(n, Math.sqrt(parallelSquared)));
}
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => { s += 0x6d2b79f5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function cosineHemisphere(u: number, v: number, normal: Vec3 = [0, 1, 0]): Vec3 {
  const n = normalize(normal);
  const tangent = normalize(cross(Math.abs(n[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0], n));
  const bitangent = cross(n, tangent);
  const r = Math.sqrt(u), phi = 2 * Math.PI * v;
  return add(add(mul(tangent, r * Math.cos(phi)), mul(bitangent, r * Math.sin(phi))), mul(n, Math.sqrt(1 - u)));
}
export function intersectSphere(origin: Vec3, direction: Vec3, center: Vec3, radius: number, tMin = 1e-4): number | null {
  const oc = sub(origin, center), a = dot(direction, direction), h = dot(oc, direction), c = dot(oc, oc) - radius * radius;
  const discriminant = h * h - a * c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const near = (-h - root) / a, far = (-h + root) / a;
  return near >= tMin ? near : far >= tMin ? far : null;
}
export function triangleIntersection(o:Vec3,d:Vec3,a:Vec3,b:Vec3,c:Vec3){
 const e1=sub(b,a),e2=sub(c,a),p=cross(d,e2),det=dot(e1,p);
 if(Math.abs(det)<1e-8)return null;
 const tv=sub(o,a),u=dot(tv,p)/det,q=cross(tv,e1),v=dot(d,q)/det,t=dot(e2,q)/det;
 return {det,u,v,t,point:add(o,mul(d,t)),hit:u>=0&&v>=0&&u+v<=1&&t>1e-4};
}
export function intersectTriangle(o:Vec3,d:Vec3,a:Vec3,b:Vec3,c:Vec3):number|null{
 const result=triangleIntersection(o,d,a,b,c);return result?.hit?result.t:null;
}
// Slab test: parallel axes are handled explicitly, avoiding 0 * Infinity → NaN.
export function intersectAABB(o: Vec3, d: Vec3, min: Vec3, max: Vec3, limit = Infinity): number | null {
  let near = 0, far = limit;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-10) { if (o[i] < min[i] || o[i] > max[i]) return null; continue; }
    const a = (min[i] - o[i]) / d[i], b = (max[i] - o[i]) / d[i];
    near = Math.max(near, Math.min(a, b)); far = Math.min(far, Math.max(a, b));
    if (near > far) return null;
  }
  return near;
}
export interface Bounds { min: Vec3; max: Vec3; }
export interface BVHNode extends Bounds { children?: [BVHNode, BVHNode]; indices: number[]; depth: number; id: number; }
export function buildBVH(bounds: Bounds[], leafSize = 2): BVHNode {
  let id = 0;
  function build(indices: number[], depth: number): BVHNode {
    const min: Vec3 = [Infinity, Infinity, Infinity], max: Vec3 = [-Infinity, -Infinity, -Infinity];
    for (const j of indices) for (let a = 0; a < 3; a++) { min[a] = Math.min(min[a], bounds[j].min[a]); max[a] = Math.max(max[a], bounds[j].max[a]); }
    const node: BVHNode = { min, max, indices, depth, id: id++ };
    if (indices.length <= leafSize) return node;
    const extent = sub(max, min), axis = extent.indexOf(Math.max(...extent));
    // Equal-count centroid split is used for the readable teaching tree. The production tracer uses SAH.
    const sorted = [...indices].sort((a, b) => (bounds[a].min[axis] + bounds[a].max[axis]) - (bounds[b].min[axis] + bounds[b].max[axis]));
    const mid = Math.floor(sorted.length / 2);
    node.children = [build(sorted.slice(0, mid), depth + 1), build(sorted.slice(mid), depth + 1)];
    return node;
  }
  return build(bounds.map((_, i) => i), 0);
}
export function visitBVH(root: BVHNode, o: Vec3, d: Vec3) {
  const events: { node: BVHNode; hit: boolean }[] = [], candidates: number[] = [];
  function visit(node: BVHNode) {
    const t = intersectAABB(o, d, node.min, node.max);
    events.push({ node, hit: t !== null });
    if (t === null) return;
    if (node.children) {
      const sorted = [...node.children].sort((a, b) => (intersectAABB(o, d, a.min, a.max) ?? Infinity) - (intersectAABB(o, d, b.min, b.max) ?? Infinity));
      sorted.forEach(visit);
    } else candidates.push(...node.indices);
  }
  visit(root); return { events, candidates };
}
export function historyKey(camera: readonly number[], settings: Record<string, number | string | boolean>) {
  return JSON.stringify([camera, Object.entries(settings).sort(([a], [b]) => a.localeCompare(b))]);
}
