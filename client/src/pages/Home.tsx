import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Download, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
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
      // Use the data URL directly for processing
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

      // Fill background color if selected
      if (backgroundColor && ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw processed image
      ctx?.drawImage(img, 0, 0);

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `bg-removed-${Date.now()}.png`;
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
    setBackgroundColor("");
    setSliderPosition(50);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">BG Remover</h1>
          </div>
          <p className="text-sm text-muted-foreground hidden sm:block">
            Free AI-powered background removal
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        <div className="max-w-6xl mx-auto">
          {!selectedFile ? (
            /* Upload Zone */
            <Card className="p-12 border-2 border-dashed border-border hover:border-primary/50 transition-colors">
              <div
                className={`flex flex-col items-center justify-center text-center ${
                  isDragging ? "opacity-50" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Upload className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3">Upload Your Image</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Drag and drop your image here, or click the button below to select a file. No sign-up required!
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
                  className="text-lg px-8 py-6"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select Image
                </Button>
              </div>
            </Card>
          ) : (
            /* Processing Zone */
            <div className="space-y-6">
              {/* Preview and Result */}
              <Card className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Image */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Original</h3>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={previewUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {/* Processed Image */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      {processedUrl ? "Result" : "Processing..."}
                    </h3>
                    <div
                      className="relative aspect-square rounded-lg overflow-hidden"
                      style={{
                        backgroundColor: backgroundColor,
                      }}
                    >
                      {!processedUrl ? (
                        <div className="w-full h-full flex items-center justify-center bg-muted checkerboard">
                          <div className="text-center">
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                  Removing background...
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Click "Remove Background" to start
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full">
                          <img
                            src={processedUrl}
                            alt="Processed"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Before/After Slider */}
                {processedUrl && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Compare</h3>
                    <div className="relative aspect-video rounded-lg overflow-hidden">
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
                        className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-10 opacity-0 cursor-ew-resize"
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                          <div className="w-1 h-4 bg-gray-400 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Controls */}
              <Card className="p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button
                      onClick={handleRemoveBackground}
                      disabled={isProcessing || !!processedUrl}
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5 mr-2" />
                          Remove Background
                        </>
                      )}
                    </Button>

                    {processedUrl && (
                      <>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Background:</label>
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-12 h-10 rounded border border-border cursor-pointer"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBackgroundColor("#FFFFFF")}
                          >
                            White
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBackgroundColor("transparent")}
                          >
                            Transparent
                          </Button>
                        </div>

                        <Button onClick={handleDownload} size="lg" variant="default">
                          <Download className="w-5 h-5 mr-2" />
                          Download PNG
                        </Button>
                      </>
                    )}
                  </div>

                  <Button onClick={handleReset} variant="outline" size="lg">
                    <X className="w-5 h-5 mr-2" />
                    Start Over
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>Free background removal tool powered by AI. No registration required.</p>
        </div>
      </footer>
    </div>
  );
}
