'use client';

import { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import styles from './ImageCropper.module.scss';

interface ImageCropperProps {
  imageUrl: string;
  aspectRatio: number; // e.g., 16/9, 4/3, 1/1
  onCropComplete: (croppedImageBlob: Blob, cropData: Area) => void;
  onCancel: () => void;
  recommendedWidth: number;
  recommendedHeight: number;
}

/**
 * ImageCropper Component
 *
 * Allows users to crop images to a specific aspect ratio using react-easy-crop.
 * Returns both the cropped image blob and crop coordinates for storage.
 */
export default function ImageCropper({
  imageUrl,
  aspectRatio,
  onCropComplete,
  onCancel,
  recommendedWidth,
  recommendedHeight,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (location: Point) => {
    setCrop(location);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleSave = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      onCropComplete(croppedBlob, croppedAreaPixels);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.cropperModal}>
      <div className={styles.cropperOverlay} onClick={onCancel} />
      <div className={styles.cropperContainer}>
        <div className={styles.cropperHeader}>
          <h2>Crop Image</h2>
          <p>
            Adjust the image to fit the recommended {recommendedWidth} × {recommendedHeight} dimensions
          </p>
        </div>

        <div className={styles.cropperWrapper}>
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteInternal}
            objectFit="contain"
          />
        </div>

        <div className={styles.cropperControls}>
          <div className={styles.zoomControl}>
            <label htmlFor="zoom-slider">Zoom</label>
            <input
              id="zoom-slider"
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>

          <div className={styles.cropperButtons}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={styles.saveButton}
              disabled={isProcessing || !croppedAreaPixels}
            >
              {isProcessing ? 'Processing...' : 'Crop & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper function to create a cropped image blob from the original image
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/webp', 0.9);
  });
}

/**
 * Helper function to load an image
 */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}
