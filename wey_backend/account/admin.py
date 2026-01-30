from django.contrib import admin

from .models import User, FriendshipRequest, Connection

admin.site.register(User)
admin.site.register(FriendshipRequest)
admin.site.register(Connection)