from django.conf import settings
import boto3


def generate_presigned_urls(operation, content_type, file_key):
    
    config = settings.STORAGES['default']['OPTIONS']

    # Print the config to verify
    # print("CLOUDFLARE_R2_CONFIG_OPTIONS:", config)

    s3 = boto3.client(
        service_name="s3",
        # Provide your Cloudflare account ID
        endpoint_url=config.get('endpoint_url'),
        # Retrieve your S3 API credentials for your R2 bucket via API tokens (see: https://developers.cloudflare.com/r2/api/tokens)
        aws_access_key_id=config.get('access_key'),
        aws_secret_access_key=config.get('secret_key'),
        region_name="auto", # Required by SDK but not used by R2
    )

    if operation == 'GET':
        # Generate presigned URL for reading (GET)
        get_url = s3.generate_presigned_url(
        'get_object',
        Params={'Bucket': config.get('bucket_name'), 'Key': file_key},
        ExpiresIn=3600  # Valid for 1 hour
        )
        # https://my-bucket.<ACCOUNT_ID>.r2.cloudflarestorage.com/image.png?X-Amz-Algorithm=...

        return get_url

    if operation == 'PUT':
        # Generate presigned URL for writing (PUT)
        # Specify ContentType to restrict uploads to a specific file type
        put_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': config.get('bucket_name'),
            'Key': file_key,
            'ContentType': content_type
        },
        ExpiresIn=3600
        )

        return put_url