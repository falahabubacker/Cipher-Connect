#!/usr/bin/env python
import os
import sys
import django
from io import BytesIO

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wey_backend.settingprod')
django.setup()

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

def test_r2_connection():
    print("Testing R2 connection...\n")
    
    # Test 1: Check configuration
    print("1. Checking configuration...")
    from django.conf import settings
    try:
        config = settings.STORAGES['default']['OPTIONS']
        print(f"   ✓ Bucket: {config.get('bucket_name')}")
        print(f"   ✓ Endpoint: {config.get('endpoint_url')}")
        print(f"   ✓ Access Key: {config.get('access_key')[:10]}...")
    except Exception as e:
        print(f"   ✗ Configuration error: {e}")
        return False
    
    # Test 2: Write test file
    print("\n2. Testing file upload...")
    test_filename = "WhatsApp Video 2026-01-15 at 7.54.06 AM.mp4"
    with open(test_filename, 'rb') as f:
        test_content = f.read()
    
    try:
        path = default_storage.save(test_filename, ContentFile(test_content))
        print(f"   ✓ File uploaded: {path}")
        url = default_storage.url(path)
        print(f"   ✓ URL: {url}")
    except Exception as e:
        print(f"   ✗ Upload failed: {e}")
        return False
    
    # Test 3: Read test file
    print("\n3. Testing file read...")
    try:
        file_content = default_storage.open(test_filename).read()
        if file_content == test_content:
            print(f"   ✓ File read successfully")
        else:
            print(f"   ✗ Content mismatch")
            return False
    except Exception as e:
        print(f"   ✗ Read failed: {e}")
        return False
    
    # Test 4: Delete test file
    print("\n4. Testing file deletion...")
    try:
        default_storage.delete(test_filename)
        print(f"   ✓ File deleted")
    except Exception as e:
        print(f"   ✗ Delete failed: {e}")
        return False
    
    print("\n" + "="*50)
    print("✓ All tests passed! R2 credentials are working.")
    print("="*50)
    return True

if __name__ == '__main__':
    try:
        success = test_r2_connection()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
