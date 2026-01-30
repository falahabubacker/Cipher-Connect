from django.conf import settings
from django.contrib.auth.forms import PasswordChangeForm
from django.core.mail import send_mail
from django.http import JsonResponse

from rest_framework.decorators import api_view, authentication_classes, permission_classes

from notification.utils import create_notification

from .forms import SignupForm, ProfileForm
from .models import User, FriendshipRequest, Connection
from .serializers import UserSerializer, FriendshipRequestSerializer

from django.db.models import Q
import networkx as nx

@api_view(['GET'])
def me(request):
    return JsonResponse({
        'id': request.user.id,
        'name': request.user.name,
        'email': request.user.email,
        'friends_count': request.user.friends_count,
        'posts_count': request.user.posts_count,
        'get_avatar': request.user.get_avatar()
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def signup(request):
    data = request.data
    message = 'success'

    form = SignupForm({
        'email': data.get('email'),
        'name': data.get('name'),
        'password1': data.get('password1'),
        'password2': data.get('password2'),
    })

    if form.is_valid():
        user = form.save()
        user.is_active = False
        user.save()

        url = f'{settings.WEBSITE_URL}/activateemail/?email={user.email}&id={user.id}'

        send_mail(
            "Please verify your email",
            f"The url for activating your account is: {url}",
            "noreply@wey.com",
            [user.email],
            fail_silently=False,
        )
    else:
        message = form.errors.as_json()
    
    print(message)

    return JsonResponse({'message': message}, safe=False)


@api_view(['GET'])
def friends(request, pk):
    user = User.objects.get(pk=pk)
    requests = []
    requests_sent = []

    if user == request.user:
        # Incoming requests (sent TO you)
        requests = FriendshipRequest.objects.filter(created_for=request.user, status=FriendshipRequest.SENT)
        requests = FriendshipRequestSerializer(requests, many=True)
        requests = requests.data

        # Outgoing requests (sent BY you)
        requests_sent = FriendshipRequest.objects.filter(created_by=request.user, status=FriendshipRequest.SENT)
        requests_sent = FriendshipRequestSerializer(requests_sent, many=True)
        requests_sent = requests_sent.data

    friends = user.friends.all()

    return JsonResponse({
        'user': UserSerializer(user).data,
        'friends': UserSerializer(friends, many=True).data,
        'requests': requests,
        'requests_sent': requests_sent  # ADD THIS LINE
    }, safe=False)


@api_view(['GET'])
def get_connections(request):
    # Returns 2 levels of connections
    user = User.objects.get(pk=request.user.pk)

    G = nx.Graph()
    direct_connections = Connection.objects.filter(Q(user1=user) | Q(user2=user),
                                                Q(is_connected=True))

    for direct_connection in direct_connections:
        friend = direct_connection.user1 if user != direct_connection.user1 else direct_connection.user2
        G.add_edge(str(user.id), str(friend.id), weight=direct_connection.score)

        secondary_connections = Connection.objects.filter(Q(user1=friend) | Q(user2=friend),
                                                       Q(is_connected=True))
        
        for secondary_connection in secondary_connections:
            second_friend = secondary_connection.user1 if friend != secondary_connection.user1 else secondary_connection.user2
            G.add_edge(str(friend.id), str(second_friend.id), weight=secondary_connection.score)
    
    return JsonResponse({
        'graph': nx.node_link_data(G).get('edges', [])
    })
        

@api_view(['GET'])
def my_friendship_suggestions(request):
    serializer = UserSerializer(request.user.people_you_may_know.all(), many=True)

    return JsonResponse(serializer.data, safe=False)


@api_view(['POST'])
def editprofile(request):
    user = request.user
    email = request.data.get('email')

    if User.objects.exclude(id=user.id).filter(email=email).exists():
        return JsonResponse({'message': 'email already exists'})
    else:
        form = ProfileForm(request.POST, request.FILES, instance=user)

        if form.is_valid():
            form.save()
        
        serializer = UserSerializer(user)

        return JsonResponse({'message': 'information updated', 'user': serializer.data})
    

@api_view(['POST'])
def editpassword(request):
    user = request.user
    
    form = PasswordChangeForm(data=request.POST, user=user)

    if form.is_valid():
        form.save()

        return JsonResponse({'message': 'success'})
    else:
        return JsonResponse({'message': form.errors.as_json()}, safe=False)

@api_view(['POST'])
def send_friendship_request(request, pk):
    user = User.objects.get(pk=pk)

    check1 = FriendshipRequest.objects.filter(created_for=request.user).filter(created_by=user)
    check2 = FriendshipRequest.objects.filter(created_for=user).filter(created_by=request.user)

    if not check1 or not check2:
        friendrequest = FriendshipRequest.objects.create(created_for=user, created_by=request.user)

        notification = create_notification(request, 'new_friendrequest', friendrequest_id=friendrequest.id)

        return JsonResponse({'message': 'friendship request created'})
    else:
        return JsonResponse({'message': 'request already sent'})


@api_view(['POST'])
def handle_request(request, pk, status):
    print("=== HANDLE REQUEST CALLED ===", flush=True)
    user = User.objects.get(pk=pk)
    friendship_request = FriendshipRequest.objects.filter(created_for=request.user).get(created_by=user)
    friendship_request.status = status
    friendship_request.save()

    # Add friend (ManyToMany 'self' is symmetrical, so only add once)
    request.user.friends.add(user)
    
    # Count actual friends and update counts
    request.user.friends_count = request.user.friends.count()
    request.user.save()
    
    user.refresh_from_db()
    user.friends_count = user.friends.count()
    user.save()

    notification = create_notification(request, 'accepted_friendrequest', friendrequest_id=friendship_request.id)

    return JsonResponse({'message': 'friendship request updated'})


@api_view(['POST'])
def remove_friend(request, pk):
    import sys
    print("=== REMOVING FRIEND START ===", flush=True)
    sys.stdout.flush()
    user = User.objects.get(pk=pk)
    
    # Check if they are friends
    print(f"Current user: {request.user.name}", flush=True)
    print(f"Target user: {user.name}", flush=True)
    print(f"Friends list: {[f.name for f in request.user.friends.all()]}", flush=True)
    sys.stdout.flush()
    
    if user in request.user.friends.all():
        print(f"=== {user.name} IS A FRIEND! Removing... ===", flush=True)
        sys.stdout.flush()
        # Remove from each other's friends list (ManyToMany handles both sides)
        request.user.friends.remove(user)
        
        # Count actual friends and update counts
        request.user.friends_count = request.user.friends.count()
        request.user.save()
        
        user.refresh_from_db()
        user.friends_count = user.friends.count()
        user.save()
        
        print(f"After removal - {request.user.name} has {request.user.friends_count} friends", flush=True)
        print(f"After removal - {user.name} has {user.friends_count} friends", flush=True)
        
        # Delete the friendship requests between them
        FriendshipRequest.objects.filter(created_for=request.user, created_by=user).delete()
        FriendshipRequest.objects.filter(created_for=user, created_by=request.user).delete()
        
        print("=== REMOVAL COMPLETE ===", flush=True)
        return JsonResponse({'message': 'friend removed'})
    else:
        print(f"=== NOT FRIENDS - {user.name} not in {request.user.name}'s friends ===", flush=True)
        return JsonResponse({'message': 'not friends'}, status=400)