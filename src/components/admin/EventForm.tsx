'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Link as LinkIcon, Video, FileText, Users, GraduationCap, Rocket, AlertCircle, CheckCircle2, Image as ImageIcon, X, ZoomIn, Download, RotateCw, Camera, RefreshCw, Crop, Maximize2 } from 'lucide-react';
import { 
  getImageDimensions, 
  validateImageDimensions, 
  compressImage, 
  fileToBase64,
  generateUniqueFileName,
  type ImageDimensions,
  type ImageValidationResult 
} from '@/lib/image-utils';

interface Cohort {
  id: string;
  name: string;
  label: string;
  isForAll?: boolean;
}

interface EventFormData {
  name: string;
  type: string;
  start_time: string;
  end_time: string;
  description: string;
  link: string;
  recording_url: string;
  image_url: string;
  image_alt_text: string; // Alt text for accessibility
  cohort_id: string | null;
  for_all: boolean;
  chapter_number: string;
}

const EVENT_TYPES = [
  { value: 'community', label: 'Community', icon: Users },
  { value: 'live-class', label: 'Live Class', icon: Video },
  { value: 'workshop', label: 'Workshop', icon: GraduationCap },
  { value: 'assignment', label: 'Assignment', icon: FileText },
  { value: 'deadline', label: 'Deadline', icon: Clock },
  { value: 'quiz', label: 'Quiz', icon: FileText },
  { value: 'cohort', label: 'Cohort', icon: Rocket },
];

export default function EventForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    type: 'community',
    start_time: '',
    end_time: '',
    description: '',
    link: '',
    recording_url: '',
    image_url: '',
    image_alt_text: '',
    cohort_id: null,
    for_all: true,
    chapter_number: '',
  });

  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploaded, setImageUploaded] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [imageValidation, setImageValidation] = useState<ImageValidationResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [enableCompression, setEnableCompression] = useState(true);
  const [compressionQuality, setCompressionQuality] = useState(85);
  const [maxImageWidth, setMaxImageWidth] = useState(1920);
  const [showCropTool, setShowCropTool] = useState(false);
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch cohorts on mount
  useEffect(() => {
    fetchCohorts();
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showImageModal) {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showImageModal]);

  const fetchCohorts = async () => {
    setLoadingCohorts(true);
    try {
      const response = await fetch('/api/events/cohorts');
      const data = await response.json();
      
      if (response.ok && data.options) {
        setCohorts(data.options);
      } else {
        console.error('Failed to fetch cohorts:', data);
      }
    } catch (err) {
      console.error('Error fetching cohorts:', err);
    } finally {
      setLoadingCohorts(false);
    }
  };

  const validateURL = (url: string): boolean => {
    if (!url.trim()) return true; // Empty is valid (optional field)
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
  };

  const processImageFile = async (file: File) => {
    try {
      setError(null);
      setUploadError(null);
      setImageUploaded(false);
      setUploadProgress(0);
      setRetryCount(0);

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid image type. Please upload JPEG, PNG, WebP, or GIF.');
        return;
      }

      // No file size limit - allow unlimited size

      // Get and validate image dimensions
      const dimensions = await getImageDimensions(file);
      setImageDimensions(dimensions);

      // Validate dimensions (optional - can be configured)
      const validation = await validateImageDimensions(file, {
        minWidth: 100,
        minHeight: 100,
        maxWidth: 10000,
        maxHeight: 10000,
      });

      setImageValidation(validation);

      if (!validation.valid) {
        setError(validation.error || 'Image validation failed');
        return;
      }

      // Set file and create preview
      setImageFile(file);
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Auto-upload the image immediately after selection
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
        setImageUploaded(true);
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image');
    }
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '', image_alt_text: '' }));
    setImageUploaded(false);
    setUploadProgress(0);
    setImageRotation(0);
    setImageZoom(100);
    setImageDimensions(null);
    setImageValidation(null);
    setUploadError(null);
    setRetryCount(0);
    setCropArea(null);
    setShowCropTool(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleCameraSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImageFile(file);
    }
  };

  const handleImageRotate = () => {
    setImageRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setImageZoom(100);
    setImageRotation(0);
  };

  const handleDownloadImage = () => {
    if (imagePreview && imageFile) {
      const link = document.createElement('a');
      link.href = imagePreview;
      link.download = imageFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (uploadingImage) return; // Don't allow drop while uploading
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processImageFile(file);
  };

  const uploadImage = async (retry = false): Promise<string | null> => {
    if (!imageFile) return null;

    if (retry) {
      setRetryCount(prev => prev + 1);
    }

    setUploadingImage(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Step 1: Process image (compression/resizing) - 10%
      setUploadProgress(10);
      
      let processedFile: File | Blob = imageFile;
      let base64: string;

      if (enableCompression && imageFile.size > 500 * 1024) { // Compress if > 500KB
        setUploadProgress(15);
        const compressedBlob = await compressImage(imageFile, {
          maxWidth: maxImageWidth,
          maxHeight: maxImageWidth,
          quality: compressionQuality / 100,
          format: 'jpeg',
          stripExif: true, // Remove EXIF data
        });
        
        // Convert blob to file-like object for upload
        processedFile = compressedBlob;
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressedBlob);
        });
      } else {
        // Convert file to base64 with EXIF stripping
        setUploadProgress(20);
        base64 = await fileToBase64(imageFile, {
          stripExif: true,
          quality: 0.9,
        });
      }

      setUploadProgress(30);

      // Step 2: Upload to server - 30% to 90%
      const xhr = new XMLHttpRequest();
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          // Map from 30% to 90% (upload progress)
          const progress = 30 + (e.loaded / e.total) * 60;
          setUploadProgress(Math.min(progress, 90));
        }
      });

      const uploadPromise = new Promise<{ imageUrl: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              // Log successful upload
              console.log('[Image Upload] Success:', {
                fileName: imageFile.name,
                originalSize: imageFile.size,
                processedSize: processedFile instanceof Blob ? processedFile.size : imageFile.size,
                dimensions: imageDimensions,
                retryCount,
              });
              resolve(data);
            } catch (e) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.error || 'Failed to upload image'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', '/api/events/upload-image');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;
        xhr.send(JSON.stringify({ 
          imageData: base64,
          fileName: imageFile.name,
          altText: formData.image_alt_text || undefined,
        }));
      });

      const data = await uploadPromise;
      setUploadProgress(100);
      
      return data.imageUrl;
    } catch (err: any) {
      console.error('[Image Upload] Error:', {
        error: err.message,
        fileName: imageFile.name,
        retryCount,
      });
      setUploadError(err.message || 'Failed to upload image');
      setUploadProgress(0);
      return null;
    } finally {
      setUploadingImage(false);
      // Keep progress at 100 if successful, reset if error
      if (uploadProgress < 100 && uploadError) {
        setTimeout(() => setUploadProgress(0), 1000);
      }
    }
  };

  const handleRetryUpload = async () => {
    if (imageFile && retryCount < 3) {
      const uploadedUrl = await uploadImage(true);
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, image_url: uploadedUrl }));
        setImageUploaded(true);
        setUploadError(null);
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Event name
    if (!formData.name.trim()) {
      errors.name = 'Event name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Event name must be at least 3 characters';
    } else if (formData.name.length > 200) {
      errors.name = 'Event name must be less than 200 characters';
    }

    // Start time
    if (!formData.start_time) {
      errors.start_time = 'Start date and time is required';
    } else {
      const startDate = new Date(formData.start_time);
      if (isNaN(startDate.getTime())) {
        errors.start_time = 'Invalid start date/time';
      }
    }

    // End time validation
    if (formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      if (isNaN(endDate.getTime())) {
        errors.end_time = 'Invalid end date/time';
      } else if (endDate <= startDate) {
        errors.end_time = 'End time must be after start time';
      }
    }

    // Description length
    if (formData.description && formData.description.length > 5000) {
      errors.description = 'Description must be less than 5000 characters';
    }

    // Link validation
    if (formData.link && !validateURL(formData.link)) {
      errors.link = 'Invalid URL format';
    }

    // Recording URL validation
    if (formData.recording_url && !validateURL(formData.recording_url)) {
      errors.recording_url = 'Invalid URL format';
    }

    // Chapter number validation (only for live-class)
    if (formData.type === 'live-class' && formData.chapter_number) {
      const chapterNum = parseInt(formData.chapter_number);
      if (isNaN(chapterNum) || chapterNum < 1) {
        errors.chapter_number = 'Chapter number must be a positive integer';
      }
    }

    // Cohort selection validation
    if (!formData.for_all && !formData.cohort_id) {
      errors.cohort_id = 'Please select a cohort or choose "For Everyone"';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      // Use already uploaded image URL if available, otherwise upload now
      let imageUrl = formData.image_url;
      if (imageFile && !imageUrl && !imageUploaded) {
        // Only upload if not already uploaded
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setSubmitting(false);
          return; // Error already set in uploadImage
        }
      }

      // Prepare payload with all event data
      const payload: any = {
        name: formData.name.trim(),
        type: formData.type,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
        description: formData.description.trim() || null,
        link: formData.link.trim() || null,
        recording_url: formData.recording_url.trim() || null,
        image_url: imageUrl || null,
        image_alt_text: formData.image_alt_text.trim() || null,
        for_all: formData.for_all,
        cohort_id: formData.for_all ? null : formData.cohort_id,
      };

      // Add chapter_number only for live-class events
      if (formData.type === 'live-class' && formData.chapter_number) {
        payload.chapter_number = parseInt(formData.chapter_number);
      }

      const response = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      setSuccess(data.message || 'Event created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        type: 'community',
        start_time: '',
        end_time: '',
        description: '',
        link: '',
        recording_url: '',
        image_url: '',
        image_alt_text: '',
        cohort_id: null,
        for_all: true,
        chapter_number: '',
      });
      setFieldErrors({});
      setImageFile(null);
      setImagePreview(null);
      setImageUploaded(false);
      setUploadProgress(0);
      setImageDimensions(null);
      setImageValidation(null);
      setUploadError(null);
      setRetryCount(0);
      setImageRotation(0);
      setImageZoom(100);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }

      // Dispatch refresh event for EventsList
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('refreshEventsList'));
      }

      // Call success callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Format datetime-local value from ISO string
  const formatDateTimeLocal = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const selectedType = EVENT_TYPES.find(t => t.value === formData.type) || EVENT_TYPES[0];
  const TypeIcon = selectedType.icon;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-zinc-50 mb-2">Create New Event</h2>
        <p className="text-sm text-zinc-400">
          Create events that will appear in the "Upcoming Events" section on the homepage. Events marked "For Everyone" will be visible to all users.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">Error</p>
            <p className="text-sm text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-300">Success</p>
            <p className="text-sm text-green-400/80 mt-1">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Name */}
        <div>
          <label htmlFor="event-name" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Name <span className="text-red-400">*</span>
          </label>
          <input
            id="event-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
              fieldErrors.name ? 'border-red-500/50' : 'border-zinc-700'
            }`}
            placeholder="e.g., Bitcoin Basics Workshop"
            maxLength={200}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>

        {/* Event Type */}
        <div>
          <label htmlFor="event-type" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Type <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {EVENT_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleChange('type', type.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition ${
                    formData.type === type.value
                      ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                      : 'border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Visibility <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={formData.for_all}
                onChange={() => handleChange('for_all', true)}
                className="h-4 w-4 text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-sm text-zinc-300">For Everyone</span>
              <span className="text-xs text-zinc-500">(Appears on homepage)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                checked={!formData.for_all}
                onChange={() => handleChange('for_all', false)}
                className="h-4 w-4 text-cyan-400 focus:ring-cyan-400"
              />
              <span className="text-sm text-zinc-300">Specific Cohort</span>
            </label>
          </div>
        </div>

        {/* Cohort Selector */}
        {!formData.for_all && (
          <div>
            <label htmlFor="cohort" className="block text-sm font-medium text-zinc-300 mb-2">
              Select Cohort <span className="text-red-400">*</span>
            </label>
            <select
              id="cohort"
              value={formData.cohort_id || ''}
              onChange={(e) => handleChange('cohort_id', e.target.value || null)}
              className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.cohort_id ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              disabled={loadingCohorts}
            >
              <option value="">Select a cohort...</option>
              {cohorts
                .filter(c => !c.isForAll)
                .map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.label}
                  </option>
                ))}
            </select>
            {fieldErrors.cohort_id && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.cohort_id}</p>
            )}
          </div>
        )}

        {/* Date/Time Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start-time" className="block text-sm font-medium text-zinc-300 mb-2">
              Start Date & Time <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="start-time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  fieldErrors.start_time ? 'border-red-500/50' : 'border-zinc-700'
                }`}
              />
            </div>
            {fieldErrors.start_time && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.start_time}</p>
            )}
          </div>

          <div>
            <label htmlFor="end-time" className="block text-sm font-medium text-zinc-300 mb-2">
              End Date & Time <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                id="end-time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                  fieldErrors.end_time ? 'border-red-500/50' : 'border-zinc-700'
                }`}
              />
            </div>
            {fieldErrors.end_time && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.end_time}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 resize-none ${
              fieldErrors.description ? 'border-red-500/50' : 'border-zinc-700'
            }`}
            placeholder="Describe the event..."
            maxLength={5000}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {formData.description.length}/5000 characters
          </p>
          {fieldErrors.description && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
          )}
        </div>

        {/* Link */}
        <div>
          <label htmlFor="link" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Link <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => handleChange('link', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.link ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="https://..."
            />
          </div>
          {fieldErrors.link && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.link}</p>
          )}
        </div>

        {/* Recording URL */}
        <div>
          <label htmlFor="recording-url" className="block text-sm font-medium text-zinc-300 mb-2">
            Recording URL <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          <div className="relative">
            <Video className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              id="recording-url"
              type="url"
              value={formData.recording_url}
              onChange={(e) => handleChange('recording_url', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 pl-10 pr-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.recording_url ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="https://..."
            />
          </div>
          {fieldErrors.recording_url && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.recording_url}</p>
          )}
        </div>

        {/* Event Image */}
        <div>
          <label htmlFor="event-image" className="block text-sm font-medium text-zinc-300 mb-2">
            Event Image <span className="text-zinc-500 text-xs">(Optional)</span>
          </label>
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden group">
                <div className="relative">
                  <div 
                    className="relative w-full h-48 overflow-hidden cursor-pointer"
                    onClick={() => !uploadingImage && setShowImageModal(true)}
                  >
                    <img
                      src={imagePreview}
                      alt="Event preview"
                      className={`w-full h-full object-cover transition-all ${
                        uploadingImage ? 'opacity-50' : imageUploaded ? 'opacity-100 group-hover:opacity-90' : 'opacity-75'
                      }`}
                      style={{
                        transform: `rotate(${imageRotation}deg) scale(${imageZoom / 100})`,
                        transition: 'transform 0.3s ease',
                      }}
                    />
                    {/* Click to view full size hint */}
                    {!uploadingImage && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex items-center gap-2 text-white">
                          <ZoomIn className="h-5 w-5" />
                          <span className="text-sm font-medium">Click to view full size</span>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Overlay when uploading */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div>
                        <p className="text-sm text-cyan-300 font-medium">Uploading...</p>
                      </div>
                    </div>
                  )}
                  {/* Success indicator */}
                  {imageUploaded && !uploadingImage && (
                    <div className="absolute top-2 left-2 rounded-full bg-green-500/90 px-2 py-1 flex items-center gap-1.5 z-10">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span className="text-xs text-white font-medium">Uploaded</span>
                    </div>
                  )}
                  {/* Action buttons */}
                  {!uploadingImage && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                      {/* View full size button */}
                      <button
                        type="button"
                        onClick={() => setShowImageModal(true)}
                        className="rounded-full bg-blue-500/90 hover:bg-blue-500 p-2 text-white transition shadow-lg"
                        title="View full size"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={handleImageRemove}
                        className="rounded-full bg-red-500/90 hover:bg-red-500 p-2 text-white transition shadow-lg"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Image controls */}
              {imageUploaded && !uploadingImage && (
                <div className="flex items-center justify-between gap-2 p-2 bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleImageRotate}
                      className="rounded px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-1"
                      title="Rotate image"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      Rotate
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      className="rounded px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-1"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                      Zoom In
                    </button>
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      className="rounded px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-1"
                      title="Zoom out"
                    >
                      <ZoomIn className="h-3.5 w-3.5 rotate-180" />
                      Zoom Out
                    </button>
                    {(imageZoom !== 100 || imageRotation !== 0) && (
                      <button
                        type="button"
                        onClick={handleZoomReset}
                        className="rounded px-2 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 transition"
                        title="Reset zoom and rotation"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    className="rounded px-2 py-1 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-1"
                    title="Download image"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </button>
                </div>
              )}
              
              {/* Upload Progress Bar */}
              {uploadingImage && (
                <div className="space-y-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400"></div>
                      <span className="text-sm font-medium text-cyan-300">Uploading image...</span>
                    </div>
                    <span className="text-sm font-semibold text-cyan-400">{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-cyan-400 transition-all duration-300 ease-out shadow-lg"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-400">
                    Please wait while your image is being uploaded to the server...
                  </p>
                </div>
              )}
              
              {/* File info when uploaded */}
              {imageUploaded && !uploadingImage && imageFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 bg-zinc-900/50 rounded-lg px-3 py-2">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      <span className="truncate max-w-[200px]" title={imageFile.name}>
                        {imageFile.name}
                      </span>
                      <span className="text-zinc-500">
                        ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </span>
                  </div>
                  
                  {/* Image dimensions info */}
                  {imageDimensions && (
                    <div className="text-xs text-zinc-500 bg-zinc-900/30 rounded-lg px-3 py-1.5">
                      Dimensions: {imageDimensions.width} × {imageDimensions.height}px
                      {imageValidation?.aspectRatio && (
                        <span className="ml-2">
                          • Aspect Ratio: {imageValidation.aspectRatio.toFixed(2)}:1
                        </span>
                      )}
                    </div>
                  )}

                  {/* Alt text input for accessibility */}
                  <div>
                    <label htmlFor="image-alt-text" className="block text-xs font-medium text-zinc-400 mb-1">
                      Alt Text (for accessibility)
                    </label>
                    <input
                      id="image-alt-text"
                      type="text"
                      value={formData.image_alt_text}
                      onChange={(e) => handleChange('image_alt_text', e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      placeholder="Describe the image for screen readers..."
                      maxLength={200}
                    />
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formData.image_alt_text.length}/200 characters
                    </p>
                  </div>
                </div>
              )}

              {/* Upload error with retry */}
              {uploadError && !uploadingImage && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-300 mb-1">Upload Failed</p>
                      <p className="text-xs text-red-400/80">{uploadError}</p>
                    </div>
                    {retryCount < 3 && (
                      <button
                        type="button"
                        onClick={handleRetryUpload}
                        className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-500/20 transition"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Retry
                      </button>
                    )}
                  </div>
                  {retryCount >= 3 && (
                    <p className="mt-2 text-xs text-red-400/60">
                      Maximum retry attempts reached. Please try uploading again.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="event-image"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg bg-zinc-950 cursor-pointer transition ${
                    uploadingImage
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-zinc-700 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImage ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-2"></div>
                        <p className="text-sm text-cyan-300 font-medium mb-1">Uploading image...</p>
                        <div className="w-48 bg-zinc-800 rounded-full h-2 overflow-hidden mt-2">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <p className="text-xs text-cyan-400 mt-2 font-medium">{Math.round(uploadProgress)}%</p>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-zinc-500 mb-2" />
                        <p className="text-sm text-zinc-400 mb-1">
                          <span className="font-medium text-cyan-400">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-zinc-500">PNG, JPG, WebP or GIF</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    id="event-image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploadingImage}
                    aria-label="Upload event image"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Chapter Number (only for live-class) */}
        {formData.type === 'live-class' && (
          <div>
            <label htmlFor="chapter-number" className="block text-sm font-medium text-zinc-300 mb-2">
              Chapter Number <span className="text-zinc-500 text-xs">(Optional)</span>
            </label>
            <input
              id="chapter-number"
              type="number"
              min="1"
              value={formData.chapter_number}
              onChange={(e) => handleChange('chapter_number', e.target.value)}
              className={`w-full rounded-lg border bg-zinc-950 px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                fieldErrors.chapter_number ? 'border-red-500/50' : 'border-zinc-700'
              }`}
              placeholder="e.g., 1, 2, 3..."
            />
            {fieldErrors.chapter_number && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.chapter_number}</p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-gradient-to-r from-cyan-400 to-purple-500 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>

      {/* Full-Size Image Modal */}
      {showImageModal && imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div 
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 rounded-full bg-red-500/90 hover:bg-red-500 p-3 text-white transition shadow-lg"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Image with zoom and rotation */}
            <div className="relative w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={imagePreview}
                alt="Event image full size"
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `rotate(${imageRotation}deg) scale(${imageZoom / 100})`,
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>

            {/* Controls overlay */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-4 py-3 border border-zinc-700">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={imageZoom <= 50}
                className="rounded px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Zoom out"
              >
                <ZoomIn className="h-4 w-4 rotate-180" />
                <span>Zoom Out</span>
              </button>
              
              <span className="text-sm text-zinc-400 min-w-[60px] text-center">
                {imageZoom}%
              </span>
              
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={imageZoom >= 200}
                className="rounded px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
                <span>Zoom In</span>
              </button>

              <div className="w-px h-6 bg-zinc-700" />

              <button
                type="button"
                onClick={handleImageRotate}
                className="rounded px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-2"
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
                <span>Rotate</span>
              </button>

              {(imageZoom !== 100 || imageRotation !== 0) && (
                <>
                  <div className="w-px h-6 bg-zinc-700" />
                  <button
                    type="button"
                    onClick={handleZoomReset}
                    className="rounded px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800 transition"
                    title="Reset zoom and rotation"
                  >
                    Reset
                  </button>
                </>
              )}

              <div className="w-px h-6 bg-zinc-700" />

              <button
                type="button"
                onClick={handleDownloadImage}
                className="rounded px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition flex items-center gap-2"
                title="Download image"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-zinc-400 border border-zinc-700">
              <p>Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">ESC</kbd> to close</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

