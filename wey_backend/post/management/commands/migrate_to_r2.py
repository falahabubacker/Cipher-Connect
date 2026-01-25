import os
from django.core.management.base import BaseCommand
from django.conf import settings
from post.models import PostAttachment
from account.models import User


class Command(BaseCommand):
    help = 'Migrate existing media files from local storage to R2'

    def handle(self, *args, **options):
        self.stdout.write('Starting migration to R2...\n')
        
        # Migrate post attachments
        attachments = PostAttachment.objects.all()
        total = attachments.count()
        
        for i, attachment in enumerate(attachments, 1):
            if attachment.image:
                # Get local file path
                local_path = os.path.join(settings.BASE_DIR, 'media', str(attachment.image))
                
                if os.path.exists(local_path):
                    self.stdout.write(f'[{i}/{total}] Uploading: {attachment.image.name}')
                    
                    # Read file
                    with open(local_path, 'rb') as f:
                        # Save to R2 (django-storages handles upload)
                        attachment.image.save(
                            os.path.basename(attachment.image.name),
                            f,
                            save=True
                        )
                    
                    self.stdout.write(self.style.SUCCESS(f'✓ Uploaded: {attachment.image.url}'))
                else:
                    self.stdout.write(self.style.WARNING(f'✗ File not found: {local_path}'))
        
        # Migrate user avatars
        users = User.objects.exclude(avatar='')
        total_users = users.count()
        
        for i, user in enumerate(users, 1):
            if user.avatar:
                local_path = os.path.join(settings.BASE_DIR, 'media', str(user.avatar))
                
                if os.path.exists(local_path):
                    self.stdout.write(f'[{i}/{total_users}] Uploading avatar: {user.avatar.name}')
                    
                    with open(local_path, 'rb') as f:
                        user.avatar.save(
                            os.path.basename(user.avatar.name),
                            f,
                            save=True
                        )
                    
                    self.stdout.write(self.style.SUCCESS(f'✓ Uploaded: {user.avatar.url}'))
                else:
                    self.stdout.write(self.style.WARNING(f'✗ File not found: {local_path}'))
        
        self.stdout.write(self.style.SUCCESS('\n✓ Migration complete!'))
