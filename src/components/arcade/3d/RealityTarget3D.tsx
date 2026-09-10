import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { usePracticeSource } from '../../../context/usePracticeSource';
import * as THREE from 'three';
import { useApp } from '../../../context/AppContext';
import { ShiftBreakdown } from '../../../types';
import {
  Trophy,
  Volume2,
  VolumeX,
  Clock,
  Gauge,
  Sparkles,
  Crosshair,
  Zap,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface RealityTargetItem {
  id: string;
  type: 'fog' | 'fact';
  statement: string;
  category: string;
  explanation: string;
}

interface RealityTarget3DProps {
  onComplete?: () => void;
  scenario?: ShiftBreakdown | null;
}

type SpeedPace = 'relaxed' | 'normal' | 'brisk';
type TextSize = 'normal' | 'large' | 'huge';

export const RealityTarget3D: React.FC<RealityTarget3DProps> = ({
  onComplete,
  scenario,
}) => {
  const { activeShift, playSoftSound, logPracticeSession, shifts } = useApp();
  const currentShift = usePracticeSource(scenario);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Settings
  const [speedPace, setSpeedPace] = useState<SpeedPace>('relaxed');
  const [textSize, setTextSize] = useState<TextSize>('normal');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Gameplay State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isGameOver, setIsGameOver] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const [lastFeedback, setLastFeedback] = useState<{
    isPositive: boolean;
    text: string;
    show: boolean;
  } | null>(null);

  // Dynamic items derived from active scenario
  const items: RealityTargetItem[] = useMemo(() => {
    const list: RealityTargetItem[] = [];

    const obs = currentShift?.userEditedObservation || currentShift?.observation;
    const interp = currentShift?.userEditedInterpretation || currentShift?.interpretation;
    const rule = currentShift?.userEditedHypothesis || currentShift?.protective_rule_hypothesis;
    const persp = currentShift?.userEditedPerspective || currentShift?.updated_perspective;

    // Fact 1: Camera Fact from shift
    list.push({
      id: 'f1',
      type: 'fact',
      statement: obs ? `Camera: "${obs.slice(0, 60)}..."` : 'Camera: "No message received for 14 hours"',
      category: 'Objective Sensory Data',
      explanation: 'FACT DOCKED! An objective recording devices verifies this directly without guesswork.',
    });

    // Fog 1: Catastrophic Interpretation
    list.push({
      id: 'g1',
      type: 'fog',
      statement: interp ? `Story: "${interp.slice(0, 60)}..."` : 'Story: "They definitely realized I am annoying and want nothing to do with me"',
      category: 'Mind-Reading Fog',
      explanation: 'FOG VAPORIZED! Mind-reading projects internal fears into other people\'s unstated thoughts.',
    });

    // Fog 2: Protective Rigid Rule
    list.push({
      id: 'g2',
      type: 'fog',
      statement: rule ? `Rule: "${rule.slice(0, 60)}..."` : 'Rule: "If someone hesitates to answer, danger is guaranteed"',
      category: 'Cognitive Armor',
      explanation: 'FOG VAPORIZED! Protective rules formed in childhood often mistake ambiguity for guaranteed danger.',
    });

    // Fact 2: Heart rate & bodily feeling
    list.push({
      id: 'f2',
      type: 'fact',
      statement: 'Camera: "Heart rate increased to 92 BPM and stomach muscles clenched"',
      category: 'Physiological Truth',
      explanation: 'FACT DOCKED! Physical sensations are real neurological data, not imaginary.',
    });

    // Fact 3: Balanced Perspective
    list.push({
      id: 'f3',
      type: 'fact',
      statement: persp ? `Grounding: "${persp.slice(0, 60)}..."` : 'Grounding: "Silence means they are busy or tired, not angry"',
      category: 'Verifiable Probability',
      explanation: 'FACT DOCKED! Grounded probabilities reflect the reality that people have private lives.',
    });

    // Fog 3: All-or-Nothing Distortion
    list.push({
      id: 'g3',
      type: 'fog',
      statement: 'Story: "I completely ruined the entire dynamic and will never fix it"',
      category: 'Catastrophizing',
      explanation: 'FOG VAPORIZED! Catastrophic black-and-white thinking treats a single moment as permanent ruin.',
    });

    return list;
  }, [currentShift]);

  const currentItem = items[activeItemIndex % items.length];

  const triggerSound = useCallback(
    (type: 'tap' | 'chime' | 'ground') => {
      if (!soundEnabled) return;
      playSoftSound(type);
    },
    [soundEnabled, playSoftSound]
  );

  // Speed
  const baseSpeed = useMemo(() => {
    switch (speedPace) {
      case 'relaxed':
        return 8;
      case 'normal':
        return 12;
      case 'brisk':
        return 16;
    }
  }, [speedPace]);

  // Shared ref for 3D state
  const gameLoopRef = useRef({
    currentSpeed: baseSpeed,
    reducedMotion: false,
    itemZ: -70,
    currentItem: currentItem,
    isProcessing: false,
    fireLaser: null as ((mode: 'fog' | 'fact') => void) | null,
    updateTargetMesh: null as ((item: RealityTargetItem) => void) | null,
  });

  useEffect(() => {
    gameLoopRef.current.currentSpeed = baseSpeed;
  }, [baseSpeed]);

  useEffect(() => {
    gameLoopRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    gameLoopRef.current.currentItem = currentItem;
    if (gameLoopRef.current.updateTargetMesh) {
      gameLoopRef.current.updateTargetMesh(currentItem);
    }
  }, [currentItem]);

  // Player Fire Command
  const handleFire = useCallback(
    (mode: 'fog' | 'fact') => {
      if (isGameOver || gameLoopRef.current.isProcessing) return;

      triggerSound('tap');
      if (gameLoopRef.current.fireLaser) {
        gameLoopRef.current.fireLaser(mode);
      }

      gameLoopRef.current.isProcessing = true;
      const target = gameLoopRef.current.currentItem;
      const isCorrect = target.type === mode;

      if (isCorrect) {
        triggerSound('chime');
        setScore((s) => s + 100);
        setStreak((st) => st + 1);
        setLastFeedback({
          isPositive: true,
          text: target.explanation,
          show: true,
        });
      } else {
        triggerSound('ground');
        setStreak(0);
        setLastFeedback({
          isPositive: false,
          text: `Incorrect: This statement is ${target.type === 'fact' ? 'a Camera Fact' : 'Cognitive Fog'}. Notice the difference!`,
          show: true,
        });
      }

      setTimeout(() => {
        setActiveItemIndex((idx) => idx + 1);
        gameLoopRef.current.itemZ = -70;
        gameLoopRef.current.isProcessing = false;
      }, 1200);
    },
    [isGameOver, triggerSound]
  );

  // Keyboard controls: Left Arrow / A = Fog, Right Arrow / D = Fact
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleFire('fog');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleFire('fact');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFire, isGameOver]);

  // Timer
  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      logPracticeSession({
        gameId: 'reality_target_3d',
        score,
        durationSeconds: 60 - timeLeft,
        theme: currentShift?.protective_rule_hypothesis || '3D Fact vs Fog Blaster',
      });
    }
  }, [isGameOver, score, timeLeft, logPracticeSession, currentShift]);

  // Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    let animationFrameId: number;
    const clock = new THREE.Clock();

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Deep obsidian
    scene.fog = new THREE.FogExp2(0x020617, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    camera.position.set(0, 3.2, 8);
    camera.lookAt(0, 2.0, -30);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambient);

    const redLight = new THREE.PointLight(0xf43f5e, 2, 40);
    redLight.position.set(-8, 5, -15);
    scene.add(redLight);

    const cyanLight = new THREE.PointLight(0x60a5fa, 2, 40);
    cyanLight.position.set(8, 5, -15);
    scene.add(cyanLight);

    // Futuristic Target Dome Floor
    const gridHelper = new THREE.GridHelper(90, 45, 0x38bdf8, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Laser Cannon at player position
    const cannonGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.4, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const cannonBase = new THREE.Mesh(baseGeo, baseMat);
    cannonGroup.add(cannonBase);

    // Dual barrels
    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8, 8);
    barrelGeo.rotateX(Math.PI / 2);
    const leftBarrel = new THREE.Mesh(
      barrelGeo,
      new THREE.MeshStandardMaterial({ color: 0xf43f5e, metalness: 0.9 })
    );
    leftBarrel.position.set(-0.45, 0.35, -0.6);
    cannonGroup.add(leftBarrel);

    const rightBarrel = new THREE.Mesh(
      barrelGeo,
      new THREE.MeshStandardMaterial({ color: 0x60a5fa, metalness: 0.9 })
    );
    rightBarrel.position.set(0.45, 0.35, -0.6);
    cannonGroup.add(rightBarrel);

    cannonGroup.position.set(0, 0.2, 3.5);
    scene.add(cannonGroup);

    // Target Shield Geometry
    const targetGroup = new THREE.Group();

    const shieldGeo = new THREE.OctahedronGeometry(1.6, 1);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.2,
      metalness: 0.5,
      wireframe: false,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    targetGroup.add(shieldMesh);

    // Text Canvas on target
    const createTargetTexture = (title: string, sub: string, color: string) => {
      const can = document.createElement('canvas');
      can.width = 512;
      can.height = 256;
      const ctx = can.getContext('2d');
      if (ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, can.width, can.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.strokeRect(6, 6, can.width - 12, can.height - 12);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(title, can.width / 2, 70);

        ctx.font = 'normal 26px sans-serif';
        // Wrap text
        const words = sub.split(' ');
        let line = '';
        let y = 130;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 440 && n > 0) {
            ctx.fillText(line, can.width / 2, y);
            line = words[n] + ' ';
            y += 35;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, can.width / 2, y);
      }
      const tex = new THREE.CanvasTexture(can);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const labelMat = new THREE.MeshBasicMaterial({
      map: createTargetTexture('TARGET', 'Loading...', '#dc2626'),
      transparent: true,
    });
    const labelMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), labelMat);
    labelMesh.position.set(0, 2.4, 0);
    targetGroup.add(labelMesh);

    targetGroup.position.set(0, 2.4, -70);
    scene.add(targetGroup);

    // Laser Beam Mesh (created on fire)
    const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
    const laserMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 40, 8), laserMat);
    laserMesh.rotation.x = Math.PI / 2;
    laserMesh.position.set(0, 2.0, -10);
    scene.add(laserMesh);

    // Update target mesh
    const updateTargetMesh = (item: RealityTargetItem) => {
      const isFact = item.type === 'fact';
      shieldMat.color.setHex(isFact ? 0x60a5fa : 0xf43f5e);

      labelMat.map?.dispose();
      labelMat.map = createTargetTexture(
        isFact ? 'CAMERA FACT' : 'COGNITIVE FOG',
        item.category,
        isFact ? '#2563eb' : '#e11d48'
      );
      labelMat.needsUpdate = true;
    };

    gameLoopRef.current.updateTargetMesh = updateTargetMesh;
    updateTargetMesh(gameLoopRef.current.currentItem);

    // Fire laser animation
    gameLoopRef.current.fireLaser = (mode: 'fog' | 'fact') => {
      const isFact = mode === 'fact';
      laserMat.color.setHex(isFact ? 0x60a5fa : 0xf43f5e);
      laserMat.opacity = 1.0;
      laserMesh.position.x = isFact ? 0.45 : -0.45;

      // Recoil
      cannonGroup.position.z = 3.8;
      setTimeout(() => {
        cannonGroup.position.z = 3.5;
        laserMat.opacity = 0;
      }, 150);
    };

    // Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Loop
    let itemZ = -70;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Rotate target
      targetGroup.rotation.y += delta * 1.2;
      targetGroup.rotation.x = Math.sin(elapsed * 2) * 0.15;

      // Advance target towards player
      if (!gameLoopRef.current.isProcessing) {
        itemZ += delta * gameLoopRef.current.currentSpeed;
        targetGroup.position.z = itemZ;

        // If target breaches defense perimeter at z = 2.0 without action
        if (itemZ >= 2.0) {
          gameLoopRef.current.isProcessing = true;
          triggerSound('ground');
          setStreak(0);
          setLastFeedback({
            isPositive: false,
            text: `Time's up on this item! Don't let cognitive fog breach your mental boundary.`,
            show: true,
          });

          setTimeout(() => {
            setActiveItemIndex((idx) => idx + 1);
            itemZ = -70;
            gameLoopRef.current.isProcessing = false;
          }, 1200);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [triggerSound]);

  const statementSizeClass = useMemo(() => {
    switch (textSize) {
      case 'huge':
        return 'text-lg sm:text-xl font-black';
      case 'large':
        return 'text-base sm:text-lg font-extrabold';
      case 'normal':
      default:
        return 'text-sm sm:text-base font-bold';
    }
  }, [textSize]);

  return (
    <div
      id="reality-target-container"
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col"
    >
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER: Clear, outside 3D canvas so range is never obstructed */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-rose-950 text-rose-400 font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-rose-800">
              <Crosshair className="w-3.5 h-3.5" />
              3D FACT VS. FOG BLASTER
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Left: Vaporize Fog | Right: Dock Fact
            </span>
          </div>

          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold animate-pulse">
                🎯 {streak}x Direct Hits
              </div>
            )}
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">
                {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-rose-400 font-mono text-xs font-black">
              Score: {score}
            </div>
          </div>
        </div>

        {/* Incoming Statement Card */}
        <div className="rounded-2xl bg-white p-3.5 sm:p-4 text-slate-900 shadow-md flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500 mb-0.5">
              Incoming Target: {currentItem.category}
            </div>
            <div className={`text-slate-900 tracking-tight leading-relaxed ${statementSizeClass}`}>
              {currentItem.statement}
            </div>
          </div>

          {/* Aa text sizing */}
          <div className="shrink-0 flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTextSize('normal')}
              className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                textSize === 'normal'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Aa
            </button>
            <button
              onClick={() => setTextSize('large')}
              className={`px-2 py-1 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                textSize === 'large'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Aa+
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3D RANGE VIEWPORT: 100% UNOBSTRUCTED */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] overflow-hidden bg-slate-950"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Crosshair HUD overlays */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>FOG VAPORIZER</span>
          </span>
        </div>
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-600/50 text-cyan-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>REALITY VAULT</span>
          </span>
        </div>

        {/* Feedback Banner */}
        {lastFeedback?.show && (
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-30 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-bold backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              lastFeedback.isPositive
                ? 'bg-teal-950/95 border-teal-400 text-teal-100'
                : 'bg-rose-950/95 border-rose-400 text-rose-100'
            }`}
          >
            {lastFeedback.isPositive ? (
              <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="leading-snug">{lastFeedback.text}</span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FIRING TRIGGERS */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => handleFire('fog')}
            className="p-4 rounded-2xl bg-gradient-to-r from-rose-900/80 to-rose-950 border border-rose-500/60 hover:border-rose-400 text-rose-100 font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-rose-950/40"
          >
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <span>VAPORIZE FOG (Left / A)</span>
          </button>

          <button
            onClick={() => handleFire('fact')}
            className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950 to-cyan-900/80 border border-cyan-500/60 hover:border-cyan-400 text-cyan-100 font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-cyan-950/40"
          >
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>DOCK CAMERA FACT (Right / D)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold flex items-center gap-1 font-mono uppercase text-[10px]">
              <Gauge className="w-3.5 h-3.5 text-rose-400" />
              Target Speed:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setSpeedPace('relaxed')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'relaxed'
                    ? 'bg-rose-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Slow
              </button>
              <button
                onClick={() => setSpeedPace('normal')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'normal'
                    ? 'bg-rose-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setSpeedPace('brisk')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'brisk'
                    ? 'bg-rose-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Rapid
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1 text-[11px]"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sound on</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-rose-500/50 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-rose-400 uppercase font-bold">
                Target Drill Complete
              </span>
              <h3 className="text-2xl font-black text-slate-100">
                Cognitive Fog Cleared!
              </h3>
              <p className="text-xs text-slate-400">
                You sharpened your neural filter to quickly vaporize automatic stories while anchoring real, objective facts.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Score</div>
                <div className="text-2xl font-black text-rose-400">{score}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Best Streak</div>
                <div className="text-2xl font-black text-amber-400">{streak}x</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setTimeLeft(60);
                  setScore(0);
                  setStreak(0);
                  setActiveItemIndex(0);
                  setIsGameOver(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Play Again
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
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
