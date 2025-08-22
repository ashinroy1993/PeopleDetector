"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { analyzeFrame, type AnalysisResult } from "@/app/actions";
import {
  Users,
  Move,
  BadgePercent,
  Video,
  VideoOff,
  CameraOff,
  Loader2,
} from "lucide-react";

const ANALYSIS_INTERVAL = 2000; // 2 seconds

export default function CrowdAnalysisClient() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsCameraOn(false);
    setIsLoading(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current && canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
            }
          };
        }
        setIsCameraOn(true);
      } else {
        throw new Error("Camera not supported");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera.";
      if (err instanceof Error && err.name === "NotAllowedError") {
        message = "Camera permission denied. Please enable it in your browser settings.";
      }
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
      stopCamera();
    }
  }, [toast, stopCamera]);

  const performAnalysis = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }
    
    setIsLoading(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameDataUri = canvas.toDataURL("image/jpeg");
      
      try {
        const result = await analyzeFrame(frameDataUri);
        setAnalysisResult(result);
      } catch (error) {
        console.error("Analysis failed", error);
        toast({
          title: "Analysis Failed",
          description: "Could not analyze the camera feed.",
          variant: "destructive",
        });
        stopCamera();
      } finally {
        setIsLoading(false);
      }
    }
  }, [toast, stopCamera]);

  useEffect(() => {
    if (isCameraOn && !intervalRef.current) {
      intervalRef.current = setInterval(performAnalysis, ANALYSIS_INTERVAL);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isCameraOn, performAnalysis]);


  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="relative aspect-video bg-muted/50 rounded-lg overflow-hidden flex items-center justify-center border">
              <video ref={videoRef} playsInline autoPlay muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
              {!isCameraOn && (
                <div className="text-center absolute">
                  <CameraOff className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">Camera is off</p>
                </div>
              )}
               <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-accent">Live Analysis</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">People Detected</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analysisResult?.personCount ?? '-'}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Dominant Direction</CardTitle>
                      <Move className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold capitalize">{analysisResult?.direction ?? '-'}</div>
                    </CardContent>
                  </Card>
                  <Card className="col-span-1 sm:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Confidence</CardTitle>
                      <BadgePercent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analysisResult ? `${(analysisResult.confidence * 100).toFixed(0)}%` : '-'}</div>
                      <Progress value={analysisResult ? analysisResult.confidence * 100 : 0} className="mt-2" />
                    </CardContent>
                  </Card>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={toggleCamera} className="w-full" disabled={isLoading && isCameraOn}>
                  {isLoading && isCameraOn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : isCameraOn ? (
                    <>
                      <VideoOff className="mr-2 h-4 w-4" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Video className="mr-2 h-4 w-4" />
                      Start Camera
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center mt-4 text-sm text-muted-foreground">
        <p>API endpoint for aggregated data: <a href="/api/crowd-analysis" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">/api/crowd-analysis</a></p>
      </div>
    </div>
  );
}
