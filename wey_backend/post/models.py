import uuid

from django.conf import settings
from django.db import models
from django.utils.timesince import timesince

from account.models import User
import os

class Like(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(User, related_name='likes', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class Comment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, related_name='comments', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('created_at',)
    
    def created_at_formatted(self):
       return timesince(self.created_at)


class PostAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(max_length=500)
    content_type = models.CharField(max_length=100, blank=True, null=True)
    created_by = models.ForeignKey(User, related_name='post_attachments', on_delete=models.CASCADE)

    def get_url(self):
        public_access_url = settings.STORAGES["default"]['OPTIONS'].get('custom_domain')
        return_url = os.path.join("https://", public_access_url, self.url) or ''
        print("Generated access URL for attachment:", return_url)
        return return_url

    def is_video(self):
        if self.content_type:
            return self.content_type.startswith('video/')
        # Fallback to extension checking
        if self.url:
            name = self.url.lower()
            return any(name.endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.m4v', '.webm', '.mkv'])
        return False


class Post(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    body = models.TextField(blank=True, null=True)

    attachments = models.ManyToManyField(PostAttachment, blank=True)

    is_private = models.BooleanField(default=False)

    likes = models.ManyToManyField(Like, blank=True)
    likes_count = models.IntegerField(default=0)

    comments = models.ManyToManyField(Comment, blank=True)
    comments_count = models.IntegerField(default=0)

    reported_by_users = models.ManyToManyField(User, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE)

    class Meta:
        ordering = ('-created_at',)
    
    def created_at_formatted(self):
       return timesince(self.created_at)
    

class Trend(models.Model):
    hashtag = models.CharField(max_length=255)
    occurences = models.IntegerField()