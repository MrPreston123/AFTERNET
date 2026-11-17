'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { sceneState } from '@/lib/scene-state';

const R = 2;

// Major network hubs (lat, lon). Arcs between them are the "internet" that dies on scroll.
const HUBS: [number, number][] = [
  [40.7, -74], [37.8, -122.4], [34, -118.2], [41.9, -87.6], [25.8, -80.2], [43.7, -79.4], [19.4, -99.1],
  [-23.5, -46.6], [-34.6, -58.4], [4.7, -74.1], [51.5, -0.1], [48.9, 2.35], [52.5, 13.4], [40.4, -3.7],
  [38.7, -9.1], [59.3, 18.1], [55.8, 37.6], [41, 28.9], [30, 31.2], [6.5, 3.4], [-1.3, 36.8], [-26.2, 28],
  [25.2, 55.3], [19.1, 72.9], [28.6, 77.2], [13.1, 80.3], [1.35, 103.8], [13.8, 100.5], [22.3, 114.2],
  [31.2, 121.5], [39.9, 116.4], [37.6, 127], [35.7, 139.7], [-33.9, 151.2], [-37.8, 145], [-36.8, 174.8],
  [64.1, -21.9], [61.2, -149.9], [21.3, -157.9], [-12, -77],
];

function toVec(lat: number, lon: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
}

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function LandDots() {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uAlive: { value: 1 }, uDim: { value: 0 }, uPx: { value: 1 } },
        vertexShader: /* glsl */ `
          attribute float aCity; attribute float aRand;
          uniform float uTime; uniform float uAlive; uniform float uPx;
          varying float vFacing; varying float vCity; varying float vRand;
          void main(){
            vec4 mv = modelViewMatrix * vec4(position,1.0);
            vec3 n = normalize(normalMatrix * normalize(position));
            vFacing = dot(n, normalize(-mv.xyz));
            vCity = aCity; vRand = aRand;
            gl_Position = projectionMatrix * mv;
            float s = mix(2.2, 3.6, aCity * uAlive);
            gl_PointSize = s * uPx * (6.5 / -mv.z);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform float uAlive; uniform float uDim;
          varying float vFacing; varying float vCity; varying float vRand;
          void main(){
            if (vFacing < 0.0) discard;
            vec2 c = gl_PointCoord - 0.5; float d = length(c);
            if (d > 0.5) discard;
            float soft = smoothstep(0.5, 0.1, d);
            float edge = smoothstep(0.0, 0.35, vFacing);
            vec3 base = vec3(0.34) * (0.2 + 0.8 * edge);
            // city lights: flicker out as the network collapses
            float flick = step(0.5, fract(sin(floor(uTime*14.0 + vRand*40.0))*43758.5));
            float lit = vCity * clamp(uAlive * 1.6 - vRand * 0.6, 0.0, 1.0);
            lit *= mix(1.0, flick, smoothstep(0.85, 0.35, uAlive) * step(0.02, uAlive));
            vec3 col = mix(base, vec3(1.0, 0.1, 0.14) * 1.5, lit);
            float a = soft * (0.55 + 0.45 * lit) * (1.0 - uDim * 0.75);
            gl_FragColor = vec4(col * a, a);
          }`,
      }),
    [],
  );

  useEffect(() => {
    let dead = false;
    fetch('/data/land.json')
      .then((r) => r.json())
      .then((arr: number[]) => {
        if (dead) return;
        const n = arr.length / 2;
        const pos = new Float32Array(n * 3);
        const city = new Float32Array(n);
        const rand = new Float32Array(n);
        const rnd = seeded(7);
        const hubs = HUBS.map(([la, lo]) => toVec(la, lo));
        for (let i = 0; i < n; i++) {
          const v = toVec(arr[i * 2], arr[i * 2 + 1]);
          pos.set([v.x, v.y, v.z], i * 3);
          let near = 0;
          for (const h of hubs) {
            const dd = h.distanceTo(v);
            if (dd < 0.22) near = Math.max(near, 1 - dd / 0.22);
          }
          city[i] = near > 0 && rnd() < 0.35 + near * 0.6 ? 1 : rnd() < 0.012 ? 1 : 0;
          rand[i] = rnd();
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aCity', new THREE.BufferAttribute(city, 1));
        g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
        setGeo(g);
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, []);

  useFrame(({ clock, gl }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uAlive.value = 1 - sceneState.collapse;
    mat.uniforms.uDim.value = sceneState.dim;
    mat.uniforms.uPx.value = gl.getPixelRatio();
  });

  if (!geo) return null;
  return <points geometry={geo} material={mat} />;
}

function Arcs() {
  const { geo, mat } = useMemo(() => {
    const rnd = seeded(42);
    const SEG = 64;
    const pos: number[] = [];
    const t: number[] = [];
    const death: number[] = [];
    const seed: number[] = [];
    const pairs = 46;
    for (let k = 0; k < pairs; k++) {
      const a = HUBS[Math.floor(rnd() * HUBS.length)];
      let b = HUBS[Math.floor(rnd() * HUBS.length)];
      if (a === b) b = HUBS[(HUBS.indexOf(a) + 7) % HUBS.length];
      const va = toVec(a[0], a[1]).normalize();
      const vb = toVec(b[0], b[1]).normalize();
      const ang = va.angleTo(vb);
      const lift = Math.min(0.42, 0.1 + ang * 0.22);
      const d = 0.03 + rnd() * 0.92; // when in the collapse this link dies
      const s = rnd();
      let prev: THREE.Vector3 | null = null;
      for (let i = 0; i <= SEG; i++) {
        const f = i / SEG;
        const v = new THREE.Vector3().copy(va).lerp(vb, f).normalize();
        v.multiplyScalar(R * (1.005 + Math.sin(f * Math.PI) * lift));
        if (prev) {
          pos.push(prev.x, prev.y, prev.z, v.x, v.y, v.z);
          t.push((i - 1) / SEG, f);
          death.push(d, d);
          seed.push(s, s);
        }
        prev = v;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
    g.setAttribute('aDeath', new THREE.Float32BufferAttribute(death, 1));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCollapse: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float aT; attribute float aDeath; attribute float aSeed;
        varying float vT; varying float vDeath; varying float vSeed; varying float vFacing;
        void main(){
          vT = aT; vDeath = aDeath; vSeed = aSeed;
          vec4 mv = modelViewMatrix * vec4(position,1.0);
          vec3 n = normalize(normalMatrix * normalize(position));
          vFacing = dot(n, normalize(-mv.xyz));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uCollapse;
        varying float vT; varying float vDeath; varying float vSeed; varying float vFacing;
        void main(){
          float alive = smoothstep(vDeath + 0.001, vDeath - 0.035, uCollapse);
          // links stutter right before they die
          float near = smoothstep(vDeath - 0.09, vDeath, uCollapse);
          float stutter = step(0.45, fract(sin(floor(uTime * 22.0 + vSeed * 91.0)) * 43758.5));
          alive *= mix(1.0, stutter, near);
          float head = fract(uTime * (0.18 + vSeed * 0.22) + vSeed);
          float pulse = exp(-pow((vT - head) * 14.0, 2.0));
          float back = smoothstep(-0.25, 0.25, vFacing) * 0.75 + 0.25;
          vec3 col = mix(vec3(0.85, 0.05, 0.09), vec3(1.0, 0.85, 0.85), pulse);
          float a = (0.07 + pulse * 0.9) * alive * back;
          gl_FragColor = vec4(col * a, a);
        }`,
    });
    return { geo: g, mat: m };
  }, []);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime;
    mat.uniforms.uCollapse.value = sceneState.collapse;
  });

  return <lineSegments geometry={geo} material={mat} />;
}

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uBoost: { value: 1 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: /* glsl */ `
          uniform float uBoost; varying vec3 vN; varying vec3 vV;
          void main(){
            float f = pow(clamp(-dot(vN, vV) / 0.5, 0.0, 1.0), 3.0) * 0.55 * uBoost;
            gl_FragColor = vec4(vec3(1.0, 0.06, 0.1) * f, f);
          }`,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uBoost.value = 1 + sceneState.boot * 0.8 - sceneState.collapse * 0.3;
  });
  return (
    <mesh material={mat} scale={1.16}>
      <sphereGeometry args={[R, 64, 64]} />
    </mesh>
  );
}

function Core() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
        fragmentShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main(){
            float rim = pow(1.0 - max(dot(vN, vV), 0.0), 4.0);
            vec3 col = vec3(0.008) + vec3(0.8, 0.02, 0.05) * rim * 0.45;
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat}>
      <sphereGeometry args={[R * 0.985, 96, 96]} />
    </mesh>
  );
}

function Orbit() {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.08, 0.12), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.05;
    mat.opacity = 0.18 + sceneState.boot * 0.6;
  });
  return (
    <mesh ref={ref} material={mat} rotation={[Math.PI / 2.25, 0.2, 0]}>
      <torusGeometry args={[R * 1.42, 0.0035, 8, 256]} />
    </mesh>
  );
}

function Dust() {
  const geo = useMemo(() => {
    const rnd = seeded(3);
    const n = 1400;
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1).normalize().multiplyScalar(14 + rnd() * 20);
      p.set([v.x, v.y, v.z], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.004;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.05} color="#9a9a9a" transparent opacity={0.55} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function Rig() {
  const group = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const cur = useRef({ x: 0, y: -3.5, s: 1.32, px: 0, py: 0 });
  useFrame((_, dt) => {
    const c = cur.current;
    const k = 1 - Math.pow(0.0025, dt);
    c.x += (sceneState.x - c.x) * k;
    c.y += (sceneState.y - c.y) * k;
    c.s += (sceneState.scale - c.s) * k;
    c.px += (sceneState.pointerX - c.px) * k * 0.6;
    c.py += (sceneState.pointerY - c.py) * k * 0.6;
    if (group.current) {
      group.current.position.set(c.x, c.y, 0);
      group.current.scale.setScalar(c.s);
      group.current.rotation.x = 0.32 + c.py * 0.12;
      group.current.rotation.z = -0.08 + c.px * 0.04;
    }
    if (spin.current) spin.current.rotation.y += dt * (0.06 + (1 - sceneState.collapse) * 0.04) + c.px * dt * 0.1;
  });
  return (
    <group ref={group}>
      <group ref={spin} rotation={[0, 2.2, 0]}>
        <Core />
        <LandDots />
        <Arcs />
      </group>
      <Atmosphere />
      <Orbit />
    </group>
  );
}

export default function Scene() {
  const [lite, setLite] = useState(false);
  useEffect(() => {
    setLite(matchMedia('(max-width: 760px)').matches);
    const move = (e: PointerEvent) => {
      sceneState.pointerX = (e.clientX / innerWidth) * 2 - 1;
      sceneState.pointerY = (e.clientY / innerHeight) * 2 - 1;
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  }, []);
  return (
    <Canvas
      className="scene-canvas"
      dpr={[1, lite ? 1.5 : 1.75]}
      camera={{ position: [0, 0, 7.2], fov: 38 }}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false }}
      onCreated={({ gl }) => gl.setClearColor('#030303')}
    >
      <Dust />
      <Rig />
      <EffectComposer multisampling={0}>
        <Bloom intensity={lite ? 0.7 : 0.85} luminanceThreshold={0.28} luminanceSmoothing={0.25} mipmapBlur />
        <Noise opacity={0.06} premultiply />
        <Vignette eskil={false} offset={0.22} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
