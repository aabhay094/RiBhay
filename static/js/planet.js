import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import Lenis from 'https://unpkg.com/lenis@1.3.23/dist/lenis.mjs';

const CFG = { R: 1.95, spin: 0.03, initRot: 3.31, tilt: 0.37, rim: '#9fd8ff', glow: '#3a6cff', bg: '#03060f',
  clouds: [[1.006, .55, .05, 0, 0], [1.03, .4, .11, .37, 1], [1.06, .35, .08, .71, 0]] };
// Local files (static/textures/*) are tried first - drop 8K images there for max sharpness.
const TEX = {
  day: ['/static/textures/earth_day.jpg', 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg', 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'],
  night: ['/static/textures/earth_night.jpg', 'https://unpkg.com/three-globe/example/img/earth-night.jpg', 'https://threejs.org/examples/textures/planets/earth_lights_2048.png'],
  spec: ['/static/textures/earth_water.png', 'https://unpkg.com/three-globe/example/img/earth-water.png', 'https://threejs.org/examples/textures/planets/earth_specular_2048.jpg'],
};
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const cvs = document.getElementById('planet');
const css = getComputedStyle(document.documentElement);
const rgbVar = n => new THREE.Color(...css.getPropertyValue(n).trim().split(/\s+/).map(v => +v / 255));
const C1 = rgbVar('--c1-rgb'), C2 = rgbVar('--c2-rgb');

const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*snoise(p);p*=2.03;a*=.5;}return s;}
float heightAt(vec3 n){return fbm(n*1.6+vec3(3.1))*.9+.35*snoise(n*5.0);}
`;
const VERT = `varying vec3 vP,vNW,vWP;varying vec2 vUv;
void main(){vP=position;vUv=uv;vNW=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vWP=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;

const TEX_FRAG = `varying vec3 vNW,vWP;varying vec2 vUv;
uniform vec3 uSun,uRim,uAcc;uniform sampler2D uDay,uNight,uSpec;uniform float uInv;
void main(){
  vec3 N=normalize(vNW),V=normalize(cameraPosition-vWP);
  float d=dot(N,uSun),day=smoothstep(-.1,.3,d);
  vec3 dc=pow(texture2D(uDay,vUv).rgb,vec3(1.05));
  vec3 nc=texture2D(uNight,vUv).rgb;
  float wm=texture2D(uSpec,vUv).r; wm=mix(wm,1.-wm,uInv);
  vec3 R=reflect(-uSun,N); float sp=pow(max(dot(R,V),0.),90.)*wm;
  vec3 col=dc*(.03+day*.95)+sp*day*vec3(.7,.85,1.)*.55;
  col+=nc*vec3(1.,.8,.5)*(1.-day)*1.5;
  col+=uAcc*.08*smoothstep(0.,.3,.3-abs(d));
  float rim=pow(1.-max(dot(N,V),0.),3.4);
  col+=uRim*rim*(.12+.45*day)*.5;
  gl_FragColor=vec4(col,1.);
}`;
const PROC_FRAG = SNOISE + `
varying vec3 vP,vNW,vWP; uniform vec3 uSun,uRim,uAcc;
void main(){
  vec3 n=normalize(vP); float h=heightAt(n);
  float land=smoothstep(.02,.07,h);
  float ice=smoothstep(.8,.92,abs(n.y)+.07*snoise(n*8.));
  vec3 N=normalize(vNW), V=normalize(cameraPosition-vWP);
  float d=dot(N,uSun), day=smoothstep(-.12,.25,d);
  vec3 ocean=mix(vec3(.01,.035,.13),vec3(.03,.2,.42),smoothstep(-.45,.02,h));
  vec3 ground=mix(vec3(.05,.24,.16),vec3(.42,.36,.22),smoothstep(.05,.55,h));
  ground=mix(ground,vec3(.86,.93,1.),ice);
  vec3 base=mix(ocean,ground,land);
  vec3 R=reflect(-uSun,N); float spec=pow(max(dot(R,V),0.),55.)*(1.-land)*.9;
  vec3 col=base*(.05+day*.9)+spec*day*vec3(.75,.88,1.);
  float cities=smoothstep(.58,.9,snoise(n*40.)*.5+.5)*smoothstep(.05,.4,fbm(n*4.)+.15)*land*(1.-ice);
  col+=vec3(1.,.78,.42)*cities*(1.-day)*2.2;
  col+=uAcc*.22*smoothstep(0.,.3,.3-abs(d));
  float rim=pow(1.-max(dot(N,V),0.),2.4);
  col+=uRim*rim*(.15+.4*day)*.5;
  gl_FragColor=vec4(col,1.);
}`;
const BAKE_FRAG = SNOISE + `varying vec2 vUv;
void main(){float ph=vUv.x*6.28318,th=(1.-vUv.y)*3.14159;
  vec3 n=vec3(-cos(ph)*sin(th),cos(th),sin(ph)*sin(th));
  float f=fbm(n*2.4+vec3(1.7))*.5+.5; f+=.18*snoise(n*9.)*smoothstep(.4,.6,f);
  float c=smoothstep(.46,.74,f); gl_FragColor=vec4(c,c,c,1.);}`;
const CLOUD_FRAG = `varying vec3 vNW,vWP;varying vec2 vUv;uniform sampler2D uC;uniform vec3 uSun;uniform float uOp,uOff,uFlip;
void main(){vec2 uv=vec2(vUv.x+uOff,mix(vUv.y,1.-vUv.y,uFlip));float c=texture2D(uC,uv).r;
  vec3 N=normalize(vNW);float day=smoothstep(-.12,.3,dot(N,uSun));
  gl_FragColor=vec4(vec3(.9,.95,1.)*(.05+day*.8),c*uOp*(.15+.85*day));}`;
const MARK_FRAG = `uniform float uT,uPh;uniform vec3 uCol;varying vec2 vUv;
void main(){float r=length(vUv-.5)*2.;float t=fract(uT*.45+uPh);
  float a=smoothstep(.14,0.,abs(r-t))*(1.-t)+smoothstep(.16,0.,r);gl_FragColor=vec4(uCol,a);}`;
const MARK_VERT = `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const FINAL = {
  uniforms: { tDiffuse: { value: null }, iTime: { value: 0 }, uA: { value: C2 }, uB: { value: C1 } },
  vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float iTime;uniform vec3 uA,uB;varying vec2 vUv;
  void main(){vec4 c=texture2D(tDiffuse,vUv);
    float f=smoothstep(.9,0.,length(vUv-vec2(0.,1.)))+.6*smoothstep(.9,0.,length(vUv-vec2(1.,0.)));
    c.rgb+=mix(uA,uB,vUv.y)*f*(.85+.15*sin(iTime*.7+vUv.x*4.))*.05;
    c.rgb*=1.-.5*smoothstep(.35,1.,length(vUv-.5)*1.25);
    c.rgb+=(fract(sin(dot(vUv*(fract(iTime)+1.),vec2(12.98,78.23)))*43758.5)-.5)*.01;
    gl_FragColor=vec4(c.rgb,1.);}`,
};

function loadTex(urls, aniso) {
  return new Promise((res, rej) => { const l = new THREE.TextureLoader(); l.setCrossOrigin('anonymous'); let i = 0;
    (function go() { l.load(urls[i], t => { t.anisotropy = aniso; res(t); }, undefined, () => ++i < urls.length ? go() : rej()); })(); });
}
function landSampler(img) {
  try {
    const W = 512, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data; let white = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] > 128) white++;
    const invert = white < W * H * .5;
    return { invert, isLand: n => { const th = Math.acos(Math.max(-1, Math.min(1, n.y)));
      let ph = Math.atan2(n.z, -n.x); if (ph < 0) ph += 6.28318;
      const px = Math.min(W - 1, ph / 6.28318 * W | 0), py = Math.min(H - 1, th / Math.PI * H | 0);
      const v = d[(py * W + px) * 4] > 128; return invert ? v : !v; } };
  } catch (e) { return null; }
}

async function init() {
  const mobile = innerWidth < 760;
  const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: false, powerPreference: 'high-performance' });
  let pr = Math.min(devicePixelRatio, mobile ? 1.5 : 2);
  renderer.setPixelRatio(pr);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(CFG.bg);
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .1, 200); camera.position.set(0, 0, 8);
  const sun = new THREE.Vector3(1, .35, .8).normalize();
  const aniso = renderer.capabilities.getMaxAnisotropy();

  let tex = null;
  try {
    const t = await Promise.race([Promise.all([loadTex(TEX.day, aniso), loadTex(TEX.night, aniso), loadTex(TEX.spec, aniso)]),
      new Promise((_, r) => setTimeout(r, 15000))]);
    tex = { day: t[0], night: t[1], spec: t[2] };
  } catch (e) { console.warn('Earth textures not loaded, using procedural earth'); }

  const group = new THREE.Group(); group.rotation.z = CFG.tilt; scene.add(group);
  let land = null;
  const mat = tex
    ? (land = landSampler(tex.spec.image), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: TEX_FRAG,
        uniforms: { uSun: { value: sun }, uRim: { value: new THREE.Color(CFG.rim) }, uAcc: { value: C2 }, uDay: { value: tex.day },
          uNight: { value: tex.night }, uSpec: { value: tex.spec }, uInv: { value: land && land.invert ? 1 : 0 } } }))
    : new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: PROC_FRAG,
        uniforms: { uSun: { value: sun }, uRim: { value: new THREE.Color(CFG.rim) }, uAcc: { value: C2 } } });
  const planet = new THREE.Mesh(new THREE.SphereGeometry(CFG.R, 160, 112), mat);
  planet.rotation.y = CFG.initRot; group.add(planet);

  // clouds: noise baked ONCE into a texture, then 3 cheap shells
  const bake = new THREE.WebGLRenderTarget(2048, 1024, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, wrapS: THREE.RepeatWrapping });
  const bs = new THREE.Scene(), bc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  bs.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ fragmentShader: BAKE_FRAG,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}` })));
  renderer.setRenderTarget(bake); renderer.render(bs, bc); renderer.setRenderTarget(null);
  bake.texture.anisotropy = aniso;
  const clouds = CFG.clouds.map(([h, op, spin, off, flip]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(CFG.R * h, 96, 64), new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: CLOUD_FRAG, transparent: true, depthWrite: false,
      uniforms: { uSun: { value: sun }, uOp: { value: op }, uC: { value: bake.texture }, uOff: { value: off }, uFlip: { value: flip } } }));
    m.userData.spin = spin; group.add(m); return m; });

  group.add(new THREE.Mesh(new THREE.SphereGeometry(CFG.R * 1.15, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uCol: { value: new THREE.Color(CFG.glow).lerp(C2, .2) } },
    vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 uCol;varying vec3 vN;void main(){float i=pow(max(0.,.62-dot(vN,vec3(0.,0.,1.))),3.6)*1.5;gl_FragColor=vec4(uCol*i,i);}` })));

  let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const sph = () => { const u = rnd() * 2 - 1, a = rnd() * 6.2832, s = Math.sqrt(1 - u * u); return new THREE.Vector3(s * Math.cos(a), u, s * Math.sin(a)); };

  const markMats = [];
  if (land) {   // golden radar pings, only on real land
    const geo = new THREE.CircleGeometry(.17, 32);
    for (let i = 0, tries = 0; i < 18 && tries < 600; tries++) {
      const n = sph(); if (Math.abs(n.y) > .85 || !land.isLand(n)) continue; i++;
      const m = new THREE.ShaderMaterial({ vertexShader: MARK_VERT, fragmentShader: MARK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { uT: { value: 0 }, uPh: { value: rnd() }, uCol: { value: new THREE.Color('#ffd27a') } } });
      const mesh = new THREE.Mesh(geo, m); mesh.position.copy(n).multiplyScalar(CFG.R * 1.004);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); planet.add(mesh); markMats.push(m);
    }
  }

  const motes = new THREE.Points((() => { const g = new THREE.BufferGeometry(), p = [];
    for (let i = 0; i < (mobile ? 120 : 260); i++) p.push(...sph().multiplyScalar(CFG.R * (1.15 + rnd() * .9)));
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); return g; })(),
    new THREE.PointsMaterial({ size: .03, color: '#9fc4ff', transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  group.add(motes);

  const sg = new THREE.BufferGeometry(), sp = [], ph = [], ss = [];
  for (let i = 0; i < (mobile ? 600 : 1400); i++) { sp.push(...sph().multiplyScalar(40 + rnd() * 50)); ph.push(rnd() * 6.28); ss.push(.6 + rnd() * 1.5); }
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1)); sg.setAttribute('aS', new THREE.Float32BufferAttribute(ss, 1));
  const starMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPx: { value: pr * 1.6 }, uCol: { value: new THREE.Color('#cfe0ff') } },
    vertexShader: `attribute float aPh,aS;uniform float uT,uPx;varying float vA;void main(){float tw=.55+.45*sin(uT*1.6+aPh);gl_PointSize=aS*uPx*(.7+tw*.6);vA=.3+tw*.6;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform vec3 uCol;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(uCol,smoothstep(.5,0.,d)*vA);}` });
  const stars = new THREE.Points(sg, starMat); scene.add(stars);

  const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { samples: mobile ? 0 : 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .3, .5, .85));
  const fin = new ShaderPass(FINAL); composer.addPass(fin);

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); });
  const mouse = { x: 0, y: 0 }; addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - .5; mouse.y = e.clientY / innerHeight - .5; });

  const lenis = reduce ? null : new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.5 });
  const KF = [[0, 0, -3.9, 1.7], [.12, 0, -2.3, 1.3], [.3, -2.6, -.2, 1], [.55, 2.6, 0, 1], [.8, 2.3, -.1, .95], [1, 2.0, -.2, .9]];
  const samp = p => { for (let i = 0; i < KF.length - 1; i++) { const a = KF[i], b = KF[i + 1]; if (p <= b[0]) { let t = (p - a[0]) / (b[0] - a[0]); t = t * t * (3 - 2 * t); return [1, 2, 3].map(k => a[k] + (b[k] - a[k]) * t); } } return KF[KF.length - 1].slice(1); };
  const cur = { x: 0, y: -3.9, s: 1.7, p: 0 };
  let lastRender = 0, lastT = 0, acc = 0, cnt = 0, warm = 0;

  function frame(t) {
    requestAnimationFrame(frame);
    lenis && lenis.raf(t);
    if (t - lastRender < 15) return;           // cap ~60fps (120Hz screens)
    lastRender = t;
    if (++warm > 90) { acc += t - lastT; if (++cnt === 60) { const avg = acc / cnt; acc = 0; cnt = 0;
      if (avg > 20 && pr > 1) { pr = Math.max(1, pr - .25); renderer.setPixelRatio(pr); composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight); starMat.uniforms.uPx.value = pr * 1.6; } } }
    lastT = t;
    const time = t / 1000, narrow = innerWidth < 760;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, Math.max(0, scrollY / max)), [x, y, s] = samp(p), k = reduce ? 1 : .08;
    cur.x += (x * (narrow ? .3 : 1) - cur.x) * k; cur.y += (y - cur.y) * k; cur.s += (s * (narrow ? .78 : 1) - cur.s) * k; cur.p += (p - cur.p) * k;
    group.position.set(cur.x, cur.y, 0); group.scale.setScalar(cur.s);
    group.rotation.x += ((mouse.y * .12) - group.rotation.x) * .05;
    planet.rotation.y = CFG.initRot + time * CFG.spin + cur.p * Math.PI * 1.6 + mouse.x * .25;
    clouds.forEach(c => c.rotation.y = planet.rotation.y + time * c.userData.spin);
    motes.rotation.y = time * .02; stars.rotation.y = time * .004 + cur.p * .5;
    starMat.uniforms.uT.value = time; fin.uniforms.iTime.value = time;
    markMats.forEach(m => m.uniforms.uT.value = time);
    composer.render();
  }
  requestAnimationFrame(frame);
  requestAnimationFrame(() => cvs.classList.add('on'));
}
init().catch(e => { console.warn('Planet disabled:', e); cvs.style.display = 'none'; });
