import * as T from 'three';

const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
export const filterFragment=`
precision highp float;
varying vec2 vUv;
uniform sampler2D inputColor, normalDepth, albedo;
uniform vec2 resolution;
uniform float stepWidth, strength;
float luma(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
float kernel(int i){return i==0?6.:abs(i)==1?4.:1.;}
void main(){
  vec3 c0=texture2D(inputColor,vUv).rgb;
  vec4 nd0=texture2D(normalDepth,vUv);
  vec3 n0=normalize(nd0.xyz*2.-1.);
  vec3 a0=texture2D(albedo,vUv).rgb;
  if(nd0.w<=0.){gl_FragColor=vec4(c0,1.);return;}
  vec3 sum=vec3(0.);float weights=0.;
  float depthScale=max(.015,nd0.w*.015)*stepWidth;
  float colorScale=max(.12,luma(c0)*.5)*max(strength,.01);
  for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){
    vec2 uv=vUv+vec2(float(x),float(y))*stepWidth/resolution;
    if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))continue;
    vec4 ndq=texture2D(normalDepth,uv);if(ndq.w<=0.)continue;
    vec3 nq=normalize(ndq.xyz*2.-1.);
    vec3 aq=texture2D(albedo,uv).rgb,cq=texture2D(inputColor,uv).rgb;
    float wn=pow(max(dot(n0,nq),0.),32.);
    float wz=exp(-abs(nd0.w-ndq.w)/depthScale);
    float wa=exp(-length(a0-aq)*8.);
    float wl=exp(-abs(luma(c0)-luma(cq))/colorScale);
    float w=kernel(x)*kernel(y)*wn*wz*wa*wl;
    sum+=w*cq;weights+=w;
  }
  gl_FragColor=vec4(mix(c0,sum/max(weights,.00001),clamp(strength,0.,1.)),1.);
}`;
const displayFragment=`
varying vec2 vUv;uniform sampler2D rawColor,filteredColor,normalDepth,albedo;
uniform int mode;uniform float split;
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec3 raw=texture2D(rawColor,vUv).rgb,f=texture2D(filteredColor,vUv).rgb;
 vec3 c=mode==0?raw:mode==1?f:mode==2?(vUv.x<split?raw:f):abs(raw-f)*8.;
 if(mode==4)c=texture2D(normalDepth,vUv).xyz;
 else if(mode==5)c=vec3(1.-exp(-texture2D(normalDepth,vUv).w*.15));
 else if(mode==6)c=texture2D(albedo,vUv).rgb;
 else c=pow(aces(c),vec3(1./2.2));
 if(mode==2&&abs(vUv.x-split)<.0015)c=vec3(.97,.71,.42);
 gl_FragColor=vec4(c,1.);
}`;

export class Denoiser {
  targets:T.WebGLRenderTarget[];
  scene=new T.Scene();camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  filter:T.ShaderMaterial;display:T.ShaderMaterial;quad:T.Mesh;copy=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:'varying vec2 vUv; uniform sampler2D image; void main(){gl_FragColor=texture2D(image,vUv);}',uniforms:{image:{value:null}},depthTest:false,depthWrite:false});
  constructor(public renderer:T.WebGLRenderer,width=320,height=180) {
    this.targets=[0,1].map(()=>new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,depthBuffer:false,minFilter:T.NearestFilter,magFilter:T.NearestFilter}));
    this.filter=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:filterFragment,uniforms:{inputColor:{value:null},normalDepth:{value:null},albedo:{value:null},resolution:{value:new T.Vector2(width,height)},stepWidth:{value:1},strength:{value:1}},depthTest:false,depthWrite:false});
    this.display=new T.ShaderMaterial({vertexShader:vertex,fragmentShader:displayFragment,uniforms:{rawColor:{value:null},filteredColor:{value:null},normalDepth:{value:null},albedo:{value:null},mode:{value:1},split:{value:.5}},depthTest:false,depthWrite:false});
    this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.filter);this.scene.add(this.quad);
  }
  blit(texture:T.Texture){this.quad.material=this.copy;this.copy.uniforms.image.value=texture;this.renderer.setRenderTarget(null);this.renderer.render(this.scene,this.camera);}
  resize(w:number,h:number){this.targets.forEach(t=>t.setSize(w,h));this.filter.uniforms.resolution.value.set(w,h);}
  run(raw:T.Texture,normalDepth:T.Texture,albedo:T.Texture,strength=1,passes=3) {
    this.quad.material=this.filter;let source=raw;
    Object.assign(this.filter.uniforms.normalDepth,{value:normalDepth});this.filter.uniforms.albedo.value=albedo;this.filter.uniforms.strength.value=strength;
    for(let i=0;i<passes;i++){
      this.filter.uniforms.inputColor.value=source;this.filter.uniforms.stepWidth.value=2**i;
      const dest=this.targets[i%2];this.renderer.setRenderTarget(dest);this.renderer.render(this.scene,this.camera);source=dest.texture;
    }
    this.renderer.setRenderTarget(null);return source;
  }
  present(raw:T.Texture,filtered:T.Texture,normalDepth:T.Texture,albedo:T.Texture,mode=1,target:T.WebGLRenderTarget|null=null) {
    this.quad.material=this.display;const u=this.display.uniforms;u.rawColor.value=raw;u.filteredColor.value=filtered;u.normalDepth.value=normalDepth;u.albedo.value=albedo;u.mode.value=mode;
    this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);this.renderer.setRenderTarget(null);
  }
}

export class GeometryGuides {
  normalDepth:T.WebGLRenderTarget;albedo:T.WebGLRenderTarget;
  normalMaterial=new T.ShaderMaterial({
    vertexShader:`varying vec3 n;varying float z;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);z=-p.z;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`varying vec3 n;varying float z;void main(){gl_FragColor=vec4(normalize(n)*.5+.5,z);}`,
  });
  basicMaterials=new Map<T.Material,T.MeshBasicMaterial>();
  constructor(public renderer:T.WebGLRenderer,w=320,h=180){
    this.normalDepth=new T.WebGLRenderTarget(w,h,{type:T.FloatType,minFilter:T.NearestFilter,magFilter:T.NearestFilter});
    this.albedo=new T.WebGLRenderTarget(w,h,{minFilter:T.NearestFilter,magFilter:T.NearestFilter});
  }
  resize(w:number,h:number){this.normalDepth.setSize(w,h);this.albedo.setSize(w,h);}
  render(scene:T.Scene,camera:T.Camera){
    const bg=scene.background,fog=scene.fog,override=scene.overrideMaterial,color=this.renderer.getClearColor(new T.Color()),alpha=this.renderer.getClearAlpha();
    scene.background=null;scene.fog=null;this.renderer.setClearColor(0,0);scene.overrideMaterial=this.normalMaterial;
    this.renderer.setRenderTarget(this.normalDepth);this.renderer.clear();this.renderer.render(scene,camera);
    scene.overrideMaterial=null;const originals=new Map<T.Mesh,T.Material|T.Material[]>();
    scene.traverse(o=>{if(o instanceof T.Mesh){originals.set(o,o.material);const source=Array.isArray(o.material)?o.material[0]:o.material;
      let basic=this.basicMaterials.get(source);if(!basic){const s=source as T.MeshStandardMaterial;basic=new T.MeshBasicMaterial({color:s.color??0xffffff,map:s.map??null,side:source.side,toneMapped:false});this.basicMaterials.set(source,basic);}o.material=basic;}});
    this.renderer.setRenderTarget(this.albedo);this.renderer.clear();this.renderer.render(scene,camera);
    originals.forEach((m,o)=>o.material=m);scene.overrideMaterial=override;scene.background=bg;scene.fog=fog;this.renderer.setClearColor(color,alpha);this.renderer.setRenderTarget(null);
  }
}
