import React from 'react';
import Constants from 'expo-constants';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider } from './AuthContext';
import WelcomeScreen from './WelcomeScreen';
import SignupScreen from './SignupScreen';
import LoginScreen from './LoginScreen';
import HomeScreen from './HomeScreen';
import CreateProfileScreen from './CreateProfileScreen';
import ProfileScreen from './ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  console.log('App.js - Rendering App...');
  console.log('App.js - Constants.expoConfig:', Constants.expoConfig);
  console.log('App.js - Stack Navigator screens:', [
    'Welcome',
    'Signup',
    'Login',
    'Home',
    'CreateProfile',
    'Profile',
  ]);
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to Welcome'),
            })}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to Signup'),
            })}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to Login'),
            })}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to Home'),
            })}
          />
          <Stack.Screen
            name="CreateProfile"
            component={CreateProfileScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to CreateProfile'),
            })}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
            listeners={() => ({
              state: () => console.log('App.js - Navigated to Profile'),
            })}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}