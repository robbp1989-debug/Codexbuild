import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useApp } from '../../../context/AppContext';
import { ShiftBreakdown } from '../../../types';
import {
  Trophy,
  Volume2,
  VolumeX,
  Sparkles,
  RotateCcw,
  Eye,
  CheckCircle2,
  Scale,
  Compass,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';

export interface PrismFacet {
  id: string;
  title: string;
  lensType: 'alarm' | 'camera' | 'other' | 'dialectical';
  colorHex: number;
  tailwindBorder: string;
  tailwindBg: string;
  tailwindText: string;
  statement: string;
  reflectionPrompt: string;
  targetRotationY: number; // in radians
}

interface PerspectivePrism3DProps {
  onComplete?: () => void;
  scenario?: ShiftBreakdown | null;
}

type TextSize = 'normal' | 'large';

export const PerspectivePrism3D: React.FC<PerspectivePrism3DProps> = ({
  onComplete,
  scenario,
}) => {
  const { activeShift, playSoftSound, logPracticeSession, shifts } = useApp();
  const currentShift = scenario || activeShift || shifts[0] || null;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Settings
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // State
  const [activeFacetIndex, setActiveFacetIndex] = useState(0);
  const [alignedFacets, setAlignedFacets] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Dynamic Facets based on user's active shift
  const facets: PrismFacet[] = useMemo(() => {
    const obs = currentShift?.userEditedObservation || currentShift?.observation;
    const interp = currentShift?.userEditedInterpretation || currentShift?.interpretation;
    const rule = currentShift?.userEditedHypothesis || currentShift?.protective_rule_hypothesis;
    const persp = currentShift?.userEditedPerspective || currentShift?.updated_perspective;

    return [
      {
        id: 'f_alarm',
        title: '1. The Survival Alarm',
        lensType: 'alarm',
        colorHex: 0xf43f5e,
        tailwindBorder: 'border-rose-500',
        tailwindBg: 'bg-rose-950/60',
        tailwindText: 'text-rose-300',
        statement: interp
          ? `Worst-Case Assumption: "${interp}"`
          : 'Alarm Assumption: "They are deliberately cutting me off because I am fundamentally flawed."',
        reflectionPrompt: 'Notice that your survival instinct defaults to assuming danger to keep you safe.',
        targetRotationY: 0,
      },
      {
        id: 'f_camera',
        title: '2. The Camera Lens',
        lensType: 'camera',
        colorHex: 0x06b6d4,
        tailwindBorder: 'border-cyan-500',
        tailwindBg: 'bg-cyan-950/60',
        tailwindText: 'text-cyan-300',
        statement: obs
          ? `Objective Camera: "${obs}"`
          : 'Camera Footage: "Timestamp shows no reply for 14 hours. No words or body language visible."',
        reflectionPrompt: 'Separate verifiable sensory facts from the unverified narrative added by the brain.',
        targetRotationY: Math.PI / 2,
      },
      {
        id: 'f_other',
        title: '3. The Invisible Context',
        lensType: 'other',
        colorHex: 0xa855f7,
        tailwindBorder: 'border-purple-500',
        tailwindBg: 'bg-purple-950/60',
        tailwindText: 'text-purple-300',
        statement:
          'Their Private Reality: "They may be exhausted, swamped with work, dealing with family issues, or overwhelmed."',
        reflectionPrompt: 'Recognize that other people have entire universes of stress that have nothing to do with you.',
        targetRotationY: Math.PI,
      },
      {
        id: 'f_dialectical',
        title: '4. Both Can Be True',
        lensType: 'dialectical',
        colorHex: 0xf59e0b,
        tailwindBorder: 'border-amber-500',
        tailwindBg: 'bg-amber-950/60',
        tailwindText: 'text-amber-300',
        statement: persp
          ? `Integrated Synthesis: "${persp}"`
          : 'Dialectical Truth: "I can feel uncomfortable with the delay, AND they can still care about me."',
        reflectionPrompt: 'Holding two seemingly opposing truths at once creates immediate psychological peace.',
        targetRotationY: (3 * Math.PI) / 2,
      },
    ];
  }, [currentShift]);

  const activeFacet = facets[activeFacetIndex];

  const triggerSound = useCallback(
    (type: 'tap' | 'chime' | 'ground') => {
      if (!soundEnabled) return;
      playSoftSound(type);
    },
    [soundEnabled, playSoftSound]
  );

  // 3D Control ref
  const prismControlRef = useRef({
    targetRotationY: 0,
    currentRotationY: 0,
    currentColor: 0xf43f5e,
    isComplete: false,
  });

  // Switch active facet
  const selectFacet = useCallback(
    (index: number) => {
      triggerSound('tap');
      setActiveFacetIndex(index);
      const target = facets[index];
      prismControlRef.current.targetRotationY = target.targetRotationY;
      prismControlRef.current.currentColor = target.colorHex;

      // Mark aligned
      setAlignedFacets((prev) => {
        if (!prev.includes(target.id)) {
          triggerSound('chime');
          setScore((s) => s + 100);
          const next = [...prev, target.id];
          if (next.length === facets.length) {
            prismControlRef.current.isComplete = true;
            setTimeout(() => {
              triggerSound('chime');
              setIsCompleted(true);
            }, 1000);
          }
          return next;
        }
        return prev;
      });
    },
    [facets, triggerSound]
  );

  useEffect(() => {
    if (isCompleted) {
      logPracticeSession({
        gameId: 'perspective_prism_3d',
        score: score + 200,
        durationSeconds: 45,
        theme: currentShift?.protective_rule_hypothesis || '3D Perspective Prism Chamber',
      });
    }
  }, [isCompleted, score, logPracticeSession, currentShift]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    const clock = new THREE.Clock();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a16); // Cosmic sanctuary
    scene.fog = new THREE.FogExp2(0x0a0a16, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 3.8, 9.5);
    camera.lookAt(0, 1.2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const prismPointLight = new THREE.PointLight(0xf43f5e, 3, 20);
    prismPointLight.position.set(0, 1.8, 0);
    scene.add(prismPointLight);

    // Chamber Floor & Pedestal
    const altarGeo = new THREE.CylinderGeometry(2.5, 3.2, 0.6, 32);
    const altarMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      metalness: 0.6,
      roughness: 0.3,
    });
    const altar = new THREE.Mesh(altarGeo, altarMat);
    altar.position.y = -0.3;
    scene.add(altar);

    // Altar Rings
    const ringGeo = new THREE.RingGeometry(2.8, 3.4, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    scene.add(ring);

    // The Central Levitating Prism Gem
    const gemGeo = new THREE.OctahedronGeometry(1.6, 2);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xf43f5e,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.85,
      thickness: 1.2,
      ior: 1.6,
      transparent: true,
      opacity: 0.9,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.set(0, 1.8, 0);
    scene.add(gem);

    // Inner glowing core
    const coreGeo = new THREE.IcosahedronGeometry(0.6, 1);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    gem.add(core);

    // 4 Colored Receptor Pillars in 4 Cardinal Directions
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.2, 16);
    const pillarData = [
      { x: 0, z: -5.5, color: 0xf43f5e }, // North (Alarm)
      { x: 5.5, z: 0, color: 0x06b6d4 },  // East (Camera)
      { x: 0, z: 5.5, color: 0xa855f7 },  // South (Other)
      { x: -5.5, z: 0, color: 0xf59e0b }, // West (Dialectical)
    ];

    pillarData.forEach((p) => {
      const pMat = new THREE.MeshStandardMaterial({
        color: p.color,
        roughness: 0.2,
        metalness: 0.7,
      });
      const pillar = new THREE.Mesh(pillarGeo, pMat);
      pillar.position.set(p.x, 1.6, p.z);
      scene.add(pillar);

      // Receptor beacon orb
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshBasicMaterial({ color: p.color }));
      orb.position.set(p.x, 3.4, p.z);
      scene.add(orb);
    });

    // Refractive Beam Mesh
    const beamGeo = new THREE.CylinderGeometry(0.06, 0.12, 5.5, 8);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.8,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 1.8, -2.75);
    scene.add(beam);

    // Ambient floating stardust
    const starCount = 80;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 18;
      starPos[i * 3 + 1] = Math.random() * 8;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 0.15,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Animation Loop
    let currentY = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Smooth rotation towards target
      const targetY = prismControlRef.current.targetRotationY;
      currentY += (targetY - currentY) * Math.min(8.0 * delta, 1.0);
      gem.rotation.y = currentY;

      // Gentle levitation bob
      gem.position.y = 1.8 + Math.sin(elapsed * 2.5) * 0.15;
      gem.rotation.z = Math.cos(elapsed * 1.5) * 0.08;

      // Color transition
      const targetColor = new THREE.Color(prismControlRef.current.currentColor);
      gemMat.color.lerp(targetColor, 0.1);
      prismPointLight.color.lerp(targetColor, 0.1);
      beamMat.color.lerp(targetColor, 0.1);

      // Refractive beam follows active angle
      beam.rotation.y = currentY;
      const angle = currentY;
      beam.position.x = -Math.sin(angle) * 2.75;
      beam.position.z = -Math.cos(angle) * 2.75;

      // Pulse ring
      ring.rotation.z = elapsed * 0.2;

      // Rainbow corona if completed
      if (prismControlRef.current.isComplete) {
        const rainbowHue = (elapsed * 0.3) % 1.0;
        gemMat.color.setHSL(rainbowHue, 0.9, 0.6);
        prismPointLight.color.setHSL(rainbowHue, 0.9, 0.6);
        beamMat.color.setHSL(rainbowHue, 0.9, 0.6);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      id="perspective-prism-container"
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col"
    >
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER: Clear, outside 3D canvas so crystal view is never blocked */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-400 font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-purple-800">
              <Sparkles className="w-3.5 h-3.5" />
              3D PERSPECTIVE PRISM CHAMBER
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Aligned: {alignedFacets.length} / 4 Perspectives
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-purple-400 font-mono text-xs font-black">
              Clarity: {score} XP
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 text-[11px]"
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Current Active Perspective Card */}
        <div className="rounded-2xl bg-white p-4 sm:p-5 text-slate-900 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase font-black tracking-wider text-slate-500 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              {activeFacet.title}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
              {alignedFacets.includes(activeFacet.id) ? '✓ ALIGNED & INTEGRATED' : 'ALIGNING...'}
            </span>
          </div>

          <div
            className={`text-slate-900 tracking-tight leading-relaxed font-black ${
              textSize === 'large' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
            }`}
          >
            {activeFacet.statement}
          </div>

          <div className="text-xs text-slate-600 pt-1 border-t border-slate-100 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{activeFacet.reflectionPrompt}</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3D CRYSTAL CHAMBER VIEWPORT: 100% UNOBSTRUCTED */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] overflow-hidden bg-slate-950 cursor-pointer"
        onClick={() => {
          // Cycle to next facet on click
          selectFacet((activeFacetIndex + 1) % facets.length);
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 text-purple-300 font-mono text-xs font-bold backdrop-blur-md">
            Click chamber or tabs below to rotate 3D prism
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 4 CARDINAL PERSPECTIVE TABS */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {facets.map((facet, idx) => {
            const isSelected = activeFacetIndex === idx;
            const isDone = alignedFacets.includes(facet.id);

            return (
              <button
                key={facet.id}
                onClick={() => selectFacet(idx)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? `${facet.tailwindBorder} ${facet.tailwindBg} shadow-lg ring-2 ring-purple-500/40`
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
                  <span className={isSelected ? facet.tailwindText : 'text-slate-400'}>
                    Angle {idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-700" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-200 truncate">
                  {facet.title.split('. ')[1]}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Completion Modal */}
      {isCompleted && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-purple-500/50 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-purple-400 uppercase font-bold">
                Prism Spectrum Ignited
              </span>
              <h3 className="text-2xl font-black text-slate-100">
                All 4 Perspectives Unified!
              </h3>
              <p className="text-xs text-slate-400">
                You broke free from the single-track survival alarm. By integrating the camera facts and invisible context, psychological flexibility is achieved.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Clarity Earned</div>
              <div className="text-2xl font-black text-purple-400">+{score + 200} XP</div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setAlignedFacets([]);
                  setActiveFacetIndex(0);
                  setIsCompleted(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Inspect Again
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
                >
                  Return to Arcade
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
