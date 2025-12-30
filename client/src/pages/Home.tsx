import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Download, 
  ImageIcon, 
  Loader2, 
  Upload, 
  X, 
  Sparkles,
  Check,
  ArrowRight,
  Zap
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [processedUrl, setProcessedUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [sliderPosition, setSliderPosition] = useState(50);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeBgMutation = trpc.bgRemoval.removeBackground.useMutation();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    } else {
      toast.error("Please upload a valid image file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setProcessedUrl("");
    setBackgroundColor("#FFFFFF");
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!selectedFile || !previewUrl) return;

    setIsProcessing(true);
    try {
      const result = await removeBgMutation.mutateAsync({
        base64Data: previewUrl,
        mimeType: selectedFile.type,
      });

      setProcessedUrl(result.processedUrl);
      toast.success("Background removed successfully!");
    } catch (error) {
      toast.error("Failed to remove background. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedUrl) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (backgroundColor && backgroundColor !== "transparent" && ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx?.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bettercallghaith-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, "image/png");
    };

    img.src = processedUrl;
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setProcessedUrl("");
    setBackgroundColor("#FFFFFF");
    setSliderPosition(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const colorPresets = [
    { color: "#FFFFFF", label: "White" },
    { color: "transparent", label: "None" },
    { color: "#000000", label: "Black" },
    { color: "#F3F4F6", label: "Gray" },
  ];

  return (
    <div className="min-h-screen gradient-bg noise">
      {/* Ambient glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 glass border-b border-white/5">
        <div className="container py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center glow-primary">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">bettercallghaith</h1>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">AI-Powered Background Removal</span>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container py-12">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!selectedFile ? (
              /* Upload Zone */
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Hero Section */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm text-muted-foreground mb-6">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Free • No Sign-up Required
                    </span>
                  </motion.div>
                  <motion.h2 
                    className="text-4xl md:text-6xl font-bold mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="gradient-text">Remove Background</span>
                    <br />
                    <span className="text-foreground">in Seconds</span>
                  </motion.h2>
                  <motion.p 
                    className="text-lg text-muted-foreground max-w-xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Upload your image and let AI do the magic. Get HD quality results with transparent or custom backgrounds.
                  </motion.p>
                </div>

                {/* Upload Card */}
                <motion.div
                  className={`relative border-gradient p-8 md:p-12 rounded-2xl hover-lift transition-all duration-300 ${
                    isDragging ? "glow-primary scale-[1.02]" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <motion.div 
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center mb-6 ${
                        isDragging ? "pulse-glow" : ""
                      }`}
                      animate={isDragging ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      <Upload className={`w-10 h-10 text-primary transition-transform ${isDragging ? "scale-110" : ""}`} />
                    </motion.div>
                    <h3 className="text-2xl font-semibold mb-2">
                      {isDragging ? "Drop it here!" : "Upload Your Image"}
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-md">
                      Drag and drop your image here, or click the button below
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 glow-subtle transition-all duration-300 hover:scale-105"
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Select Image
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>

                {/* Features */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {[
                    { icon: Zap, title: "Fast Processing", desc: "Results in seconds" },
                    { icon: Sparkles, title: "HD Quality", desc: "High resolution output" },
                    { icon: Check, title: "Free Forever", desc: "No hidden costs" },
                  ].map((feature, i) => (
                    <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4 hover-scale">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            ) : (
              /* Processing Zone */
              <motion.div
                key="processing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Preview Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Image */}
                  <motion.div 
                    className="glass-card rounded-2xl p-4 hover-scale"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Original</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Before</span>
                    </div>
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/50">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </motion.div>

                  {/* Processed Image */}
                  <motion.div 
                    className="glass-card rounded-2xl p-4 hover-scale"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                        {processedUrl ? "Result" : "Processing"}
                      </h3>
                      {processedUrl && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Done
                        </span>
                      )}
                    </div>
                    <div
                      className="relative aspect-square rounded-xl overflow-hidden"
                      style={{
                        backgroundColor: backgroundColor === "transparent" ? undefined : backgroundColor,
                      }}
                    >
                      {!processedUrl ? (
                        <div className={`w-full h-full flex items-center justify-center ${backgroundColor === "transparent" ? "checkerboard" : ""}`}>
                          <div className="text-center">
                            {isProcessing ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 pulse-glow">
                                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  AI is working its magic...
                                </p>
                              </motion.div>
                            ) : (
                              <div className="checkerboard w-full h-full absolute inset-0 flex items-center justify-center">
                                <p className="text-sm text-muted-foreground bg-background/80 px-4 py-2 rounded-lg">
                                  Click "Remove Background" to start
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`w-full h-full ${backgroundColor === "transparent" ? "checkerboard" : ""}`}>
                          <img
                            src={processedUrl}
                            alt="Processed"
                            className="w-full h-full object-contain relative z-10"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Before/After Slider */}
                {processedUrl && (
                  <motion.div 
                    className="glass-card rounded-2xl p-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Compare</h3>
                    <div className="relative aspect-video rounded-xl overflow-hidden">
                      <div className="absolute inset-0 checkerboard">
                        <img
                          src={processedUrl}
                          alt="After"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                      >
                        <img
                          src={previewUrl}
                          alt="Before"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderPosition}
                        onChange={(e) => setSliderPosition(Number(e.target.value))}
                        className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-10 opacity-0 cursor-ew-resize h-full"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/80 pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-4 bg-gray-400 rounded" />
                            <div className="w-0.5 h-4 bg-gray-400 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Controls */}
                <motion.div 
                  className="glass-card rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                      {!processedUrl ? (
                        <Button
                          onClick={handleRemoveBackground}
                          disabled={isProcessing}
                          size="lg"
                          className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 glow-subtle"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5 mr-2" />
                              Remove Background
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          {/* Color Presets */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Background:</span>
                            <div className="flex gap-1">
                              {colorPresets.map((preset) => (
                                <button
                                  key={preset.label}
                                  onClick={() => setBackgroundColor(preset.color)}
                                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                                    backgroundColor === preset.color
                                      ? "border-primary scale-110"
                                      : "border-transparent hover:border-muted-foreground/50"
                                  }`}
                                  style={{
                                    backgroundColor: preset.color === "transparent" ? undefined : preset.color,
                                  }}
                                  title={preset.label}
                                >
                                  {preset.color === "transparent" && (
                                    <div className="w-full h-full rounded-md checkerboard" />
                                  )}
                                </button>
                              ))}
                              <input
                                type="color"
                                value={backgroundColor === "transparent" ? "#ffffff" : backgroundColor}
                                onChange={(e) => setBackgroundColor(e.target.value)}
                                className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                                title="Custom color"
                              />
                            </div>
                          </div>

                          <Button 
                            onClick={handleDownload} 
                            size="lg" 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-500/90 hover:to-emerald-600/90"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            Download PNG
                          </Button>
                        </>
                      )}
                    </div>

                    <Button 
                      onClick={handleReset} 
                      variant="outline" 
                      size="lg"
                      className="border-muted-foreground/20 hover:bg-muted/50"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Start Over
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-12 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Free background removal tool powered by AI • No registration required</p>
        </div>
      </footer>
    </div>
  );
}
