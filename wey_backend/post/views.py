import os
import mimetypes
import logging
from django.http import FileResponse, Http404, HttpResponse
from django.conf import settings
from django.views.decorators.http import require_http_methods

logger = logging.getLogger(__name__)


@require_http_methods(["GET", "HEAD"])
def serve_video(request, path):
    """
    Serve video files with proper byte-range support for iOS.
    iOS requires HTTP 206 Partial Content responses for video playback.
    """
    # Construct full path - path already includes filename
    file_path = os.path.join(settings.MEDIA_ROOT, 'post_attachments', path)
    
    logger.info(f"Attempting to serve video: {file_path}")
    
    if not os.path.exists(file_path):
        logger.error(f"Video file not found: {file_path}")
        raise Http404("Video not found")
    
    # Get file size and type
    file_size = os.path.getsize(file_path)
    
    # Force correct MIME types for video files
    extension = os.path.splitext(file_path)[1].lower()
    mime_types = {
        '.mp4': 'video/mp4',
        '.m4v': 'video/mp4',
        '.mov': 'video/quicktime',
        '.avi': 'video/x-msvideo',
        '.webm': 'video/webm',
        '.mkv': 'video/x-matroska',
    }
    content_type = mime_types.get(extension, 'video/mp4')
    
    logger.info(f"Serving video: {path}, size: {file_size}, type: {content_type}")
    
    # Handle byte-range requests (required for iOS)
    range_header = request.META.get('HTTP_RANGE', '').strip()
    
    if range_header:
        import re
        range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
        
        if range_match:
            # Parse range request
            first_byte = int(range_match.group(1))
            last_byte = int(range_match.group(2)) if range_match.group(2) else file_size - 1
            
            # Validate range
            if first_byte >= file_size:
                return HttpResponse(status=416)  # Range Not Satisfiable
            
            last_byte = min(last_byte, file_size - 1)
            length = last_byte - first_byte + 1
            
            logger.info(f"Range request: bytes={first_byte}-{last_byte}/{file_size}")
            
            # Open file and seek to position
            with open(file_path, 'rb') as f:
                f.seek(first_byte)
                data = f.read(length)
            
            # Return 206 Partial Content
            response = HttpResponse(data, status=206, content_type=content_type)
            response['Content-Length'] = str(length)
            response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{file_size}'
            response['Accept-Ranges'] = 'bytes'
            response['Cache-Control'] = 'public, max-age=3600'
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range'
            return response
    
    # Return full file
    logger.info(f"Serving full video file")
    file_handle = open(file_path, 'rb')
    response = FileResponse(file_handle, content_type=content_type)
    response['Content-Length'] = str(file_size)
    response['Accept-Ranges'] = 'bytes'
    response['Cache-Control'] = 'public, max-age=3600'
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Range'
    
    return response
