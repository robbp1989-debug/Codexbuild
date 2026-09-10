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
  Waves,
  ShieldAlert,
  Anchor,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export interface UrgeSurferItem {
  id: string;
  type: 'impulse' | 'anchor';
  text: string;
  category: string;
  explanation: string;
}

interface UrgeSurfer3DProps {
  onComplete?: () => void;
  scenario?: ShiftBreakdown | null;
}

type SpeedPace = 'relaxed' | 'normal' | 'brisk';
type TextSize = 'normal' | 'large' | 'huge';

export const UrgeSurfer3D: React.FC<UrgeSurfer3DProps> = ({
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
  const [timeLeft, setTimeLeft] = useState(75);
  const [isGameOver, setIsGameOver] = useState(false);
  const [waveSurge, setWaveSurge] = useState(25); // 0 to 100%
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const [lastFeedback, setLastFeedback] = useState<{
    isPositive: boolean;
    text: string;
    show: boolean;
  } | null>(null);

  // Dynamic items derived from the user's shift
  const items: UrgeSurferItem[] = useMemo(() => {
    const list: UrgeSurferItem[] = [];

    const rule = currentShift?.userEditedHypothesis || currentShift?.protective_rule_hypothesis;
    const choice = currentShift?.choice;
    const interp = currentShift?.userEditedInterpretation || currentShift?.interpretation;
    const obs = currentShift?.userEditedObservation || currentShift?.observation;

    // Impulsive Urge 1: Panic reaction
    list.push({
      id: 'u1',
      type: 'impulse',
      text: rule ? `Knee-Jerk: "${rule}"` : 'Urge: "Send 5 frantic double-texts to force an answer"',
      category: 'Protective Reflex',
      explanation: 'DODGED! Impulsive action only feeds the alarm cycle. Riding the wave lets the adrenaline spike drop.',
    });

    // Grounded Anchor 1: 60-Second Pause
    list.push({
      id: 'a1',
      type: 'anchor',
      text: 'Anchor: "Take a 60-second physiological sigh pause"',
      category: 'Nervous System Grounding',
      explanation: 'ANCHOR CAUGHT! Lengthened exhales immediately down-regulate heart rate and activate the vagus nerve.',
    });

    // Impulsive Urge 2: Catastrophizing
    list.push({
      id: 'u2',
      type: 'impulse',
      text: interp ? `Story: "${interp}"` : 'Urge: "Assume the worst and pre-emptively push them away"',
      category: 'Defensive Urge',
      explanation: 'DODGED! Anxious withdrawal is a protective reflex, not a reasoned choice.',
    });

    // Grounded Anchor 2: Camera Fact
    list.push({
      id: 'a2',
      type: 'anchor',
      text: obs ? `Anchor: "Camera Fact: ${obs.slice(0, 50)}..."` : 'Anchor: "Camera Fact: Silence = lack of data, not disaster"',
      category: 'Camera Observation',
      explanation: 'ANCHOR CAUGHT! Anchoring to objective physical evidence prevents cognitive drift.',
    });

    // Grounded Anchor 3: Deliberate values choice
    list.push({
      id: 'a3',
      type: 'anchor',
      text: choice ? `Anchor: "${choice.slice(0, 55)}..."` : 'Anchor: "Wait until tomorrow before deciding anything"',
      category: 'Values-Aligned Action',
      explanation: 'ANCHOR CAUGHT! Strategic delay creates the cognitive space for executive decision-making.',
    });

    // Impulsive Urge 3: Over-apologizing / placating
    list.push({
      id: 'u3',
      type: 'impulse',
      text: 'Urge: "Over-apologize and assume full blame to eliminate tension"',
      category: 'People-Pleasing Reflex',
      explanation: 'DODGED! Taking 100% blame for mutual ambiguity harms healthy relational differentiation.',
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

  // Speed mapping
  const baseSpeed = useMemo(() => {
    switch (speedPace) {
      case 'relaxed':
        return 7.5;
      case 'normal':
        return 10.5;
      case 'brisk':
        return 14.0;
    }
  }, [speedPace]);

  // Game Loop Ref
  const gameLoopRef = useRef({
    boardX: 0,
    targetX: 0,
    currentSpeed: baseSpeed,
    reducedMotion: false,
    itemZ: -90,
    itemX: 0,
    currentItem: currentItem,
    isProcessing: false,
    updateItemMesh: null as ((item: UrgeSurferItem) => void) | null,
  });

  useEffect(() => {
    gameLoopRef.current.currentSpeed = baseSpeed;
  }, [baseSpeed]);

  useEffect(() => {
    gameLoopRef.current.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    gameLoopRef.current.currentItem = currentItem;
    if (gameLoopRef.current.updateItemMesh) {
      gameLoopRef.current.updateItemMesh(currentItem);
    }
  }, [currentItem]);

  // Steer Surfer (-3 to +3)
  const steerBoard = useCallback(
    (dir: 'left' | 'right' | 'center') => {
      triggerSound('tap');
      if (dir === 'left') gameLoopRef.current.targetX = -2.6;
      else if (dir === 'right') gameLoopRef.current.targetX = 2.6;
      else gameLoopRef.current.targetX = 0;
    },
    [triggerSound]
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        steerBoard('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        steerBoard('right');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        steerBoard('center');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [steerBoard, isGameOver]);

  // Timer countdown
  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGameOver(true);
          return 0;
        }
        // Simulated urge curve: surges up to 45s, then crests and drops smoothly
        const progress = (75 - prev) / 75;
        const wave = Math.sin(progress * Math.PI) * 75 + 25;
        setWaveSurge(Math.round(wave));
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      logPracticeSession({
        gameId: 'urge_surfer_3d',
        score,
        durationSeconds: 75 - timeLeft,
        theme: currentShift?.protective_rule_hypothesis || '3D Ocean Urge Surfer',
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

    // Scene & Sky
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Deep oceanic twilight
    scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

    // Elevated Camera
    const camera = new THREE.PerspectiveCamera(
      48,
      container.clientWidth / container.clientHeight,
      0.1,
      250
    );
    camera.position.set(0, 4.8, 8.5);
    camera.lookAt(0, 1.2, -25);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    sunLight.position.set(15, 30, 20);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const oceanGlow = new THREE.DirectionalLight(0x3b82f6, 0.6);
    oceanGlow.position.set(-20, 15, -30);
    scene.add(oceanGlow);

    // Dynamic 3D Ocean Surface (Curved Wave Mesh)
    const oceanWidth = 70;
    const oceanLength = 220;
    const oceanGeo = new THREE.PlaneGeometry(oceanWidth, oceanLength, 60, 60);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.35,
      wireframe: false,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -0.6, -70);
    ocean.receiveShadow = true;
    scene.add(ocean);

    // Spray particles
    const sprayCount = 60;
    const sprayGeo = new THREE.BufferGeometry();
    const sprayPos = new Float32Array(sprayCount * 3);
    for (let i = 0; i < sprayCount; i++) {
      sprayPos[i * 3] = (Math.random() - 0.5) * 20;
      sprayPos[i * 3 + 1] = Math.random() * 2;
      sprayPos[i * 3 + 2] = -Math.random() * 80;
    }
    sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0xbae6fd,
      size: 0.25,
      transparent: true,
      opacity: 0.6,
    });
    const sprayParticles = new THREE.Points(sprayGeo, sprayMat);
    scene.add(sprayParticles);

    // 3D Surfboard Player Model
    const surferGroup = new THREE.Group();

    // Board
    const boardGeo = new THREE.CylinderGeometry(0.55, 0.45, 3.2, 16);
    boardGeo.rotateX(Math.PI / 2);
    boardGeo.scale(1, 0.18, 1);
    const boardMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa, // Cyan surfboard
      roughness: 0.2,
      metalness: 0.1,
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.y = 0.2;
    board.castShadow = true;
    surferGroup.add(board);

    // Surfer avatar (Stylized zen rider)
    const riderMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
    const riderTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.9, 8), riderMat);
    riderTorso.position.set(0, 0.75, 0.1);
    surferGroup.add(riderTorso);

    const riderHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), riderMat);
    riderHead.position.set(0, 1.35, 0.1);
    surferGroup.add(riderHead);

    // Surfer glow ring
    const ringGeo = new THREE.RingGeometry(0.8, 0.95, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    surferGroup.add(ring);

    surferGroup.position.set(0, 0, 0);
    scene.add(surferGroup);

    // Floating Target Item (Urge Rock or Anchor Buoy)
    const itemGroup = new THREE.Group();

    // Visual texture for the floating item
    const createItemTexture = (text: string, bgColor: string, textColor: string) => {
      const can = document.createElement('canvas');
      can.width = 512;
      can.height = 256;
      const ctx = can.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, can.width, can.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, can.width - 12, can.height - 12);

        ctx.fillStyle = textColor;
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wrap text
        const words = text.split(' ');
        let line = '';
        let y = 80;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 440 && n > 0) {
            ctx.fillText(line, can.width / 2, y);
            line = words[n] + ' ';
            y += 45;
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

    const itemCoreGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const itemCoreMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.3,
      metalness: 0.2,
    });
    const itemCore = new THREE.Mesh(itemCoreGeo, itemCoreMat);
    itemCore.castShadow = true;
    itemGroup.add(itemCore);

    const bannerMat = new THREE.MeshBasicMaterial({
      map: createItemTexture('Urge Rock', '#dc2626', '#ffffff'),
      transparent: true,
    });
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.8), bannerMat);
    bannerMesh.position.set(0, 2.2, 0);
    itemGroup.add(bannerMesh);

    itemGroup.position.set(0, 0.8, -90);
    scene.add(itemGroup);

    // Update item mesh callback
    const updateItemMesh = (item: UrgeSurferItem) => {
      const isAnchor = item.type === 'anchor';
      itemCoreMat.color.setHex(isAnchor ? 0x3b82f6 : 0xef4444);

      bannerMat.map?.dispose();
      bannerMat.map = createItemTexture(
        isAnchor ? `ANCHOR:\n${item.category}` : `DODGE URGE:\n${item.category}`,
        isAnchor ? '#2563eb' : '#dc2626',
        '#ffffff'
      );
      bannerMat.needsUpdate = true;
    };

    gameLoopRef.current.updateItemMesh = updateItemMesh;
    updateItemMesh(gameLoopRef.current.currentItem);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Animation Loop
    let itemZ = -90;
    let itemX = 0;
    let boardX = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Deform ocean vertices to create rolling swells
      const pos = oceanGeo.attributes.position;
      const count = pos.count;
      for (let i = 0; i < count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const waveHeight =
          Math.sin(v * 0.12 + elapsed * 3.5) * 0.45 +
          Math.cos(u * 0.15 + elapsed * 2.0) * 0.25;
        pos.setZ(i, waveHeight);
      }
      pos.needsUpdate = true;

      // Board horizontal interpolation
      const targetX = gameLoopRef.current.targetX;
      boardX += (targetX - boardX) * Math.min(9.0 * delta, 1.0);
      surferGroup.position.x = boardX;

      // Board carving tilt & wave bobbing
      const dx = targetX - boardX;
      surferGroup.rotation.z = gameLoopRef.current.reducedMotion ? 0 : -dx * 0.25;
      surferGroup.rotation.x = Math.sin(elapsed * 4) * 0.08;
      surferGroup.position.y = Math.sin(elapsed * 5) * 0.12;

      // Pulse glow ring
      ring.scale.setScalar(1 + Math.sin(elapsed * 6) * 0.1);

      // Approaching Item Movement
      const currentSpeed = gameLoopRef.current.currentSpeed;
      itemZ += delta * currentSpeed;
      itemGroup.position.z = itemZ;
      itemGroup.position.x = itemX;
      itemGroup.rotation.y += delta * 1.5;

      // Collision Check at z = 0 (Surfer's position)
      if (itemZ >= 0 && !gameLoopRef.current.isProcessing) {
        gameLoopRef.current.isProcessing = true;

        const distance = Math.abs(boardX - itemX);
        const item = gameLoopRef.current.currentItem;
        const caught = distance < 1.8;

        if (item.type === 'anchor') {
          // You WANT to catch anchors!
          if (caught) {
            triggerSound('chime');
            setScore((s) => s + 150);
            setStreak((st) => st + 1);
            setLastFeedback({
              isPositive: true,
              text: item.explanation,
              show: true,
            });
          } else {
            triggerSound('ground');
            setStreak(0);
            setLastFeedback({
              isPositive: false,
              text: `Missed Anchor: Always pause to collect grounding facts!`,
              show: true,
            });
          }
        } else {
          // Impulses: You WANT to DODGE them!
          if (!caught) {
            triggerSound('chime');
            setScore((s) => s + 100);
            setStreak((st) => st + 1);
            setLastFeedback({
              isPositive: true,
              text: item.explanation,
              show: true,
            });
          } else {
            triggerSound('ground');
            setStreak(0);
            setLastFeedback({
              isPositive: false,
              text: `Hit by Knee-Jerk Reflex! Remember: Urges crest and fade if you don't act on them.`,
              show: true,
            });
          }
        }

        // Spawn next item
        setTimeout(() => {
          setActiveItemIndex((idx) => idx + 1);
          itemZ = -90;
          // Alternate lanes: -2.6, 0, 2.6
          const lanes = [-2.6, 0, 2.6];
          itemX = lanes[Math.floor(Math.random() * lanes.length)];
          gameLoopRef.current.isProcessing = false;
        }, 1500);
      }

      if (itemZ > 12) {
        itemZ = -90;
        gameLoopRef.current.isProcessing = false;
      }

      // Camera gentle follow
      camera.position.x += (boardX * 0.3 - camera.position.x) * 0.08;

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
      id="urge-surfer-container"
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col"
    >
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER: Clear, outside 3D canvas so ocean view is never blocked */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-sky-950 text-sky-400 font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-sky-800">
              <Waves className="w-3.5 h-3.5" />
              3D OCEAN URGE SURFER
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Target: {currentItem.type === 'anchor' ? '🟢 CATCH ANCHOR' : '🔴 DODGE URGE'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold animate-pulse">
                🌊 {streak}x Clean Waves
              </div>
            )}
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-bold">
                {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-sky-400 font-mono text-xs font-black">
              Score: {score}
            </div>
          </div>
        </div>

        {/* Current Target Card */}
        <div className="rounded-2xl bg-white p-3.5 sm:p-4 text-slate-900 shadow-md flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500 mb-0.5">
              {currentItem.category} — {currentItem.type === 'anchor' ? 'Steer into this!' : 'Steer away!'}
            </div>
            <div className={`text-slate-900 tracking-tight leading-relaxed ${statementSizeClass}`}>
              {currentItem.text}
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

        {/* Urge Wave Crest Progress Bar */}
        <div className="mt-2.5 flex items-center justify-between gap-3 text-xs font-mono font-bold text-slate-400">
          <div className="flex items-center gap-2 text-sky-400 shrink-0">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>Emotional Wave Intensity: {waveSurge}%</span>
          </div>

          <div className="flex-1 max-w-xs h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                waveSurge > 70 ? 'bg-rose-500' : waveSurge > 45 ? 'bg-amber-400' : 'bg-teal-400'
              }`}
              style={{ width: `${waveSurge}%` }}
            />
          </div>

          <div className="text-right text-[11px] text-slate-400 hidden sm:block">
            {waveSurge > 70 ? 'Crest reached: Breathe and ride through!' : 'Wave subsiding smoothly'}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* 3D OCEAN VIEWPORT: 100% UNOBSTRUCTED */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] overflow-hidden cursor-pointer bg-slate-950"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const third = rect.width / 3;
          if (clickX < third) steerBoard('left');
          else if (clickX > third * 2) steerBoard('right');
          else steerBoard('center');
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Lane Watermarks */}
        <div className="absolute top-3 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-sky-300 font-mono text-xs font-bold backdrop-blur-md">
            ← LEFT WAVE
          </span>
        </div>
        <div className="absolute top-3 right-4 z-10 pointer-events-none">
          <span className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700 text-sky-300 font-mono text-xs font-bold backdrop-blur-md">
            RIGHT WAVE →
          </span>
        </div>

        {/* Feedback Toast */}
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
      {/* STEERING CONTROLS */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => steerBoard('left')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 text-sky-400" />
            <span>A / Left</span>
          </button>
          <button
            onClick={() => steerBoard('center')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <span>S / Center</span>
          </button>
          <button
            onClick={() => steerBoard('right')}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <span>Right / D</span>
            <ChevronRight className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold flex items-center gap-1 font-mono uppercase text-[10px]">
              <Gauge className="w-3.5 h-3.5 text-sky-400" />
              Swell Speed:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setSpeedPace('relaxed')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'relaxed'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🐢 Calm
              </button>
              <button
                onClick={() => setSpeedPace('normal')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'normal'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌊 Normal
              </button>
              <button
                onClick={() => setSpeedPace('brisk')}
                className={`px-2.5 py-1 rounded-md font-bold text-xs cursor-pointer transition-colors ${
                  speedPace === 'brisk'
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ⚡ Rapid
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className="hover:text-slate-200 underline cursor-pointer text-[11px]"
            >
              {reducedMotion ? 'Enable wave tilt' : 'Reduced motion'}
            </button>

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
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-sky-500/50 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-sky-400 uppercase font-bold">
                Urge Surfing Complete
              </span>
              <h3 className="text-2xl font-black text-slate-100">
                You Rode Out The Emotional Wave!
              </h3>
              <p className="text-xs text-slate-400">
                You proved that acute emotional surges naturally peak and subside without needing destructive, knee-jerk actions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Score</div>
                <div className="text-2xl font-black text-sky-400">{score}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Best Streak</div>
                <div className="text-2xl font-black text-amber-400">{streak}x</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setTimeLeft(75);
                  setScore(0);
                  setStreak(0);
                  setActiveItemIndex(0);
                  setIsGameOver(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                Surf Again
              </button>
              {onComplete && (
                <button
                  onClick={onComplete}
                  className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
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
