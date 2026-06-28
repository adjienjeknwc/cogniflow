import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Premium SaaS icon family from lucide-react
import { 
  Upload, Eye, Zap, Sparkles, Layout, AlertCircle, 
  RefreshCw, BarChart2, CheckCircle2, Sliders, ArrowRight, Cpu
} from 'lucide-react';

export default function App() {
  // --- PIPELINE NAVIGATION CONTROLLER ---
  const [appStage, setAppStage] = useState('preloader'); 
  const [activeTab, setActiveTab] = useState('dashboard'); 

  // --- CORE APPLICATION STATES ---
  const [file, setFile] = useState(null);               
  const [previewUrl, setPreviewUrl] = useState(null);   
  const [loading, setLoading] = useState(false);         
  const [analytics, setAnalytics] = useState(null);     
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.75); 
  
  // UNIQUE FEATURE HOOK: Highlight target element
  const [selectedFixIndex, setSelectedFixIndex] = useState(null);

  // --- A/B SIMULATOR STATE CONTAINERS ---
  const [simFileA, setSimFileA] = useState(null);
  const [simPreviewA, setSimPreviewA] = useState(null);
  const [simAnalyticsA, setSimAnalyticsA] = useState(null);
  const [simFileB, setSimFileB] = useState(null);
  const [simPreviewB, setSimPreviewB] = useState(null);
  const [simAnalyticsB, setSimAnalyticsB] = useState(null);
  const [simLoading, setSimLoading] = useState({ A: false, B: false });

  // --- CANVAS HOOK POINTERS ---
  const canvasRef = useRef(null);
  const canvasRefA = useRef(null);
  const canvasRefB = useRef(null);


  // Dynamically determine the backend URL based on where the app is hosted
  const BACKEND_URL = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://127.0.0.1:5000'
    : 'https://cogniflow-backend-xtlw.onrender.com';

  // --- AUTO-ADVANCE PRELOADER STAGE ---
  // --- AUTO-ADVANCE PRELOADER STAGE ---
  useEffect(() => {
    if (appStage === 'preloader') {
      const timer = setTimeout(() => {
        setAppStage('welcome');
      }, 3000); 
      return () => clearTimeout(timer);
    }
  }, [appStage]);

  // --- MOTION PHYSICS CONFIGURATION PRESETS ---
  const pageTransition = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.3 } }
  };

  const staggerContainer = {
    animate: { transition: { staggerChildren: 0.08 } }
  };

  const itemFadeIn = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  // --- EVENT: Handle Local File Selection Intercepts ---
  const handleFileChange = (e, side = null) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const localUrl = URL.createObjectURL(selectedFile);

    if (side === 'A') {
      setSimFileA(selectedFile);
      setSimPreviewA(localUrl);
      setSimAnalyticsA(null);
    } else if (side === 'B') {
      setSimFileB(selectedFile);
      setSimPreviewB(localUrl);
      setSimAnalyticsB(null);
    } else {
      setFile(selectedFile);
      setPreviewUrl(localUrl);
      setAnalytics(null);
      setSelectedFixIndex(null);
    }
  };

  // --- NETWORK ACTION: Post Payload directly to IPv4 address ---
  // --- NETWORK ACTION: Dynamic Local and Production Environment Router ---
  const handleUpload = async (side = null) => {
    let targetFile = side === 'A' ? simFileA : (side === 'B' ? simFileB : file);

    if (!targetFile) return;

    if (side === 'A') setSimLoading(prev => ({ ...prev, A: true }));
    else if (side === 'B') setSimLoading(prev => ({ ...prev, B: true }));
    else setLoading(true);

    const formData = new FormData();
    formData.append('screenshot', targetFile); 

    try {
      // DYNAMIC HOST PARSER: Autodetects local machine paths versus public cloud servers safely
      const dynamicBackendUrl = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
        ? 'http://127.0.0.1:5000'
        : 'https://cogniflow-backend-xtlw.onrender.com';

      console.log("Routing payload analysis pass to:", `${dynamicBackendUrl}/api/upload`);

      const response = await fetch(`${dynamicBackendUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        if (side === 'A') setSimAnalyticsA(data.analytics);
        else if (side === 'B') setSimAnalyticsB(data.analytics);
        else setAnalytics(data.analytics);
      } else {
        alert(data.error || 'The AI server is computing metrics. Please wait 10 seconds and click analyze again.');
      }
    } catch (err) {
      console.error("Network Link Handshake Exception Log:", err);
      alert('The cloud engine is waking up from its free-tier sleep cycle. Please wait 10 seconds and try your analysis pass again!');
    } finally {
      if (side === 'A') setSimLoading(prev => ({ ...prev, A: false }));
      else if (side === 'B') setSimLoading(prev => ({ ...prev, B: false }));
      else setLoading(false);
    }
  };
  // --- CANVAS VISUALIZATION RENDER LAYER ---
  const drawHeatmap = (canvas, imageUrl, attentionPoints, activeFixIdx = null) => {
    if (!canvas || !imageUrl || !attentionPoints) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      const containerWidth = canvas.parentElement.clientWidth;
      const aspectRatio = img.height / img.width;
      const displayHeight = containerWidth * aspectRatio;

      canvas.width = containerWidth;
      canvas.height = displayHeight;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = `rgba(10, 15, 30, ${1 - heatmapOpacity})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      attentionPoints.forEach((point, index) => {
        const px = (point.x / 100) * canvas.width;
        const py = (point.y / 100) * canvas.height;
        const radius = Math.max(50, (point.intensity / 100) * 90);

        const gradient = ctx.createRadialGradient(px, py, 2, px, py, radius);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.95)');   
        gradient.addColorStop(0.2, 'rgba(245, 158, 11, 0.75)'); 
        gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.35)');  
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');       

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(`#${index + 1}`, px, py);
        ctx.fillText(`#${index + 1}`, px, py);
      });

      // Draw active blueprint tracker ring if selected
      if (activeFixIdx !== null && attentionPoints[activeFixIdx]) {
        const target = attentionPoints[activeFixIdx];
        const tx = (target.x / 100) * canvas.width;
        const ty = (target.y / 100) * canvas.height;

        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(tx, ty, 65, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
        ctx.beginPath(); ctx.arc(tx, ty, 65, 0, 2 * Math.PI); ctx.fill();
        ctx.setLineDash([]);
      }
    };
  };

  useEffect(() => {
    if (appStage === 'app' && activeTab === 'dashboard' && analytics) {
      drawHeatmap(canvasRef.current, previewUrl, analytics.attentionPoints, selectedFixIndex);
    }
  }, [previewUrl, analytics, heatmapOpacity, activeTab, appStage, selectedFixIndex]);

  useEffect(() => {
    if (appStage === 'app' && activeTab === 'simulator') {
      if (simAnalyticsA) drawHeatmap(canvasRefA.current, simPreviewA, simAnalyticsA.attentionPoints, null);
      if (simAnalyticsB) drawHeatmap(canvasRefB.current, simPreviewB, simAnalyticsB.attentionPoints, null);
    }
  }, [simPreviewA, simAnalyticsA, simPreviewB, simAnalyticsB, heatmapOpacity, activeTab, appStage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <AnimatePresence mode="wait">
        
        {/* STAGE 1: PRELOADER */}
        {appStage === 'preloader' && (
          <motion.div key="preloaderStage" exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="flex flex-col items-center space-y-6">
              <div className="relative flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} className="absolute w-24 h-24 border-2 border-dashed border-indigo-500/20 rounded-full" />
                <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-5 rounded-2xl shadow-2xl relative z-10">
                  <Zap className="h-8 w-8 text-white animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-widest text-white">COGNIFLOW</h2>
                <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Waking up AI Vision Models...</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* STAGE 2: WELCOME HERO */}
        {appStage === 'welcome' && (
          <motion.div key="welcomeStage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[800px] h-[700px] bg-indigo-600/[0.04] rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[800px] h-[700px] bg-violet-600/[0.04] rounded-full blur-[180px] pointer-events-none" />

            <nav className="max-w-7xl w-full mx-auto px-8 py-6 flex justify-between items-center border-b border-slate-900/60 backdrop-blur-md z-10">
              <div className="flex items-center space-x-3.5">
                <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl"><Zap className="h-4 w-4 text-white" /></div>
                <span className="font-extrabold text-sm tracking-tight text-slate-200">CogniFlow School</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest border border-slate-800/80">Student Edition</span>
            </nav>

            <div className="max-w-5xl mx-auto w-full px-8 text-center py-12 flex flex-col items-center justify-center space-y-12 flex-1 z-10">
              <div className="space-y-6 flex flex-col items-center">
                <div className="bg-indigo-500/10 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide border border-indigo-500/20 flex items-center space-x-2">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Super Simple Design Checker</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] max-w-4xl">
                  See Exactly Where People Look <br/>
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">On Your Web Page Design</span>
                </h1>
                <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
                  Have you just designed a website or dashboard? Upload your image mockup below! Our friendly AI teacher will instantly draw color maps showing what catches a user's eye first, score your page layout, and give you clear tips to improve it.
                </p>
              </div>

              <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full pt-2">
                <motion.div variants={itemFadeIn} className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-3 backdrop-blur-md">
                  <Upload className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-200">1. Upload a Screenshot</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Take a screenshot of any website design layout and drop it right into the workspace container.</p>
                </motion.div>
                <motion.div variants={itemFadeIn} className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-3 backdrop-blur-md">
                  <Eye className="h-5 w-5 text-violet-400" />
                  <h3 className="text-sm font-bold text-slate-200">2. See the Gaze Roadmap</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Watch glowing spots form over your layout, labeled #1, #2, and #3 to show the exact eye-movement path.</p>
                </motion.div>
                <motion.div variants={itemFadeIn} className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl space-y-3 backdrop-blur-md">
                  <Layout className="h-5 w-5 text-pink-400" />
                  <h3 className="text-sm font-bold text-slate-200">3. Get Friendly Tips</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">Check out your score out of 100 along with simple, helpful advice on how to make your page better.</p>
                </motion.div>
              </motion.div>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setAppStage('app')} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-12 py-4 rounded-xl text-sm font-bold shadow-2xl transition-all flex items-center space-x-3 cursor-pointer group">
                <span>Open Design Workspace</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* STAGE 3: WORKSPACE CONSOLE */}
        {appStage === 'app' && (
          <motion.div key="appStage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex flex-col">
            <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-xl p-6 flex justify-between items-center">
              <button onClick={() => setAppStage('welcome')} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold rounded-lg border border-slate-800 text-slate-400 cursor-pointer">← Go Back</button>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-lg text-xs font-semibold ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Visual Radar Sandbox</button>
                <button onClick={() => setActiveTab('simulator')} className={`px-5 py-2 rounded-lg text-xs font-semibold ${activeTab === 'simulator' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>Compare Two Layouts</button>
              </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-8 flex flex-col justify-start">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' ? (
                  /* TAB 1: SINGLE IMAGE CHECK VIEW */
                  <motion.div key="radarDashboard" initial="hidden" animate="visible" exit="hidden" variants={pageTransition} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 flex flex-col space-y-4">
                      {!previewUrl ? (
                         <div className="border-2 border-dashed border-slate-800 p-20 flex flex-col items-center justify-center cursor-pointer rounded-2xl relative">
                            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                            <Upload className="h-10 w-10 text-indigo-400 mb-4 animate-bounce" />
                            <h3 className="text-lg font-bold">Upload Your Screen Layout</h3>
                         </div>
                      ) : (
                         <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                            {!analytics ? <img src={previewUrl} className="max-w-full h-auto object-contain" alt="Preview" /> : <canvas ref={canvasRef} className="max-w-full h-auto" />}
                            {loading && <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center"><RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" /><span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 animate-pulse">Checking design elements...</span></div>}
                          </div>
                      )}
                      {previewUrl && !analytics && <button onClick={() => handleUpload()} disabled={loading} className="w-full bg-indigo-600 py-3 rounded-xl font-bold hover:bg-indigo-500 transition active:scale-98">Check Where People Look!</button>}
                    </div>
                    
                    <div className="lg:col-span-4 flex flex-col space-y-6">
                      <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-6 flex flex-col space-y-6 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                          <h3 className="font-bold text-sm tracking-wide text-slate-300">Our Website Review</h3>
                        </div>
                        <AnimatePresence mode="wait">
                          {!analytics ? (
                            <motion.div key="emptyDeck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-slate-500 flex flex-col items-center justify-center">
                              <Eye className="h-8 w-8 text-slate-800 mb-4" />
                              <span className="text-xs font-medium max-w-[220px] leading-relaxed">Click the button below the picture to generate your friendly review report.</span>
                            </motion.div>
                          ) : (
                            <motion.div key="activeDeck" variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
                              <div className="flex flex-col items-center py-2">
                                <div className="relative flex items-center justify-center h-24 w-28 rounded-full border-4 border-slate-900 bg-slate-950/30 p-8">
                                  <span className="text-3xl font-extrabold text-white">{analytics.conversionScore}</span>
                                </div>
                                <span className="text-xs font-bold text-indigo-400 mt-4 uppercase tracking-wider">Design Score out of 100</span>
                              </div>
                              <div className="bg-indigo-950/20 border border-indigo-900/40 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-indigo-300 mb-1">Teacher AI Advice Note</h4>
                                <p className="text-xs text-slate-400 leading-relaxed">{analytics.critique}</p>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-1">✨ Click an item to view the auto-fix blueprint:</span>
                                {analytics.attentionPoints.map((point, index) => (
                                   <button 
                                     key={index} 
                                     onClick={() => setSelectedFixIndex(selectedFixIndex === index ? null : index)}
                                     className={`w-full text-left p-3 rounded-xl border flex flex-col space-y-2 transition-all cursor-pointer ${selectedFixIndex === index ? 'bg-indigo-600/20 border-indigo-500 shadow-lg' : 'bg-slate-950/60 border-slate-900 hover:border-slate-800'}`}
                                   >
                                     <div className="flex items-center space-x-3">
                                       <span className={`h-5 w-5 rounded-full text-[11px] flex items-center justify-center font-bold ${selectedFixIndex === index ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400'}`}>#{index + 1}</span>
                                       <span className="text-xs text-slate-300 flex-1">{point.element}</span>
                                     </div>
                                     {selectedFixIndex === index && (
                                       <div className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-lg border border-indigo-900/30 leading-relaxed">
                                         {point.fixAction}
                                       </div>
                                     )}
                                   </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* TAB 2: SIDE-BY-SIDE SPLIT EXPERIMENT SIMULATOR VIEW */
                  <motion.div key="abSimulator" initial="hidden" animate="visible" exit="hidden" variants={pageTransition} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Simulator Design Slot A */}
                    <div className="bg-slate-900/10 border border-slate-900 p-6 rounded-2xl flex flex-col space-y-4 shadow-md backdrop-blur-sm">
                      <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                        <h3 className="font-extrabold text-sm text-indigo-400 tracking-wide">Layout Option A</h3>
                        {simAnalyticsA && <span className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg text-xs font-black border border-indigo-500/20">Score: {simAnalyticsA.conversionScore}</span>}
                      </div>
                      {!simPreviewA ? (
                        <div className="border-2 border-dashed border-slate-800 h-64 flex flex-col items-center justify-center cursor-pointer rounded-xl relative hover:border-indigo-500/40 transition duration-200">
                          <input type="file" onChange={(e) => handleFileChange(e, 'A')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                          <Upload className="h-6 w-6 text-slate-600 mb-2" />
                          <span className="text-xs text-slate-400 font-bold">Choose Picture A</span>
                        </div>
                      ) : (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="relative border border-slate-900 rounded-lg overflow-hidden bg-slate-950 max-h-[350px] flex justify-center">
                            {!simAnalyticsA ? <img src={simPreviewA} className="max-w-full h-auto object-contain" alt="A" /> : <canvas ref={canvasRefA} className="max-w-full h-auto" />}
                            {simLoading.A && <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center"><RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" /></div>}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button onClick={() => { setSimFileA(null); setSimPreviewA(null); setSimAnalyticsA(null); }} className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer">Reset</button>
                            {!simAnalyticsA && <button onClick={() => handleUpload('A')} disabled={simLoading.A} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-500 transition active:scale-98">Check Picture A</button>}
                          </div>

                          {simAnalyticsA && (
                            <div className="space-y-3 pt-2 border-t border-slate-900">
                              <div className="bg-indigo-950/10 border border-indigo-900/30 p-3 rounded-xl">
                                <p className="text-xs text-slate-400 leading-relaxed"><strong className="text-indigo-400 font-bold block mb-1">Teacher Notes A:</strong>{simAnalyticsA.critique}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase block mb-1">Roadmap A:</span>
                                {simAnalyticsA.attentionPoints.map((point, index) => (
                                  <div key={index} className="flex items-center space-x-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900 text-[11px]">
                                    <span className="font-bold text-indigo-400 text-xs">#{index + 1}</span>
                                    <span className="text-slate-300">{point.element}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Simulator Design Slot B */}
                    <div className="bg-slate-900/10 border border-slate-900 p-6 rounded-2xl flex flex-col space-y-4 shadow-md backdrop-blur-sm">
                      <div className="flex justify-between items-center border-b border-slate-900/60 pb-2">
                        <h3 className="font-extrabold text-sm text-pink-400 tracking-wide">Layout Option B</h3>
                        {simAnalyticsB && <span className="bg-pink-500/10 text-pink-300 px-3 py-1 rounded-lg text-xs font-black border border-pink-500/20">Score: {simAnalyticsB.conversionScore}</span>}
                      </div>
                      {!simPreviewB ? (
                        <div className="border-2 border-dashed border-slate-800 h-64 flex flex-col items-center justify-center cursor-pointer rounded-xl relative hover:border-pink-500/40 transition duration-200">
                          <input type="file" onChange={(e) => handleFileChange(e, 'B')} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                          <Upload className="h-6 w-6 text-slate-600 mb-2" />
                          <span className="text-xs text-slate-400 font-bold">Choose Picture B</span>
                        </div>
                      ) : (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="relative border border-slate-900 rounded-lg overflow-hidden bg-slate-950 max-h-[350px] flex justify-center">
                            {!simAnalyticsB ? <img src={simPreviewB} className="max-w-full h-auto object-contain" alt="B" /> : <canvas ref={canvasRefB} className="max-w-full h-auto" />}
                            {simLoading.B && <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center"><RefreshCw className="h-6 w-6 text-pink-500 animate-spin" /></div>}
                          </div>
                          
                          <div className="flex space-x-2">
                            <button onClick={() => { setSimFileB(null); setSimPreviewB(null); setSimAnalyticsB(null); }} className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 cursor-pointer">Reset</button>
                            {!simAnalyticsB && <button onClick={() => handleUpload('B')} disabled={simLoading.B} className="flex-1 bg-pink-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-pink-500 transition active:scale-98">Check Picture B</button>}
                          </div>

                          {simAnalyticsB && (
                            <div className="space-y-3 pt-2 border-t border-slate-900">
                              <div className="bg-pink-950/10 border border-pink-900/30 p-3 rounded-xl">
                                <p className="text-xs text-slate-400 leading-relaxed"><strong className="text-pink-400 font-bold block mb-1">Teacher Notes B:</strong>{simAnalyticsB.critique}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase block mb-1">Roadmap B:</span>
                                {simAnalyticsB.attentionPoints.map((point, index) => (
                                  <div key={index} className="flex items-center space-x-2 bg-slate-950/50 p-2 rounded-lg border border-slate-900 text-[11px]">
                                    <span className="font-bold text-pink-400 text-xs">#{index + 1}</span>
                                    <span className="text-slate-300">{point.element}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}