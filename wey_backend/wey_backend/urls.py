from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path

from account.views import activateemail
from post.views import serve_video
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularJSONAPIView

urlpatterns = [
    path('api/', include('account.urls')),
    path('api/posts/', include('post.urls')),
    path('api/search/', include('search.urls')),
    path('api/chat/', include('chat.urls')),
    path('api/notifications/', include('notification.urls')),
    path('activateemail/', activateemail, name='activateemail'),
    path('admin/', admin.site.urls),
]

# Custom video serving with byte-range support for iOS
# Match video files specifically (case-insensitive)
# urlpatterns += [
#     re_path(r'^media/post_attachments/(?P<path>.+\.(mp4|MP4|mov|MOV|m4v|M4V|avi|AVI|webm|WEBM|mkv|MKV))$', 
#             serve_video, name='serve_video'),
# ]

# Serve other media files (images, avatars) normally
# urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/schema/json/", SpectacularJSONAPIView.as_view(), name="schema-json"),
]