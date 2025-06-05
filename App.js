import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, ActivityIndicator } from 'react-native';

// *** Importações dos seus módulos ***
import { AuthProvider, useAuth } from './AuthContext';
import WelcomeScreen from './WelcomeScreen';
import SignupScreen from './SignupScreen';
import LoginScreen from './LoginScreen';
import CreateProfileScreen from './CreateProfileScreen';
import MainTabNavigator from './MainTabNavigator.js'; // Adicione o .js explicitamente

const AuthStack = createNativeStackNavigator(); // Stack para as telas de autenticação
const RootStack = createNativeStackNavigator(); // Stack principal para alternar entre Auth e MainApp

// Componente de carregamento simples
function LoadingScreen() {
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={{ marginTop: 10 }}>Carregando...</Text>
    </SafeAreaView>
  );
}

// Navegador para as telas de Autenticação
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

// Componente principal que decide qual fluxo de navegação mostrar
function RootNavigator() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {currentUser ? (
        // Se o usuário está logado
        currentUser.profileCompleted ? (
          // Perfil completo: vai para o MainTabNavigator
          <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          // Perfil incompleto: vai para CreateProfileScreen
          <RootStack.Screen name="CreateProfile" component={CreateProfileScreen} />
        )
      ) : (
        // Usuário não logado: vai para a Stack de Autenticação
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <AuthProvider>
          {/* NavigationContainer deve envolver o navegador de nível mais alto */}
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}