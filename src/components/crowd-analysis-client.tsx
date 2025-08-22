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
  SwitchCamera,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const ANALYSIS_INTERVAL = 5000; // 5 seconds

export default function CrowdAnalysisClient() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(undefined);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const getVideoDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        console.log("enumerateDevices() not supported.");
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((device) => device.kind === 'videoinput');
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.error("Error enumerating video devices:", err);
    }
  }, [selectedDeviceId]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsCameraOn(false);
    setIsLoading(false);
    setAnalysisResult(null);
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    stopCamera(); // Stop any existing stream
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints: MediaStreamConstraints = {
          video: deviceId ? { deviceId: { exact: deviceId } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
        await getVideoDevices(); // Refresh device list after getting permission
      } else {
        throw new Error("Camera not supported");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      let message = "Could not access the camera.";
      if (err instanceof Error && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        message = "Camera permission denied. Please enable it in your browser settings.";
      }
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
      stopCamera();
    }
  }, [toast, stopCamera, getVideoDevices]);
  
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
    const analysisLoop = async () => {
        if(isCameraOn) {
            await performAnalysis();
            timeoutRef.current = setTimeout(analysisLoop, ANALYSIS_INTERVAL);
        }
    }
    if (isCameraOn) {
      analysisLoop();
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isCameraOn, performAnalysis]);

  useEffect(() => {
    getVideoDevices();
  }, [getVideoDevices]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera(selectedDeviceId);
    }
  };

  const handleCameraChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraOn) {
      startCamera(deviceId);
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
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button onClick={toggleCamera} className="w-full" disabled={isLoading}>
                  {isLoading ? (
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
                 {videoDevices.length > 1 && (
                  <Select onValueChange={handleCameraChange} value={selectedDeviceId} disabled={isLoading}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SwitchCamera className="mr-2 h-4 w-4"/>
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoDevices.map((device) => (
                        <SelectItem key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${videoDevices.indexOf(device) + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
