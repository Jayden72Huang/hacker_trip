'use client';

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Environment,
  ContactShadows,
  Float,
} from '@react-three/drei';
import * as THREE from 'three';

const CARD_W = 3.18;
const CARD_H = 2.0;
const CARD_D = 0.06;
const CARD_R = 0.08;

function CardFaceTexture(props: { data: CardTextureData }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 646;
    const ctx = c.getContext('2d')!;
    drawCardFace(ctx, c.width, c.height, props.data);
    return c;
  }, [props.data]);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 16;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  return texture;
}

function CardBackTexture() {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 646;
    const ctx = c.getContext('2d')!;
    drawCardBack(ctx, c.width, c.height);
    return c;
  }, []);

  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.anisotropy = 16;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  return texture;
}

function Card({ data }: { data: CardTextureData }) {
  const meshRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const frontTex = CardFaceTexture({ data });
  const backTex = CardBackTexture();

  const frontMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    map: frontTex,
    metalness: 0.7,
    roughness: 0.25,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    reflectivity: 0.9,
    envMapIntensity: 1.2,
  }), [frontTex]);

  const backMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    map: backTex,
    metalness: 0.85,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    envMapIntensity: 1.5,
  }), [backTex]);

  const edgeMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1a1a2e'),
    metalness: 0.9,
    roughness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    envMapIntensity: 1.8,
  }), []);

  const scale = Math.min(viewport.width / 4.5, 1.0);

  useFrame(({ pointer }) => {
    if (!meshRef.current) return;
    const targetY = pointer.x * 0.3;
    const targetX = -pointer.y * 0.15;
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.05;
    meshRef.current.rotation.x += (targetX - meshRef.current.rotation.x) * 0.05;
  });

  const frontGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);
    return geo;
  }, []);

  const backGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);
    return geo;
  }, []);

  const edgeShape = useMemo(() => {
    const shape = new THREE.Shape();
    const w = CARD_W / 2;
    const h = CARD_H / 2;
    const r = CARD_R;
    shape.moveTo(-w + r, -h);
    shape.lineTo(w - r, -h);
    shape.quadraticCurveTo(w, -h, w, -h + r);
    shape.lineTo(w, h - r);
    shape.quadraticCurveTo(w, h, w - r, h);
    shape.lineTo(-w + r, h);
    shape.quadraticCurveTo(-w, h, -w, h - r);
    shape.lineTo(-w, -h + r);
    shape.quadraticCurveTo(-w, -h, -w + r, -h);
    return shape;
  }, []);

  const edgeGeo = useMemo(() => {
    const geo = new THREE.ExtrudeGeometry(edgeShape, {
      depth: CARD_D,
      bevelEnabled: false,
    });
    geo.computeVertexNormals();
    return geo;
  }, [edgeShape]);

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={meshRef} scale={scale}>
        {/* Front face */}
        <mesh geometry={frontGeo} material={frontMat} position={[0, 0, CARD_D / 2 + 0.001]} />
        {/* Back face */}
        <mesh geometry={backGeo} material={backMat} position={[0, 0, -CARD_D / 2 - 0.001]} rotation={[0, Math.PI, 0]} />
        {/* Edge body */}
        <mesh geometry={edgeGeo} material={edgeMat} position={[0, 0, -CARD_D / 2]} />
      </group>
    </Float>
  );
}

export interface CardTextureData {
  name: string;
  username: string;
  level: number;
  title: string;
  hackathons: number;
  teams: number;
  streak: number;
  matchScore: number;
  skills: string[];
  projects: string[];
  damc: { D: number; A: number; M: number; C: number } | null;
  totalTokens: string;
  serialNo: string;
}

function drawCardFace(ctx: CanvasRenderingContext2D, w: number, h: number, data: CardTextureData) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.3, '#141428');
  grad.addColorStop(0.6, '#0f0f22');
  grad.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let x = 0; x < w; x += 3) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.015})`;
    ctx.fillRect(x, 0, 1, h);
  }

  for (let y = 0; y < h; y += 4) {
    ctx.fillStyle = 'rgba(255,255,255,0.008)';
    ctx.fillRect(0, y, w, 1);
  }

  const shineGrad = ctx.createLinearGradient(0, 0, w, h * 0.6);
  shineGrad.addColorStop(0, 'transparent');
  shineGrad.addColorStop(0.35, 'transparent');
  shineGrad.addColorStop(0.45, 'rgba(124,93,255,0.04)');
  shineGrad.addColorStop(0.48, 'rgba(77,225,255,0.06)');
  shineGrad.addColorStop(0.55, 'rgba(124,93,255,0.03)');
  shineGrad.addColorStop(0.65, 'transparent');
  shineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = shineGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(124,93,255,0.15)';
  ctx.lineWidth = 1.5;
  drawCornerBracket(ctx, 24, 24, 16, false, false);
  drawCornerBracket(ctx, w - 24, 24, 16, true, false);
  drawCornerBracket(ctx, 24, h - 24, 16, false, true);
  ctx.strokeStyle = 'rgba(77,225,255,0.15)';
  drawCornerBracket(ctx, w - 24, h - 24, 16, true, true);

  ctx.font = '600 11px "SF Mono", "Fira Code", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.letterSpacing = '3px';
  ctx.fillText('VIBERCARD', 44, 52);

  ctx.fillStyle = '#7c5dff';
  ctx.beginPath();
  ctx.arc(w - 64, 44, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = '#7c5dff';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = '600 11px "SF Mono", monospace';
  ctx.fillStyle = '#7c5dff';
  ctx.fillText(`Lv.${data.level}`, w - 54, 48);

  const sepY = 64;
  const sepGrad = ctx.createLinearGradient(44, sepY, w - 44, sepY);
  sepGrad.addColorStop(0, 'transparent');
  sepGrad.addColorStop(0.3, 'rgba(124,93,255,0.2)');
  sepGrad.addColorStop(0.7, 'rgba(77,225,255,0.15)');
  sepGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = sepGrad;
  ctx.fillRect(44, sepY, w - 88, 1);

  const avatarX = 44;
  const avatarY = 80;
  const avatarSize = 52;
  const avatarGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
  avatarGrad.addColorStop(0, '#7c5dff');
  avatarGrad.addColorStop(1, '#c759ff');
  roundRect(ctx, avatarX, avatarY, avatarSize, avatarSize, 10);
  ctx.fillStyle = avatarGrad;
  ctx.fill();

  ctx.font = 'bold 22px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText((data.name || '?')[0], avatarX + 16, avatarY + 36);

  ctx.font = 'bold 20px "Inter", sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText(data.name, avatarX + avatarSize + 14, avatarY + 22);

  ctx.font = '500 13px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(`@${data.username}`, avatarX + avatarSize + 14, avatarY + 42);

  const badgeText = data.title;
  ctx.font = '700 9px "SF Mono", monospace';
  const badgeW = ctx.measureText(badgeText).width + 16;
  const badgeX = w - 44 - badgeW;
  const badgeY = avatarY + 10;

  ctx.strokeStyle = `${data.level >= 60 ? '#4de1ff' : '#7c5dff'}40`;
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, 22, 4);
  ctx.stroke();
  ctx.fillStyle = `${data.level >= 60 ? '#4de1ff' : '#7c5dff'}15`;
  ctx.fill();

  ctx.fillStyle = data.level >= 60 ? '#4de1ff' : '#7c5dff';
  ctx.fillText(badgeText, badgeX + 8, badgeY + 15);

  const statsY = 155;
  const statsW = (w - 88 - 12) / 4;
  const statsLabels = ['黑客松', '组队', '连胜', '匹配分'];
  const statsValues = [data.hackathons, data.teams, data.streak, data.matchScore];
  const statsColors = ['#7c5dff', '#c759ff', '#4de1ff', '#ededed'];

  for (let i = 0; i < 4; i++) {
    const sx = 44 + i * (statsW + 4);
    roundRect(ctx, sx, statsY, statsW, 56, 6);
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(124,93,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 22px "SF Mono", monospace';
    ctx.fillStyle = statsColors[i];
    ctx.textAlign = 'center';
    ctx.fillText(String(statsValues[i]), sx + statsW / 2, statsY + 28);

    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText(statsLabels[i], sx + statsW / 2, statsY + 46);
    ctx.textAlign = 'left';
  }

  if (data.damc) {
    const damcY = 230;
    ctx.font = '700 9px "SF Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillText('DAMC', 44, damcY);

    const letters = ['D', 'A', 'M', 'C'];
    const values = [data.damc.D, data.damc.A, data.damc.M, data.damc.C];
    const colors = ['#7c5dff', '#c759ff', '#4de1ff', '#ff6b9d'];
    const barW = (w - 88 - 24) / 4;

    for (let i = 0; i < 4; i++) {
      const bx = 44 + i * (barW + 8);
      const by = damcY + 10;

      ctx.font = '700 10px "SF Mono", monospace';
      ctx.fillStyle = colors[i];
      ctx.fillText(letters[i], bx, by + 10);

      ctx.font = '500 9px "SF Mono", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.textAlign = 'right';
      ctx.fillText(String(values[i]), bx + barW, by + 10);
      ctx.textAlign = 'left';

      roundRect(ctx, bx, by + 16, barW, 6, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();

      const fillW = (values[i] / 100) * barW;
      if (fillW > 0) {
        const barGrad = ctx.createLinearGradient(bx, 0, bx + fillW, 0);
        barGrad.addColorStop(0, colors[i]);
        barGrad.addColorStop(1, colors[i] + '66');
        roundRect(ctx, bx, by + 16, fillW, 6, 3);
        ctx.fillStyle = barGrad;
        ctx.fill();

        ctx.shadowColor = colors[i];
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  const tokenY = data.damc ? 285 : 230;
  ctx.font = '700 9px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('TOKENS CONSUMED', 44, tokenY);

  ctx.font = 'bold 28px "SF Mono", monospace';
  ctx.fillStyle = '#4de1ff';
  ctx.shadowColor = '#4de1ff';
  ctx.shadowBlur = 12;
  ctx.fillText(data.totalTokens, 44, tokenY + 34);
  ctx.shadowBlur = 0;

  const skillsY = tokenY + 55;
  ctx.font = '700 9px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText('SKILLS', 44, skillsY);

  let skillX = 44;
  const maxSkillX = w - 44;
  for (const skill of data.skills.slice(0, 8)) {
    ctx.font = '500 11px "SF Mono", monospace';
    const tw = ctx.measureText(skill).width + 14;
    if (skillX + tw > maxSkillX) break;

    roundRect(ctx, skillX, skillsY + 6, tw, 22, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(skill, skillX + 7, skillsY + 21);
    skillX += tw + 6;
  }

  const footY = h - 36;
  const footSepGrad = ctx.createLinearGradient(44, footY, w - 44, footY);
  footSepGrad.addColorStop(0, 'rgba(124,93,255,0.08)');
  footSepGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = footSepGrad;
  ctx.fillRect(44, footY, w - 88, 1);

  if (data.projects.length > 0) {
    let projX = 44;
    ctx.font = '500 9px "SF Mono", monospace';
    for (const p of data.projects.slice(0, 3)) {
      const pw = ctx.measureText(p).width + 12;
      roundRect(ctx, projX, footY + 8, pw, 18, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText(p, projX + 6, footY + 21);
      projX += pw + 4;
    }
  }

  ctx.font = '500 10px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.textAlign = 'right';
  ctx.fillText(data.serialNo, w - 44, footY + 21);
  ctx.textAlign = 'left';
}

function drawCardBack(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0e0e1a');
  grad.addColorStop(0.5, '#0a0a16');
  grad.addColorStop(1, '#08081a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (let x = 0; x < w; x += 3) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.01})`;
    ctx.fillRect(x, 0, 1, h);
  }

  ctx.fillStyle = 'rgba(124,93,255,0.04)';
  ctx.fillRect(0, h * 0.3, w, h * 0.08);

  ctx.strokeStyle = 'rgba(124,93,255,0.08)';
  ctx.lineWidth = 1;
  drawCornerBracket(ctx, 40, 40, 20, false, false);
  drawCornerBracket(ctx, w - 40, 40, 20, true, false);
  drawCornerBracket(ctx, 40, h - 40, 20, false, true);
  drawCornerBracket(ctx, w - 40, h - 40, 20, true, true);

  ctx.font = '700 14px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(124,93,255,0.12)';
  ctx.textAlign = 'center';
  ctx.fillText('VIBERCARD', w / 2, h / 2 - 10);

  ctx.font = '500 10px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillText('hackertrip.dev', w / 2, h / 2 + 10);

  ctx.font = '500 9px "SF Mono", monospace';
  ctx.fillStyle = 'rgba(77,225,255,0.08)';
  ctx.fillText('TITANIUM EDITION', w / 2, h * 0.75);
  ctx.textAlign = 'left';
}

function drawCornerBracket(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, flipX: boolean, flipY: boolean) {
  ctx.beginPath();
  const dx = flipX ? -1 : 1;
  const dy = flipY ? -1 : 1;
  ctx.moveTo(x, y + dy * size);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * size, y);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ViberCard3DScene({ data }: { data: CardTextureData }) {
  return (
    <div className="w-full h-[600px] relative">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 35 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.3} />
          <spotLight
            position={[5, 5, 5]}
            angle={0.4}
            penumbra={0.8}
            intensity={1.5}
            color="#e8e0ff"
            castShadow
          />
          <spotLight
            position={[-4, 3, 3]}
            angle={0.5}
            penumbra={1}
            intensity={0.8}
            color="#4de1ff"
          />
          <pointLight position={[0, -3, 2]} intensity={0.3} color="#c759ff" />

          <Card data={data} />

          <ContactShadows
            position={[0, -1.4, 0]}
            opacity={0.4}
            scale={6}
            blur={2.5}
            far={4}
            color="#7c5dff"
          />

          <Environment preset="city" environmentIntensity={0.6} />
        </Suspense>
      </Canvas>
    </div>
  );
}
