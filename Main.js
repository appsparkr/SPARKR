import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './AuthContext';
import WelcomeScreen from './WelcomeScreen';
import SignupScreen from './SignupScreen';
import LoginScreen from './LoginScreen';
import CreateProfileScreen from './CreateProfileScreen';
import ProfileScreen from './ProfileScreen';
import AppNavigator from './AppNavigator';
import LoadingScreen from './LoadingScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

// Componente para gerenciar a navegação com base no estado de autenticação
const AppNavigation = () => {
  const { currentUser, loading } = useAuth();
  const [initialRoute, setInitialRoute] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Verificar se o usuário já está logado e determinar a rota inicial
    const checkUserSession = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          console.log('Main - Dados do usuário encontrados:', userData);
          
          if (userData.profileCompleted) {
            setInitialRoute('Main');
          } else {
            setInitialRoute('CreateProfile');
          }
        } else {
          setInitialRoute('Welcome');
        }
      } catch (error) {
        console.error('Main - Erro ao verificar sessão:', error);
        setInitialRoute('Welcome');
      } finally {
        setIsReady(true);
      }
    };

    if (!loading) {
      if (currentUser) {
        if (currentUser.profileCompleted) {
          setInitialRoute('Main');
        } else {
          setInitialRoute('CreateProfile');
        }
        setIsReady(true);
      } else {
        checkUserSession();
      }
    }
  }, [currentUser, loading]);

  if (!isReady || loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateProfile"
          component={CreateProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={AppNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function Main() {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
}
