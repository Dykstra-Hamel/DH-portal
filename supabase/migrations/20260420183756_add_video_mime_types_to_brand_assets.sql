UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ],
  file_size_limit = 314572800  -- 300MB (matches TypeScript VIDEO_HARD_LIMIT)
WHERE id = 'brand-assets';
