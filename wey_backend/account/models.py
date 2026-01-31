import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, UserManager
from django.db import models
from django.db.utils import IntegrityError
from django.utils import timezone



class CustomUserManager(UserManager):
    def _create_user(self, name=None, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError("You have not provided a valid e-mail address")

        # ensure email normalized and name is never passed as None (which would
        # result in a NULL value for a non-nullable CharField in the DB)
        email = self.normalize_email(email)
        name = name or ''

        user = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_user(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(name, email, password, **extra_fields)

    def create_superuser(self, name=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(name, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, default='')
    avatar = models.ImageField(upload_to='avatars', blank=True, null=True)
    friends = models.ManyToManyField('self', blank=True)
    friends_count = models.IntegerField(default=0)

    people_you_may_know = models.ManyToManyField('self', blank=True)

    posts_count = models.IntegerField(default=0)

    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'
    # require 'name' when creating superusers so the management command will
    # prompt for it instead of leaving it None and causing a DB NOT NULL error
    REQUIRED_FIELDS = ['name']

    def get_avatar(self):
        if self.avatar:
            return self.avatar.url
        else:
            return 'https://picsum.photos/200/200'


class FriendshipRequest(models.Model):
    SENT = 'sent'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'

    STATUS_CHOICES = (
        (SENT, 'Sent'),
        (ACCEPTED, 'Accepted'),
        (REJECTED, 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_for = models.ForeignKey(User, related_name='received_friendshiprequests', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, related_name='created_friendshiprequests', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=SENT)

    def __str__(self):
        return f"{self.created_by.name} -> {self.created_for.name}"

class Connection(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user1 = models.ForeignKey(User, related_name='connections1', on_delete=models.CASCADE)
    user2 = models.ForeignKey(User, related_name='connections2', on_delete=models.CASCADE)
    score = models.FloatField(default=0)
    last_interaction = models.DateTimeField(null=True, blank=True)
    is_connected = models.BooleanField(default=False, blank=True)

    def save(self, *args, **kwargs):
        if self.user1 == self.user2: raise IntegrityError("UNIQUE constraint failed")
        if self.score > 15:
            self.is_connected = True
        else:
            self.is_connected = False
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user1.name} - {self.user2.name}"
    
    class Meta:
        unique_together = ('user1', 'user2')