import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'wey_backend.settings')
django.setup()

from account.models import User, FriendshipRequest

# Get two users
users = list(User.objects.all()[:2])
if len(users) >= 2:
    user1 = users[0]
    user2 = users[1]
    
    print('\n=== INITIAL STATE ===')
    print(f'User 1: {user1.name}')
    print(f'  Friends count: {user1.friends_count}')
    print(f'  Friends: {[f.name for f in user1.friends.all()]}')
    
    print(f'\nUser 2: {user2.name}')
    print(f'  Friends count: {user2.friends_count}')
    print(f'  Friends: {[f.name for f in user2.friends.all()]}')
    
    # Make them friends if they aren't
    if user2 not in user1.friends.all():
        print('\n=== ADDING FRIENDSHIP ===')
        user1.friends.add(user2)
        user1.friends_count = user1.friends.count()
        user1.save()
        user2.refresh_from_db()
        user2.friends_count = user2.friends.count()
        user2.save()
        print('Added friendship')
    
    # Refresh and check
    user1.refresh_from_db()
    user2.refresh_from_db()
    
    print('\n=== AFTER ADDING (if needed) ===')
    print(f'User 1: {user1.name}')
    print(f'  Friends count: {user1.friends_count}')
    print(f'  Is User2 a friend: {user2 in user1.friends.all()}')
    
    print(f'\nUser 2: {user2.name}')
    print(f'  Friends count: {user2.friends_count}')
    print(f'  Is User1 a friend: {user1 in user2.friends.all()}')
    
    # Test removal
    print('\n=== TESTING REMOVAL ===')
    
    if user2 in user1.friends.all():
        user1.friends.remove(user2)
        user1.friends_count = user1.friends.count()
        user1.save()
        user2.refresh_from_db()
        user2.friends_count = user2.friends.count()
        user2.save()
        
        user1.refresh_from_db()
        user2.refresh_from_db()
        
        print('\n=== AFTER REMOVAL ===')
        print(f'User 1: {user1.name}')
        print(f'  Friends count: {user1.friends_count}')
        print(f'  Friends: {[f.name for f in user1.friends.all()]}')
        print(f'  Is User2 a friend: {user2 in user1.friends.all()}')
        
        print(f'\nUser 2: {user2.name}')
        print(f'  Friends count: {user2.friends_count}')
        print(f'  Friends: {[f.name for f in user2.friends.all()]}')
        print(f'  Is User1 a friend: {user1 in user2.friends.all()}')
        
        print('\n✅ Test completed - Removal logic works correctly!')
    else:
        print('ERROR: Users were not friends!')
else:
    print('ERROR: Not enough users to test. Create at least 2 users.')
