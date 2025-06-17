import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react'; // <--- NOVA IMPORTAÇÃO AQUI!
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './AuthContext';

// Importe os componentes de tela usados no AuthStack e RootNavigator
import CreateProfileScreen from './CreateProfileScreen';
import LoginScreen from './LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import SignupScreen from './SignupScreen';
import WelcomeScreen from './WelcomeScreen';

// --- NOVAS IMPORTAÇÕES PARA FONTES ---
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// --- FIM NOVAS IMPORTAÇÕES ---

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Componente AuthStackNavigator
const AuthStackNavigator = () => {
  console.log('AuthStackNavigator: Renderizando o Stack de Autenticação.');
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

// Componente RootNavigator
const RootNavigator = () => {
  const { currentUser, authLoading } = useAuth();

  // --- CONSOLE.LOGS DE DEBUG ---
  console.log('RootNavigator: Início da função');
  console.log('RootNavigator: authLoading =', authLoading);
  console.log('RootNavigator: currentUser =', currentUser ? 'Existe ' + JSON.stringify(currentUser) : 'Não existe null');
  console.log('RootNavigator: MainTabNavigator COMPONENT (verificando antes de usar) =', typeof MainTabNavigator, MainTabNavigator);
  console.log('RootNavigator: WelcomeScreen COMPONENT (verificando antes de usar) =', typeof WelcomeScreen, WelcomeScreen);
  console.log('RootNavigator: CreateProfileScreen COMPONENT (verificando antes de usar) =', typeof CreateProfileScreen, CreateProfileScreen);
  // --- FIM DOS CONSOLE.LOGS DE DEBUG

  if (authLoading) {
    console.log('RootNavigator: Exibindo tela de carregamento de autenticação.');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#e0e0e0' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Carregando autenticação...</Text>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>{currentUser ? (
      currentUser.profileCompleted ? (
        <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      ) : (
        <RootStack.Screen name="CreateProfile" component={CreateProfileScreen} />
      )
    ) : (
      <RootStack.Screen name="Auth" component={AuthStackNavigator} />
    )}</RootStack.Navigator>
  );
};

export default function App() {
  console.log('App.js: Renderizando o componente App.');

  SplashScreen.preventAutoHideAsync();

  const [fontsLoaded] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
  });

  useEffect(() => { // <--- useEffect AGORA SERÁ RECONHECIDO
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});