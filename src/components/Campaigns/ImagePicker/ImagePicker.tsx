'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Area } from 'react-easy-crop';
import ImageCropper from '../ImageCropper/ImageCropper';
import { isAspectRatioMatch, formatAspectRatio } from '@/lib/image-transformations';
import styles from './ImagePicker.module.scss';

interface CompanyImage {
  id: string;
  fileName: string;
  publicUrl: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  fileSize: number;
  mimeType: string;
  usageCount: number;
  createdAt: string;
}

interface ImagePickerProps {
  value: string | null; // Current image URL
  onChange: (url: string, imageId?: string) => void;
  companyId: string;
  campaignId: string;
  aspectRatio?: number; // Required aspect ratio (e.g., 16/9 = 1.78)
  recommendedWidth: number;
  recommendedHeight: number;
  label: string;
  imageField: string; // 'hero_image', 'features_image', etc.
}

export default function ImagePicker({
  value,
  onChange,
  companyId,
  campaignId,
  aspectRatio,
  recommendedWidth,
  recommendedHeight,
  label,
  imageField,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [libraryImages, setLibraryImages] = useState<CompanyImage[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{
    url: string;
    file?: File;
    libraryImageId?: string;
    originalFileName?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('image-library');

  // Folder options for dropdown
  const FOLDER_OPTIONS = [
    { value: 'image-library', label: 'Image Library' },
    { value: '', label: 'All Images' },
    { value: 'icon-logos', label: 'Icon Logos' },
    { value: 'alternate-logos', label: 'Alternate Logos' },
    { value: 'logos', label: 'Logos' },
    { value: 'photography', label: 'Photography' },
    { value: 'email-logos', label: 'Email Logos' },
  ];

  // Load library images when library tab is active
  useEffect(() => {
    if (activeTab === 'library') {
      loadLibraryImages();
    }
  }, [activeTab, page, search, selectedFolder]);

  const loadLibraryImages = async () => {
    setIsLoadingLibrary(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '12',
      });

      if (search) {
        params.append('search', search);
      }

      // Always include folder param (empty string means "All Images")
      params.append('folder', selectedFolder);

      const response = await fetch(
        `/api/companies/${companyId}/images?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const result = await response.json();
      setLibraryImages(result.data.images);
      setTotalPages(result.data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading library images:', error);
      alert('Failed to load image library');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);

    // Check if aspect ratio enforcement is needed
    if (aspectRatio) {
      // Load image to check dimensions
      const img = new window.Image();
      img.onload = () => {
        const imageRatio = img.width / img.height;
        const needsCropping = !isAspectRatioMatch(
          img.width,
          img.height,
          aspectRatio
        );

        if (needsCropping) {
          // Show cropper
          setImageToCrop({ url: objectUrl, file });
          setShowCropper(true);
        } else {
          // Upload directly
          uploadImage(file);
        }
      };
      img.src = objectUrl;
    } else {
      // No aspect ratio required, upload directly
      uploadImage(file);
    }
  };

  const uploadImage = async (file: File, cropData?: Area) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload to company library
      const response = await fetch(`/api/companies/${companyId}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();

      // Update the form with the new image URL
      onChange(result.data.publicUrl, result.data.id);

      // Refresh library if on that tab
      if (activeTab === 'library') {
        loadLibraryImages();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (croppedBlob: Blob, cropData: Area) => {
    if (!imageToCrop) return;

    // Extract base filename without extension
    // Priority: originalFileName (library) > file.name (upload) > fallback
    const originalName = imageToCrop.originalFileName || imageToCrop.file?.name || 'image.webp';
    const baseName = originalName.replace(/\.[^/.]+$/, '');

    // Convert blob to File as WebP (smaller file size, supports transparency)
    const croppedFile = new File(
      [croppedBlob],
      `${baseName}.webp`,
      { type: 'image/webp' }
    );

    // Close cropper
    setShowCropper(false);
    setImageToCrop(null);

    // Upload the cropped image
    await uploadImage(croppedFile, cropData);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLibraryImageSelect = async (image: CompanyImage) => {
    let width = image.width;
    let height = image.height;

    // If dimensions are missing, load them from the image itself
    if (!width || !height) {
      try {
        const img = new window.Image();
        img.src = image.publicUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        width = img.width;
        height = img.height;
      } catch (error) {
        console.error('Failed to load image dimensions:', error);
        // Fallback: use image without cropping
        onChange(image.publicUrl, image.id);
        return;
      }
    }

    if (aspectRatio && width && height) {
      const needsCropping = !isAspectRatioMatch(
        width,
        height,
        aspectRatio
      );

      if (needsCropping) {
        // Show cropper for library image
        setImageToCrop({
          url: image.publicUrl,
          libraryImageId: image.id,
          originalFileName: image.fileName
        });
        setShowCropper(true);
        return;
      }
    }

    // Use image directly
    onChange(image.publicUrl, image.id);
  };

  const handleRemove = () => {
    onChange('', undefined);
  };

  return (
    <div className={styles.imagePicker}>
      <label className={styles.label}>{label}</label>

      {aspectRatio && (
        <p className={styles.aspectRatioHint}>
          Recommended: {recommendedWidth} × {recommendedHeight} (
          {formatAspectRatio(recommendedWidth, recommendedHeight)} ratio)
        </p>
      )}

      {/* Current Image Preview */}
      {value && (
        <div className={styles.currentImage}>
          <Image
            src={value}
            alt="Current image"
            width={200}
            height={150}
            style={{ objectFit: 'cover' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className={styles.removeButton}
          >
            Remove
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'upload' ? styles.active : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload New
        </button>
        <button
          type="button"
          className={`${styles.tab} ${activeTab === 'library' ? styles.active : ''}`}
          onClick={() => setActiveTab('library')}
        >
          Company Library
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {activeTab === 'upload' && (
          <div className={styles.uploadTab}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileSelect}
              className={styles.fileInput}
              disabled={isUploading}
            />
            <div className={styles.uploadHint}>
              <p>Supported formats: JPEG, PNG, WebP</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className={styles.libraryTab}>
            {/* Folder Dropdown */}
            <div className={styles.folderFilter}>
              <label htmlFor="folder-select" className={styles.filterLabel}>
                Folder:
              </label>
              <select
                id="folder-select"
                value={selectedFolder}
                onChange={(e) => {
                  setSelectedFolder(e.target.value);
                  setPage(1);
                }}
                className={styles.folderSelect}
              >
                {FOLDER_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={styles.searchInput}
              />
            </div>

            {/* Image Grid */}
            {isLoadingLibrary ? (
              <div className={styles.loading}>Loading images...</div>
            ) : libraryImages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No images in your library yet.</p>
                <p>Upload your first image to get started!</p>
              </div>
            ) : (
              <>
                <div className={styles.imageGrid}>
                  {libraryImages.map((image) => (
                    <div key={image.id} className={styles.imageCard}>
                      <div className={styles.imagePreview}>
                        <Image
                          src={image.publicUrl}
                          alt={image.fileName}
                          width={200}
                          height={200}
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div className={styles.imageInfo}>
                        <p className={styles.imageName} title={image.fileName}>
                          {image.fileName}
                        </p>
                        {image.width && image.height && (
                          <p className={styles.imageDimensions}>
                            {image.width} × {image.height}
                            {image.aspectRatio && (
                              <span className={styles.imageRatio}>
                                {' '}
                                ({formatAspectRatio(image.width, image.height)})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLibraryImageSelect(image)}
                        className={styles.selectButton}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={styles.paginationButton}
                    >
                      Previous
                    </button>
                    <span className={styles.pageInfo}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && aspectRatio && (
        <ImageCropper
          imageUrl={imageToCrop.url}
          aspectRatio={aspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          recommendedWidth={recommendedWidth}
          recommendedHeight={recommendedHeight}
        />
      )}
    </div>
  );
}
