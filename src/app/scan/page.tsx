"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Check, Loader2, RotateCcw, Upload, ShieldAlert, Smartphone, Camera, CameraOff, Keyboard, Trophy, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/context/toast-context";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

// Dynamic import to prevent SSR issues with camera APIs
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((mod) => mod.Scanner),
  { ssr: false }
);

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import('@/components/three').then((m) => m.TrophyCanvas),
  { ssr: false }
);

// Check if we're on a secure context (HTTPS or localhost)
const useSecureContext = () => {
  const [isSecure, setIsSecure] = useState(true); // Default to true to avoid flash
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // On localhost, always allow (Safari treats localhost as secure)
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const secure = isLocalhost || window.isSecureContext;
    
    setIsSecure(secure);
    setIsLoading(false);
  }, []);
  
  return { isSecure, isLoading };
};

type ScanStep = "permission" | "qr" | "capture" | "preview" | "uploading" | "success";

export default function ScanPage() {
  const { user, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();
  const { isSecure, isLoading: secureLoading } = useSecureContext();
  const router = useRouter();
  
  const [step, setStep] = useState<ScanStep>("permission"); // Start with permission primer
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [bookInfo, setBookInfo] = useState<{title: string, page?: number} | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const [manualCode, setManualCode] = useState("");
  
  // Canvas ref for potential image processing if needed later
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Toggle camera mode
  const toggleCameraMode = () => {
    setUseCamera(!useCamera);
    setCameraError(null);
    setManualCode("");
  };

  // --- Step 1: QR Scanning Logic ---
  const handleScan = async (result: unknown) => {
    if (!result || step !== "qr") return;
    
    // The library might return an array or object depending on version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawValue = Array.isArray(result) ? (result as any[])[0]?.rawValue : (result as any)?.rawValue;
    if (!rawValue) return;

    // Pause scanning to process
    const rawString = rawValue.trim();
    
    try {
        // 1. Try Parse as Story JSON Payload
        let storyPayload = null;
        if (rawString.startsWith('{') && rawString.endsWith('}')) {
            try {
                storyPayload = JSON.parse(rawString);
            } catch (e) {
                // Not valid JSON, ignore
            }
        }

        // 2. Check for return_to (Story Mode Flow)
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get('return_to');

        if (returnTo) {
             // If in story mode, we just pass the code back
             // Use payload.code or the raw string if not JSON
             const codeToReturn = storyPayload?.code || rawString;
             
             success("Code Scanned! Returning to story...");
             
             // Construct redirect URL
             // If returnTo already has query params, append with &
             const separator = returnTo.includes('?') ? '&' : '?';
             router.push(`${returnTo}${separator}scanned_code=${encodeURIComponent(codeToReturn)}`);
             return;
        }

        // 3. Handle Entry QR (New Story)
        if (storyPayload && storyPayload.framework && !storyPayload.stage) {
             // This looks like an entry QR: {"framework": "mystery-hunt"}
             // Redirect to story creation/view
             // For now, let's assume we redirect to a 'new' page or list
             success(`Found Story: ${storyPayload.framework}`);
             router.push(`/stories/new?framework=${storyPayload.framework}`);
             return;
        }

        // 4. Fallback: Standard Book Code (Existing Logic)
        const code = rawString.toUpperCase();
        
        // Validate against book_codes
        const { data: codeData, error } = await supabase
            .from('book_codes')
            .select('*, products(title)')
            .eq('code', code)
            .single();

        if (error || !codeData) {
            // If it was a JSON payload but not handled above, maybe just show it?
            if (storyPayload) {
                 toastError("Story code scanned. Open a story to use it.");
                 return;
            }
            toastError("Invalid QR Code. Please try again.");
            return;
        }

        setScannedCode(code);
        setBookInfo({
            title: codeData.products?.title || "Unknown Book",
            page: codeData.page_number
        });
        
        // Move to capture step
        setStep("capture");
        success("Code Verified! Now capture the page.");

    } catch (err) {
        logger.error("Scan error:", err);
        toastError("Error verifying code.");
    }
  };

  // Handle manual code entry
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    
    const code = manualCode.trim().toUpperCase();
    
    try {
      const { data: codeData, error } = await supabase
        .from('book_codes')
        .select('*, products(title)')
        .eq('code', code)
        .single();

      if (error || !codeData) {
        toastError("Invalid code. Please try again.");
        return;
      }

      setScannedCode(code);
      setBookInfo({
        title: codeData.products?.title || "Unknown Book",
        page: codeData.page_number
      });
      
      setStep("capture");
      setUseCamera(true); // Switch to camera/file picker for capture
      success("Code Verified! Now capture the page.");

    } catch (err) {
      logger.error("Manual code error:", err);
      toastError("Error verifying code.");
    }
  };

  // --- Step 2: Camera & Capture Logic ---
  // Replaced with native file input for better compatibility
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCapturedImage(e.target.result as string);
          setStep("preview");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setStep("capture");
  };

  // --- Step 3: Upload Logic ---
  const handleUpload = async () => {
    if (!user) {
        openAuthModal();
        return;
    }
    if (!capturedImage || !scannedCode) return;

    setStep("uploading");

    try {
        // Convert base64 to blob
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        
        const filename = `${user.id}/${Date.now()}-${scannedCode}.jpg`;
        
        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from('page-scans')
            .upload(filename, blob);

        if (uploadError) throw uploadError;

        // 2. Create DB Record
        // First get the code_id again (or we could have stored it in state)
        const { data: codeData } = await supabase
            .from('book_codes')
            .select('id')
            .eq('code', scannedCode)
            .single();

        const { error: dbError } = await supabase
            .from('page_scans')
            .insert({
                user_id: user.id,
                code_id: codeData?.id,
                image_path: filename,
                status: 'pending'
            });

        if (dbError) throw dbError;

        setStep("success");
        success("Page scanned successfully!");

    } catch (err) {
        logger.error("Upload error:", err);
        toastError("Failed to upload scan. Please try again.");
        setStep("preview"); // Go back to preview
    }
  };

  const resetFlow = () => {
    setStep("permission");
    setScannedCode(null);
    setBookInfo(null);
    setCapturedImage(null);
    setCameraError(null);
    setManualCode("");
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-black">
      
      <div className="container mx-auto px-4 py-20 max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
            <h1 className="font-heading text-3xl uppercase tracking-tighter mb-2">
                Page Scanner
            </h1>
            <p className="font-mono text-xs text-gray-400 uppercase tracking-widest">
                {step === "permission" && "Start Scanning"}
                {step === "qr" && "Step 1: Scan Book Code"}
                {step === "capture" && "Step 2: Capture Page"}
                {step === "preview" && "Step 3: Verify & Upload"}
                {step === "success" && "Scan Complete"}
            </p>
        </div>

        {/* Content Area */}
        <div className="bg-[#111] border border-[#333] relative overflow-hidden aspect-[3/4] flex flex-col items-center justify-center">
            
            {/* Step 0: Permission Primer */}
            {step === "permission" && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                        <Camera size={40} className="text-primary" />
                    </div>
                    <h3 className="font-heading text-lg uppercase mb-3 text-white">Camera Access Needed</h3>
                    <p className="text-gray-400 font-mono text-xs mb-8 max-w-xs leading-relaxed">
                        To scan your book code and capture your coloring page, we need access to your device&apos;s camera.
                    </p>
                    <div className="space-y-3 w-full max-w-xs">
                        <Button 
                            onClick={() => setStep("qr")} 
                            className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-heading uppercase tracking-widest"
                        >
                            Enable Camera
                        </Button>
                        <button 
                            onClick={() => {
                                setStep("qr");
                                setUseCamera(false);
                            }}
                            className="text-xs font-mono text-gray-500 uppercase hover:text-white transition-colors"
                        >
                            Or enter code manually
                        </button>
                    </div>
                </div>
            )}
            
            {/* Insecure Context Warning */}
            {!secureLoading && !isSecure && step !== "permission" && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mb-6">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="font-heading text-xl uppercase mb-3 text-yellow-500">Secure Connection Required</h3>
                    <p className="text-gray-400 font-mono text-xs mb-6 max-w-xs leading-relaxed">
                        Camera access requires HTTPS. You&apos;re accessing this page over an insecure connection.
                    </p>
                    <div className="bg-[#1a1a1a] border border-[#333] p-4 text-left w-full max-w-xs">
                        <p className="text-[10px] text-primary font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Smartphone size={12} /> On Your Phone
                        </p>
                        <ol className="text-xs text-gray-400 font-mono space-y-2 list-decimal list-inside">
                            <li>Open Chrome and go to <span className="text-white">chrome://flags</span></li>
                            <li>Search for &quot;insecure origins&quot;</li>
                            <li>Add: <span className="text-primary break-all">{typeof window !== 'undefined' ? window.location.origin : ''}</span></li>
                            <li>Restart Chrome</li>
                        </ol>
                    </div>
                </div>
            )}

            {/* Camera/Manual Toggle */}
            {step === "qr" && isSecure ? <button
                    onClick={toggleCameraMode}
                    className="absolute top-4 right-4 z-50 bg-black/70 backdrop-blur-sm border border-[#333] p-2 hover:bg-[#222] transition-colors"
                    title={useCamera ? "Switch to manual entry" : "Switch to camera"}
                >
                    {useCamera ? <Keyboard size={20} className="text-gray-400" /> : <Camera size={20} className="text-primary" />}
                </button> : null}

            {/* Step 1a: QR Scanner (Camera Mode) */}
            {step === "qr" && isSecure && useCamera ? <div className="w-full h-full relative">
                    <Scanner 
                        onScan={(result) => {
                            handleScan(result);
                        }}
                        onError={(error: unknown) => {
                            logger.error("Scanner error:", error);
                            const msg = (error as Error)?.message || (error as Error)?.name || "Could not access camera";
                            setCameraError(msg);
                            toastError("Camera error: " + msg);
                        }}
                        scanDelay={500}
                        constraints={{
                            facingMode: "environment",
                            width: { ideal: 1280 },
                            height: { ideal: 720 }
                        }}
                        styles={{ 
                            container: { width: "100%", height: "100%", position: "relative" },
                            video: { width: "100%", height: "100%", objectFit: "cover" }
                        }}
                        components={{
                            audio: false,
                            torch: false,
                        } as any}
                    />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-64 h-64 border-2 border-primary/50 rounded-lg animate-pulse relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
                        </div>
                    </div>
                    <div className="absolute bottom-8 left-0 right-0 text-center text-sm font-mono bg-black/50 py-2 backdrop-blur-sm">
                        {cameraError ? (
                            <div className="px-4">
                                <p className="text-red-400 mb-2">Camera Error: {cameraError}</p>
                                {cameraError.toLowerCase().includes('denied') || cameraError.toLowerCase().includes('permission') ? (
                                    <p className="text-xs text-gray-400">
                                        Go to Safari → Settings → Websites → Camera and allow access for localhost
                                    </p>
                                ) : null}
                            </div>
                        ) : (
                            "Point camera at the QR code"
                        )}
                    </div>
                </div> : null}
            
            {/* Step 1b: Manual Code Entry */}
            {step === "qr" && isSecure && !useCamera ? <div className="w-full h-full flex flex-col items-center justify-center p-8">
                    <CameraOff size={48} className="text-gray-600 mb-6" />
                    <h3 className="font-heading text-lg uppercase mb-2">Manual Entry</h3>
                    <p className="text-gray-500 font-mono text-xs mb-6 text-center">
                        Enter the code from your coloring book
                    </p>
                    <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-4">
                        <Input
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                            placeholder="ENTER CODE"
                            className="bg-black border-[#333] text-white font-mono text-lg tracking-[0.3em] uppercase h-14 text-center focus:border-primary"
                            maxLength={20}
                        />
                        <Button 
                            type="submit" 
                            disabled={!manualCode.trim()}
                            className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-heading uppercase"
                        >
                            Verify Code
                        </Button>
                    </form>
                </div> : null}

            {/* Loading state while checking security */}
            {step === "qr" && secureLoading ? <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 size={32} className="animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-400 font-mono text-xs">Initializing camera...</p>
                    </div>
                </div> : null}

            {/* Step 2: Capture Page */}
            {step === "capture" && (
                <div className="w-full h-full relative bg-black flex flex-col items-center justify-center p-8 text-center">
                    
                    <div className="mb-8 relative">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 mx-auto">
                            <Camera size={40} className="text-gray-400" />
                        </div>
                        <h3 className="font-heading text-xl uppercase mb-2">Capture Page</h3>
                        <p className="text-gray-500 font-mono text-xs max-w-xs mx-auto">
                            Take a clear photo of your colored page. Ensure good lighting and that the whole page is visible.
                        </p>
                    </div>

                    <label className="cursor-pointer">
                        <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            onChange={handleFileSelect}
                            className="hidden" 
                        />
                        <div className="bg-primary text-black font-heading uppercase tracking-wider px-8 py-4 rounded-full flex items-center gap-3 hover:bg-white transition-colors">
                            <Camera size={20} />
                            Open Camera
                        </div>
                    </label>
                    
                    <div className="mt-4">
                        <label className="cursor-pointer text-xs font-mono uppercase text-gray-500 hover:text-white transition-colors underline">
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileSelect}
                                className="hidden" 
                            />
                            or upload from gallery
                        </label>
                    </div>

                    {bookInfo ? <div className="mt-8 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg w-full max-w-xs">
                            <div className="flex items-center gap-3 justify-center">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <div className="text-xs font-mono uppercase">
                                    <span className="text-gray-400">Verified:</span> <span className="text-white">{bookInfo.title}</span>
                                    {bookInfo.page ? <span className="text-primary ml-2">PG.{bookInfo.page}</span> : null}
                                </div>
                            </div>
                        </div> : null}
                </div>
            )}

            {/* Step 3: Preview */}
            {(step === "preview" || step === "uploading") && capturedImage ? <div className="w-full h-full relative">
                    <Image 
                        src={capturedImage} 
                        alt="Captured page" 
                        fill 
                        className="object-cover"
                    />
                    
                    {/* 3x3 Grid Overlay */}
                    <div className="absolute inset-0 pointer-events-none opacity-30">
                        <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-r border-b border-white"></div>
                            <div className="border-b border-white"></div>
                            <div className="border-r border-white"></div>
                            <div className="border-r border-white"></div>
                            <div></div>
                        </div>
                    </div>

                    <div className="absolute inset-0 bg-black/10"></div>
                </div> : null}

            {/* Step 4: Success */}
            {step === "success" && (
                <div className="flex flex-col items-center justify-center p-6 text-center relative">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,79,0,0.1),transparent)] animate-pulse pointer-events-none"></div>
                    
                    {/* 3D Trophy Celebration */}
                    <div className="w-40 h-40 mb-6 relative">
                        <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none z-10 rounded-full"></div>
                        <TrophyCanvas 
                            size="small" 
                            rarity="Rare"
                            autoRotate={true}
                            isInteractive={false}
                        />
                        {/* Sparkle effect */}
                        <div className="absolute -top-2 -right-2 text-primary animate-bounce">
                            <Sparkles size={20} />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-500 font-mono text-[10px] uppercase tracking-widest mb-2">
                        <Check size={12} />
                        <span>Success</span>
                    </div>
                    
                    <h3 className="font-heading text-2xl uppercase mb-2 text-white">Scan Uploaded!</h3>
                    <p className="text-gray-400 font-mono text-xs mb-6 max-w-xs">
                        Your page has been submitted for verification. A new trophy may be waiting for you in your collection!
                    </p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <Link href="/trophy-room" className="w-full">
                            <Button className="w-full h-12 bg-primary text-black hover:bg-primary/90 font-heading uppercase tracking-widest">
                                <Trophy size={16} className="mr-2" /> View Trophy Room
                            </Button>
                        </Link>
                        <Button 
                            onClick={resetFlow} 
                            variant="outline" 
                            className="w-full h-10 border-[#333] text-gray-400 hover:text-white hover:border-white font-mono text-xs uppercase tracking-widest"
                        >
                            Scan Another Page
                        </Button>
                    </div>
                </div>
            )}

            {/* Hidden Canvas for Capture */}
            <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Buttons for Preview */}
        {step === "preview" && (
            <div className="grid grid-cols-2 gap-4 mt-6">
                <Button onClick={retakePhoto} variant="outline" className="h-12 border-[#333] hover:bg-[#222]">
                    <RotateCcw size={16} className="mr-2" /> Retake
                </Button>
                <Button onClick={handleUpload} className="h-12 bg-primary text-black hover:bg-primary/90">
                    <Upload size={16} className="mr-2" /> Upload Scan
                </Button>
            </div>
        )}

        {/* Action Buttons for Uploading */}
        {step === "uploading" && (
             <div className="mt-6">
                <Button disabled className="w-full h-12 bg-[#222] text-white">
                    <Loader2 size={16} className="mr-2 animate-spin" /> Uploading...
                </Button>
             </div>
        )}

        {/* Cancel Button */}
        {step !== "success" && step !== "uploading" && step !== "permission" && (
            <div className="mt-6 text-center relative z-50">
                <button 
                    type="button"
                    onClick={() => {
                        router.back();
                    }} 
                    className="text-gray-500 text-xs font-mono uppercase tracking-widest hover:text-white transition-colors py-2 px-4"
                >
                    Cancel
                </button>
            </div>
        )}

      </div>
    </div>
  );
}
