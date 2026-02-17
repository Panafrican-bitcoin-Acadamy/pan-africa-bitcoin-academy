/**
 * Image processing utilities for uploads
 * Handles compression, resizing, cropping, EXIF removal, and validation
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  dimensions?: ImageDimensions;
  aspectRatio?: number;
}

export interface ImageProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG/WebP
  format?: 'jpeg' | 'png' | 'webp';
  stripExif?: boolean;
  maintainAspectRatio?: boolean;
  targetAspectRatio?: number; // e.g., 16/9, 4/3
  minWidth?: number;
  minHeight?: number;
}

/**
 * Load image from file and get dimensions
 */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  const img = await loadImage(file);
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
}

/**
 * Validate image dimensions and aspect ratio
 */
export async function validateImageDimensions(
  file: File,
  options: {
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    targetAspectRatio?: number;
    aspectRatioTolerance?: number; // e.g., 0.1 for 10% tolerance
  } = {}
): Promise<ImageValidationResult> {
  try {
    const dimensions = await getImageDimensions(file);
    const aspectRatio = dimensions.width / dimensions.height;

    // Check minimum dimensions
    if (options.minWidth && dimensions.width < options.minWidth) {
      return {
        valid: false,
        error: `Image width (${dimensions.width}px) is below minimum (${options.minWidth}px)`,
        dimensions,
        aspectRatio,
      };
    }

    if (options.minHeight && dimensions.height < options.minHeight) {
      return {
        valid: false,
        error: `Image height (${dimensions.height}px) is below minimum (${options.minHeight}px)`,
        dimensions,
        aspectRatio,
      };
    }

    // Check maximum dimensions
    if (options.maxWidth && dimensions.width > options.maxWidth) {
      return {
        valid: false,
        error: `Image width (${dimensions.width}px) exceeds maximum (${options.maxWidth}px)`,
        dimensions,
        aspectRatio,
      };
    }

    if (options.maxHeight && dimensions.height > options.maxHeight) {
      return {
        valid: false,
        error: `Image height (${dimensions.height}px) exceeds maximum (${options.maxHeight}px)`,
        dimensions,
        aspectRatio,
      };
    }

    // Check aspect ratio
    if (options.targetAspectRatio) {
      const tolerance = options.aspectRatioTolerance || 0.1;
      const ratioDiff = Math.abs(aspectRatio - options.targetAspectRatio);
      
      if (ratioDiff > tolerance) {
        return {
          valid: false,
          error: `Image aspect ratio (${aspectRatio.toFixed(2)}) doesn't match required ratio (${options.targetAspectRatio.toFixed(2)})`,
          dimensions,
          aspectRatio,
        };
      }
    }

    return {
      valid: true,
      dimensions,
      aspectRatio,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate image dimensions',
    };
  }
}

/**
 * Resize image using canvas
 */
export function resizeImage(
  img: HTMLImageElement,
  options: ImageProcessOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    let { width, height } = img;
    const maxWidth = options.maxWidth || width;
    const maxHeight = options.maxHeight || height;
    const maintainAspectRatio = options.maintainAspectRatio !== false;

    // Calculate new dimensions
    if (width > maxWidth || height > maxHeight) {
      if (maintainAspectRatio) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      } else {
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image (this strips EXIF data)
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const quality = options.quality || 0.9;
    const format = options.format || 'jpeg';
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      },
      `image/${format}`,
      quality
    );
  });
}

/**
 * Compress image
 */
export async function compressImage(
  file: File,
  options: ImageProcessOptions = {}
): Promise<Blob> {
  const img = await loadImage(file);
  return resizeImage(img, {
    maxWidth: options.maxWidth || 1920,
    maxHeight: options.maxHeight || 1920,
    quality: options.quality || 0.85,
    format: options.format || 'jpeg',
    maintainAspectRatio: true,
    ...options,
  });
}

/**
 * Crop image using canvas
 */
export function cropImage(
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  outputWidth?: number,
  outputHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = outputWidth || width;
    canvas.height = outputHeight || height;

    ctx.drawImage(
      img,
      x, y, width, height,
      0, 0, canvas.width, canvas.height
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create cropped image'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Convert file to base64 with EXIF stripping
 */
export async function fileToBase64(
  file: File,
  options: ImageProcessOptions = {}
): Promise<string> {
  // If compression/resizing is requested, process the image
  if (options.maxWidth || options.maxHeight || options.quality !== undefined) {
    const blob = await compressImage(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Otherwise, just convert to base64 (canvas draw will strip EXIF)
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        } else {
          reject(new Error('Failed to process image'));
        }
      },
      `image/${options.format || 'jpeg'}`,
      options.quality || 0.9
    );
  });
}

/**
 * Generate unique filename
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 9);
  const ext = originalName.split('.').pop() || 'jpg';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${nameWithoutExt}-${timestamp}-${randomStr}.${ext}`;
}

