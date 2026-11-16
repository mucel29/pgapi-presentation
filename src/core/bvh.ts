import {intersectAABB,intersectTriangle,sub,cross,dot,type Vec3,type Bounds} from './math.ts';
export type Triangle=[Vec3,Vec3,Vec3];
export interface Candidate{axis:number;plane:number;cost:number;left:number;right:number;leftArea:number;rightArea:number;parentArea:number;leftBounds:Bounds;rightBounds:Bounds;}
export interface Node extends Bounds{id:number;depth:number;indices:number[];children?:[Node,Node];candidates:Candidate[];split?:Candidate;}
export interface TraceEvent{node:Node;status:'hit'|'miss'|'pruned'|'leaf';boxTests:number;triangleTests:number;closest:number;triangle:number;stack:number[];}
export function triangleBounds(t:Triangle):Bounds{return {min:[0,1,2].map(a=>Math.min(...t.map(p=>p[a]))) as Vec3,max:[0,1,2].map(a=>Math.max(...t.map(p=>p[a]))) as Vec3};}
function union(bounds:Bounds[],indices:number[]):Bounds{return {min:[0,1,2].map(a=>Math.min(...indices.map(i=>bounds[i].min[a]))) as Vec3,max:[0,1,2].map(a=>Math.max(...indices.map(i=>bounds[i].max[a]))) as Vec3};}
export function area(b:Bounds){const e=sub(b.max,b.min);return 2*(e[0]*e[1]+e[1]*e[2]+e[0]*e[2]);}
export function buildSAH(triangles:Triangle[],leafSize=4,bins=16):Node{
  const bounds=triangles.map(triangleBounds),centroids=bounds.map(b=>b.min.map((v,a)=>(v+b.max[a])/2));let id=0;
  function build(indices:number[],depth:number):Node{
    const node:Node={...union(bounds,indices),indices,depth,id:id++,candidates:[]};if(indices.length<=leafSize)return node;
    for(let axis=0;axis<3;axis++){
      const lo=Math.min(...indices.map(i=>centroids[i][axis])),hi=Math.max(...indices.map(i=>centroids[i][axis]));if(hi-lo<1e-8)continue;
      for(let bin=1;bin<bins;bin++){
        const plane=lo+(hi-lo)*bin/bins,left=indices.filter(i=>centroids[i][axis]<plane),right=indices.filter(i=>centroids[i][axis]>=plane);if(!left.length||!right.length)continue;
        const leftBounds=union(bounds,left),rightBounds=union(bounds,right),leftArea=area(leftBounds),rightArea=area(rightBounds),parentArea=Math.max(area(node),1e-12);
        const cost=1+(leftArea*left.length+rightArea*right.length)/parentArea;
        node.candidates.push({axis,plane,cost,left:left.length,right:right.length,leftArea,rightArea,parentArea,leftBounds,rightBounds});
      }
    }
    node.split=node.candidates.reduce<Candidate|undefined>((best,c)=>!best||c.cost<best.cost?c:best,undefined);
    if(!node.split)return node;
    const {axis,plane}=node.split,left=indices.filter(i=>centroids[i][axis]<plane),right=indices.filter(i=>centroids[i][axis]>=plane);
    node.children=[build(left,depth+1),build(right,depth+1)];return node;
  }return build(triangles.map((_,i)=>i),0);
}
export function traceTriangles(triangles:Triangle[],o:Vec3,d:Vec3){let closest=Infinity,triangle=-1;triangles.forEach((t,i)=>{const hit=intersectTriangle(o,d,...t);if(hit!==null&&hit<closest){closest=hit;triangle=i;}});return {closest,triangle,triangleTests:triangles.length};}
export function traceSAH(root:Node,triangles:Triangle[],o:Vec3,d:Vec3){
  let closest=Infinity,triangle=-1,boxTests=1,triangleTests=0;const events:TraceEvent[]=[];
  const stack:{node:Node;near:number|null}[]=[{node:root,near:intersectAABB(o,d,root.min,root.max)}];
  while(stack.length){
    const {node,near}=stack.pop()!;let status:TraceEvent['status']=near===null?'miss':near>closest?'pruned':node.children?'hit':'leaf';
    if(status==='hit'&&node.children){const children=node.children.map(child=>{boxTests++;return {node:child,near:intersectAABB(o,d,child.min,child.max)};});children.sort((a,b)=>(b.near??Infinity)-(a.near??Infinity));stack.push(...children);}
    if(status==='leaf')for(const i of node.indices){triangleTests++;const t=intersectTriangle(o,d,...triangles[i]);if(t!==null&&t<closest){closest=t;triangle=i;}}
    events.push({node,status,boxTests,triangleTests,closest,triangle,stack:stack.map(e=>e.node.id)});
  }return {events,closest,triangle,boxTests,triangleTests};
}
export function triangleNormal(t:Triangle):Vec3{const n=cross(sub(t[1],t[0]),sub(t[2],t[0])),l=Math.sqrt(dot(n,n));return n.map(v=>v/l) as Vec3;}
