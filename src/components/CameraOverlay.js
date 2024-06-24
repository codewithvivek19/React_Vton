// src/components/CameraOverlay.js
import React, { useRef, useEffect } from 'react';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

const CameraOverlay = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadPosenet = async () => {
      const net = await posenet.load();
      return net;
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });
      videoRef.current.srcObject = stream;
      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          resolve(videoRef.current);
        };
      });
      videoRef.current.play();
    };

    const drawOverlay = async () => {
      const net = await loadPosenet();

      const overlayImage = new Image();
      overlayImage.src = 'path/to/your/shirt.png'; // Update the path

      const detectPose = async () => {
        const pose = await net.estimateSinglePose(videoRef.current, {
          flipHorizontal: false
        });

        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        if (overlayImage.complete) {
          const nose = pose.keypoints.find(point => point.part === 'nose');
          const leftShoulder = pose.keypoints.find(point => point.part === 'leftShoulder');
          const rightShoulder = pose.keypoints.find(point => point.part === 'rightShoulder');

          if (nose && leftShoulder && rightShoulder) {
            const overlayWidth = Math.abs(leftShoulder.position.x - rightShoulder.position.x) * 2;
            const overlayHeight = overlayWidth * overlayImage.height / overlayImage.width;
            const overlayX = nose.position.x - overlayWidth / 2;
            const overlayY = nose.position.y - overlayHeight / 2;

            ctx.drawImage(overlayImage, overlayX, overlayY, overlayWidth, overlayHeight);
          }
        }

        requestAnimationFrame(detectPose);
      };

      overlayImage.onload = detectPose;
    };

    setupCamera().then(() => drawOverlay());
  }, []);

  return (
    <div>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} width="640" height="480" />
    </div>
  );
};

export default CameraOverlay;
