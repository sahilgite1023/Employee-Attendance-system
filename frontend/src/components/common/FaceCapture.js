'use client';

import { useEffect, useRef, useState } from 'react';

// ─── face-api is browser-only, loaded dynamically ───────────────────────────
let faceapi = null;
let faceapiPromise = null;

async function loadModels() {
  if (
    faceapi &&
    faceapi.nets?.tinyFaceDetector?.isLoaded &&
    faceapi.nets?.faceLandmark68Net?.isLoaded &&
    faceapi.nets?.faceRecognitionNet?.isLoaded
  ) {
    return faceapi;
  }

  if (!faceapiPromise) {
    faceapiPromise = (async () => {
      const mod = await import('@vladmandic/face-api');
      const api = mod.nets ? mod : (mod.default || mod);
      faceapi = api;

      // Initialize WebGL/CPU backend before inference to bypass missing wasm binary
      try {
        if (api.tf) {
          try {
            await api.tf.setBackend('webgl');
          } catch {
            await api.tf.setBackend('cpu');
          }
          await api.tf.ready();
        }
      } catch (backendErr) {
        console.warn('[FaceCapture] Backend init warning:', backendErr);
      }

      const MODEL_URL = '/models';
      console.log('[FaceCapture] Loading face-api models from', MODEL_URL);

      await Promise.all([
        api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        api.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        api.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      if (!api.nets.tinyFaceDetector.isLoaded) {
        throw new Error('TinyFaceDetector model failed to load from /models');
      }

      console.log('[FaceCapture] Face models loaded successfully');
      return api;
    })().catch((err) => {
      faceapiPromise = null; // allow retry on failure
      throw err;
    });
  }

  return faceapiPromise;
}

/**
 * FaceCapture component
 *
 * Props:
 *   mode         - 'enroll' | 'verify'
 *   onCapture    - called with (descriptor: number[]) on success
 *   onError      - called with (message: string) on error
 *   onCancel     - called when user cancels
 *   enrollSamples - number of frames to average for enrollment (default 5)
 */
export default function FaceCapture({
  mode = 'verify',
  onCapture,
  onError,
  onCancel,
  enrollSamples = 5,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectionLoopRef = useRef(null);
  const samplesRef = useRef([]);
  const doneRef = useRef(false);

  // Store callbacks in refs so the detection loop always uses the latest
  const onCaptureRef = useRef(onCapture);
  const onErrorRef = useRef(onError);
  const onCancelRef = useRef(onCancel);
  onCaptureRef.current = onCapture;
  onErrorRef.current = onError;
  onCancelRef.current = onCancel;

  const [status, setStatus] = useState('loading'); // loading | detecting | done | error
  const [statusText, setStatusText] = useState('Loading face models…');
  const [faceDetected, setFaceDetected] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);

  // ── Stop camera and detection loop ────────────────────────────────────────
  function stopCamera() {
    if (detectionLoopRef.current) {
      clearTimeout(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }

  // ── Initialise: load models, open camera, start detection ─────────────────
  useEffect(() => {
    let cancelled = false;
    let isProcessing = false;
    samplesRef.current = [];
    doneRef.current = false;

    async function init() {
      try {
        setStatus('loading');
        setStatusText('Loading face models…');
        await loadModels();
        if (cancelled) return;

        setStatusText('Requesting camera access…');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay may resolve asynchronously on user action
          }
        }

        setStatus('detecting');
        setStatusText(
          mode === 'enroll'
            ? 'Look at the camera. Hold still while we capture your face.'
            : 'Look at the camera to verify your identity.'
        );

        // Start sequential, non-overlapping detection loop
        const runDetection = async () => {
          if (doneRef.current || cancelled) return;
          const video = videoRef.current;

          if (
            video &&
            video.readyState >= 2 &&
            video.videoWidth > 0 &&
            faceapi?.nets?.tinyFaceDetector?.isLoaded &&
            !isProcessing
          ) {
            isProcessing = true;
            try {
              const detection = await faceapi
                .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

              if (doneRef.current || cancelled) return;

              if (!detection) {
                setFaceDetected(false);
                setStatusText('No face detected. Position your face in the frame.');
                const canvas = canvasRef.current;
                if (canvas) {
                  const ctx = canvas.getContext('2d');
                  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              } else {
                setFaceDetected(true);

                // Draw detection overlay matching displayed size
                const canvas = canvasRef.current;
                if (canvas && video) {
                  const displaySize = {
                    width: video.offsetWidth || 320,
                    height: video.offsetHeight || 240,
                  };
                  faceapi.matchDimensions(canvas, displaySize);
                  const resized = faceapi.resizeResults(detection, displaySize);
                  faceapi.draw.drawDetections(canvas, resized);
                }

                if (mode === 'verify') {
                  // Single capture for verification
                  doneRef.current = true;
                  setStatus('done');
                  setStatusText('Face captured!');
                  stopCamera();
                  onCaptureRef.current?.(Array.from(detection.descriptor));
                  return;
                } else {
                  // Enrollment: collect multiple samples
                  samplesRef.current.push(Array.from(detection.descriptor));
                  const count = samplesRef.current.length;
                  setSampleCount(count);
                  setCaptureProgress(Math.round((count / enrollSamples) * 100));
                  setStatusText(`Capturing… ${count}/${enrollSamples} samples`);

                  if (count >= enrollSamples) {
                    doneRef.current = true;
                    setStatus('done');
                    setStatusText('Enrollment complete!');
                    stopCamera();

                    // Average and normalize the descriptors
                    const avg = new Array(128).fill(0);
                    for (const d of samplesRef.current) {
                      for (let i = 0; i < 128; i++) avg[i] += d[i];
                    }
                    let sumSq = 0;
                    for (let i = 0; i < 128; i++) {
                      avg[i] /= samplesRef.current.length;
                      sumSq += avg[i] * avg[i];
                    }
                    const norm = Math.sqrt(sumSq) || 1;
                    for (let i = 0; i < 128; i++) {
                      avg[i] /= norm;
                    }
                    onCaptureRef.current?.(avg);
                    return;
                  }
                }
              }
            } catch (frameErr) {
              console.warn('[FaceCapture] Frame processing error:', frameErr);
            } finally {
              isProcessing = false;
            }
          }

          if (!doneRef.current && !cancelled) {
            detectionLoopRef.current = setTimeout(runDetection, 180);
          }
        };

        detectionLoopRef.current = setTimeout(runDetection, 200);
      } catch (err) {
        if (cancelled) return;
        console.error('[FaceCapture] init error:', err);
        setStatus('error');
        const msg =
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Camera access denied. Please allow camera access in your browser settings.'
            : err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError'
            ? 'No camera found. Please connect a camera and try again.'
            : (err.message && err.message.includes('fetch'))
            ? 'Failed to load face detection models. Please refresh and check your network.'
            : 'Failed to start camera. Please try again.';
        setStatusText(msg);
        onErrorRef.current?.(msg);
      }
    }

    init();

    return () => {
      cancelled = true;
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, enrollSamples]);

  const handleCancel = () => {
    stopCamera();
    onCancelRef.current?.();
  };

  // ── Status colour ──────────────────────────────────────────────────────────
  const overlayColor = faceDetected ? 'border-success-400' : 'border-warning-400';

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Camera preview */}
      <div className={`relative rounded-xl overflow-hidden border-4 ${overlayColor} transition-colors`}
           style={{ width: 320, height: 240 }}>
        <video
          ref={videoRef}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Face guide oval */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`rounded-full border-2 border-dashed transition-colors ${
              faceDetected ? 'border-success-400' : 'border-white/50'
            }`}
            style={{ width: 160, height: 200 }}
          />
        </div>

        {/* Status badge */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
              status === 'error'
                ? 'bg-danger-600'
                : faceDetected
                ? 'bg-success-600'
                : 'bg-slate-700/80'
            }`}
          >
            {faceDetected ? '✓ Face detected' : status === 'loading' ? '⏳ Loading…' : '👤 No face'}
          </span>
        </div>
      </div>

      {/* Status text */}
      <p className="text-sm text-slate-600 text-center max-w-xs">{statusText}</p>

      {/* Enrollment progress bar */}
      {mode === 'enroll' && status === 'detecting' && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Capturing samples</span>
            <span>{sampleCount}/{enrollSamples}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${captureProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Cancel button */}
      {status !== 'done' && (
        <button
          type="button"
          onClick={handleCancel}
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
