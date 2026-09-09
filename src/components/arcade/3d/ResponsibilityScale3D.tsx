import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useApp } from '../../../context/AppContext';
import { ShiftBreakdown } from '../../../types';
import {
  Trophy,
  Volume2,
  VolumeX,
  Scale,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

export interface ScaleItem {
  id: string;
  category: 'my_responsibility' | 'their_world';
  label: string;
  explanation: string;
}

interface ResponsibilityScale3DProps {
  onComplete?: () => void;
  scenario?: ShiftBreakdown | null;
}

type TextSize = 'normal' | 'large';

export const ResponsibilityScale3D: React.FC<ResponsibilityScale3DProps> = ({
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

  // Gameplay State
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const [lastFeedback, setLastFeedback] = useState<{
    isPositive: boolean;
    text: string;
    show: boolean;
  } | null>(null);

  // Dynamic Items derived from active shift
  const items: ScaleItem[] = useMemo(() => {
    const list: ScaleItem[] = [];

    const choice = currentShift?.choice;
    const rule = currentShift?.userEditedHypothesis || currentShift?.protective_rule_hypothesis;

    // My 50% items
    list.push({
      id: 'm1',
      category: 'my_responsibility',
      label: choice ? `My Action: "${choice.slice(0, 55)}..."` : 'My Action: Taking a 60-second pause before responding',
      explanation: 'CORRECT! Your nervous system, boundaries, and deliberate responses are in your 50%.',
    });

    // Their 50% items
    list.push({
      id: 't1',
      category: 'their_world',
      label: 'Their Tone: Whether they speak with warmth or irritability',
      explanation: 'CORRECT! Other people\'s emotional tone belongs 100% to them and their nervous system.',
    });

    // My 50%
    list.push({
      id: 'm2',
      category: 'my_responsibility',
      label: 'My Boundary: Speaking clearly without apologetic overexplaining',
      explanation: 'CORRECT! How directly and respectfully you express your needs is fully in your control.',
    });

    // Their 50%
    list.push({
      id: 't2',
      category: 'their_world',
      label: 'Their Response Time: How many hours or days it takes them to text back',
      explanation: 'CORRECT! You cannot control their schedule, attention span, or personal life emergencies.',
    });

    // Their 50%
    list.push({
      id: 't3',
      category: 'their_world',
      label: 'Their Past Baggage: How their childhood triggers shape how they view you',
      explanation: 'CORRECT! You cannot heal or manage another adult\'s unresolved defensive armor.',
    });

    // My 50%
    list.push({
      id: 'm3',
      category: 'my_responsibility',
      label: rule ? `My Self-Awareness: Catching the reflex "${rule.slice(0, 45)}..."` : 'My Self-Awareness: Noticing when my alarm system is activated',
      explanation: 'CORRECT! Recognizing your own internal protective reflexes is your superpower.',
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

  // 3D scale animation loop ref
  const scaleLoopRef = useRef({
    targetTilt: 0, // radians (-0.35 = Left heavy, +0.35 = Right heavy)
    currentTilt: 0,
    isProcessing: false,
    currentItem: currentItem,
    updateItemMesh: null as ((item: ScaleItem) => void) | null,
  });

  useEffect(() => {
    scaleLoopRef.current.currentItem = currentItem;
    if (scaleLoopRef.current.updateItemMesh) {
      scaleLoopRef.current.updateItemMesh(currentItem);
    }
  }, [currentItem]);

  // Drop Stone into Chosen Pan
  const handleDrop = useCallback(
    (targetPan: 'my_responsibility' | 'their_world') => {
      if (isGameOver || scaleLoopRef.current.isProcessing) return;

      triggerSound('tap');
      scaleLoopRef.current.isProcessing = true;

      const item = scaleLoopRef.current.currentItem;
      const isCorrect = item.category === targetPan;

      // Physically tilt scale towards the chosen side
      scaleLoopRef.current.targetTilt = targetPan === 'my_responsibility' ? -0.28 : 0.28;

      if (isCorrect) {
        triggerSound('chime');
        setScore((s) => s + 100);
        setStreak((st) => st + 1);
        setLastFeedback({
          isPositive: true,
          text: item.explanation,
          show: true,
        });

        // Return to serene equilibrium
        setTimeout(() => {
          scaleLoopRef.current.targetTilt = 0;
        }, 600);
      } else {
        triggerSound('ground');
        setStreak(0);
        setLastFeedback({
          isPositive: false,
          text: `Scale unbalanced! ${item.label} belongs to ${
            item.category === 'my_responsibility' ? 'YOUR 50%' : 'THEIR 50% / THE WORLD'
          }.`,
          show: true,
        });

        // Return to neutral
        setTimeout(() => {
          scaleLoopRef.current.targetTilt = 0;
        }, 700);
      }

      setTimeout(() => {
        setActiveItemIndex((idx) => idx + 1);
        scaleLoopRef.current.isProcessing = false;
      }, 1200);
    },
    [isGameOver, triggerSound]
  );

  // Keyboard controls: Left Arrow / A = My 50%, Right Arrow / D = Their 50%
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleDrop('my_responsibility');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleDrop('their_world');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDrop, isGameOver]);

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
        gameId: 'responsibility_scale_3d',
        score,
        durationSeconds: 60 - timeLeft,
        theme: currentShift?.protective_rule_hypothesis || '3D Responsibility Balance',
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
    scene.background = new THREE.Color(0x0a1120); // Classical midnight blue
    scene.fog = new THREE.FogExp2(0x0a1120, 0.018);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 3.6, 9.5);
    camera.lookAt(0, 1.6, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xfef08a, 1.4);
    goldKeyLight.position.set(10, 20, 15);
    scene.add(goldKeyLight);

    const tealFill = new THREE.PointLight(0x14b8a6, 2, 25);
    tealFill.position.set(-8, 6, 5);
    scene.add(tealFill);

    // Stone Courtyard Base
    const baseGeo = new THREE.CylinderGeometry(4.5, 5.2, 0.6, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.1,
    });
    const stoneBase = new THREE.Mesh(baseGeo, baseMat);
    stoneBase.position.y = -0.3;
    scene.add(stoneBase);

    // Balance Scale Central Pillar
    const scaleGroup = new THREE.Group();

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // Brass/Bronze
      metalness: 0.8,
      roughness: 0.25,
    });
    const mainPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 3.8, 16), pillarMat);
    mainPillar.position.y = 1.9;
    scaleGroup.add(mainPillar);

    const topFulcrum = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), pillarMat);
    topFulcrum.position.y = 3.8;
    scaleGroup.add(topFulcrum);

    // The Tilting Beam Assembly
    const beamAssembly = new THREE.Group();
    beamAssembly.position.y = 3.8;

    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.4, 12);
    beamGeo.rotateZ(Math.PI / 2);
    const beamMesh = new THREE.Mesh(beamGeo, pillarMat);
    beamAssembly.add(beamMesh);

    // Left Hanging Pan ("My 50%")
    const panGeo = new THREE.CylinderGeometry(1.2, 0.9, 0.25, 24);
    const leftPanMat = new THREE.MeshStandardMaterial({
      color: 0x0d9488, // Teal
      metalness: 0.7,
      roughness: 0.3,
    });
    const leftPan = new THREE.Mesh(panGeo, leftPanMat);
    leftPan.position.set(-3.2, -1.8, 0);
    beamAssembly.add(leftPan);

    // Left pan chains
    const leftChainGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6);
    const leftChain = new THREE.Mesh(leftChainGeo, pillarMat);
    leftChain.position.set(-3.2, -0.9, 0);
    beamAssembly.add(leftChain);

    // Right Hanging Pan ("Their 50%")
    const rightPanMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1, // Indigo
      metalness: 0.7,
      roughness: 0.3,
    });
    const rightPan = new THREE.Mesh(panGeo, rightPanMat);
    rightPan.position.set(3.2, -1.8, 0);
    beamAssembly.add(rightPan);

    // Right pan chains
    const rightChain = new THREE.Mesh(leftChainGeo, pillarMat);
    rightChain.position.set(3.2, -0.9, 0);
    beamAssembly.add(rightChain);

    scaleGroup.add(beamAssembly);
    scene.add(scaleGroup);

    // Floating Staging Stone (carries current item)
    const stoneGeo = new THREE.BoxGeometry(1.6, 0.9, 0.8);
    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.2,
    });
    const stoneMesh = new THREE.Mesh(stoneGeo, stoneMat);
    stoneMesh.position.set(0, 4.8, 0);
    scene.add(stoneMesh);

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
    let currentTilt = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Smooth physics tilt
      const targetTilt = scaleLoopRef.current.targetTilt;
      currentTilt += (targetTilt - currentTilt) * Math.min(6.0 * delta, 1.0);
      beamAssembly.rotation.z = currentTilt;

      // Keep hanging pans horizontal due to gravity
      leftPan.rotation.z = -currentTilt;
      rightPan.rotation.z = -currentTilt;

      // Gentle stone levitation
      stoneMesh.position.y = 4.8 + Math.sin(elapsed * 3) * 0.1;
      stoneMesh.rotation.y = elapsed * 0.5;

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
      id="responsibility-scale-container"
      className="relative w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl select-none flex flex-col"
    >
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER: Clear, outside 3D canvas so scale is never blocked */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-teal-950 text-teal-400 font-mono text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-teal-800">
              <Scale className="w-3.5 h-3.5" />
              3D RESPONSIBILITY BALANCE
            </span>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] border border-slate-700">
              Sort into My 50% vs Their 50%
            </span>
          </div>

          <div className="flex items-center gap-3">
            {streak > 1 && (
              <div className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 font-mono text-xs font-bold animate-pulse">
                ⚖️ {streak}x Balanced
              </div>
            )}
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-bold">
                {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? `0${timeLeft % 60}` : timeLeft % 60}
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-teal-400 font-mono text-xs font-black">
              Score: {score}
            </div>
          </div>
        </div>

        {/* Current Stone Item Card */}
        <div className="rounded-2xl bg-white p-3.5 sm:p-4 text-slate-900 shadow-md flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-mono uppercase font-bold text-slate-500 mb-0.5">
              Whose Responsibility is this?
            </div>
            <div
              className={`text-slate-900 tracking-tight leading-relaxed font-black ${
                textSize === 'large' ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {currentItem.label}
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
      {/* 3D BALANCE SCALE VIEWPORT: 100% UNOBSTRUCTED */}
      {/* ------------------------------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] overflow-hidden bg-slate-950"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Pan HUD Labels */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-teal-950/85 border border-teal-500/50 text-teal-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>MY 50% (IN MY CONTROL)</span>
          </span>
        </div>
        <div className="absolute top-4 right-4 z-10 pointer-events-none">
          <span className="px-3 py-1.5 rounded-xl bg-indigo-950/85 border border-indigo-500/50 text-indigo-300 font-mono text-xs font-bold backdrop-blur-md flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>THEIR 50% / THE WORLD</span>
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
      {/* ALLOCATION BUTTONS */}
      {/* ------------------------------------------------------------------- */}
      <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => handleDrop('my_responsibility')}
            className="p-4 rounded-2xl bg-gradient-to-r from-teal-950 to-teal-900/80 border border-teal-500/60 hover:border-teal-400 text-teal-100 font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-teal-950/40"
          >
            <ShieldCheck className="w-5 h-5 text-teal-400" />
            <span>DROP IN MY 50% (Left / A)</span>
          </button>

          <button
            onClick={() => handleDrop('their_world')}
            className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950 to-indigo-900/80 border border-indigo-500/60 hover:border-indigo-400 text-indigo-100 font-mono text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-lg shadow-indigo-950/40"
          >
            <Globe className="w-5 h-5 text-indigo-400" />
            <span>DROP IN THEIR 50% (Right / D)</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="font-mono text-[11px] text-slate-400">
            Keyboard: Press <strong>A / ←</strong> for Left Pan or <strong>D / →</strong> for Right Pan
          </span>

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

      {/* Completion Modal */}
      {isGameOver && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-teal-500/50 p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto shadow-inner">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-teal-400 uppercase font-bold">
                Balance Restored
              </span>
              <h3 className="text-2xl font-black text-slate-100">
                You Released False Guilt!
              </h3>
              <p className="text-xs text-slate-400">
                By differentiating what is yours from what belongs to others, chronic relational exhaustion drops dramatically.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Score</div>
                <div className="text-2xl font-black text-teal-400">{score}</div>
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
                  className="flex-1 py-3 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors"
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
