import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthContext } from '../contexts/AuthContext';
import FeedScreen from '../screens/FeedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import LoadingScreen from '../screens/LoadingScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import GraphScreen from '../screens/GraphScreen';
import PeopleIcon from '../components/icons/PeopleIcon';
import HomeIcon from '../components/icons/HomeIcon';
import MessageIcon from '../components/icons/MessageIcon';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1A2332' }}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#F4C430',
          tabBarInactiveTintColor: '#6B7280',
          tabBarStyle: {
            backgroundColor: '#1F2937',
            borderTopWidth: 0,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarShowLabel: false,
          headerShown: false,
        
        }}
      >
        <Tab.Screen 
          name="Search" 
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color }) => <PeopleIcon size={28} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Feed" 
          component={FeedScreen}
          options={{
            tabBarIcon: ({ color }) => <HomeIcon size={28} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Messages" 
          component={ChatListScreen}
          options={{
            tabBarIcon: ({ color }) => <MessageIcon size={28} color={color} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Main" 
              component={MainTabs} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Graph" 
              component={GraphScreen}
              options={{ 
                headerShown: true,
                title: 'Graph',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="PostDetail" 
              component={PostDetailScreen}
              options={{ 
                headerShown: true,
                title: 'Post',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePostScreen}
              options={{ 
                headerShown: true,
                title: 'Create Post',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
              options={{ 
                headerShown: true,
                title: 'Profile',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ 
                headerShown: true,
                title: 'My Profile',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen}
              options={{ 
                headerShown: true,
                title: 'Notifications',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="EditProfile" 
              component={EditProfileScreen}
              options={{ 
                headerShown: true,
                title: 'Edit Profile',
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{ 
                headerShown: true,
                headerBackTitle: 'Back',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});
