// App.js
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'; // ADICIONADO: Platform
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './AuthContext';

// Importe os componentes de tela usados no AuthStack e RootNavigator
import ChatScreen from './ChatScreen';
import CommentsScreen from './CommentsScreen';
import CreateProfileScreen from './CreateProfileScreen';
import LoginScreen from './LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import PostDetailScreen from './PostDetailScreen';
import ProfileDetailScreen from './ProfileDetailScreen';
import SettingsScreen from './SettingsScreen';
import SignupScreen from './SignupScreen';
import StoryViewerScreen from './StoryViewerScreen';
import WelcomeScreen from './WelcomeScreen';

// --- NOVAS IMPORTAÇÕES PARA FONTES ---
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
// --- FIM NOVAS IMPORTAÇÕES ---

// --- NOVAS IMPORTAÇÕES PARA TERMOS E PRIVACIDADE ---
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import TermsOfUseScreen from './TermsOfUseScreen';
// --- FIM NOVAS IMPORTAÇÕES ---

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Componente AuthStackNavigator
const AuthStackNavigator = () => {
  console.log('AuthStackNavigator: A renderizar o Stack de Autenticação.');
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      {/* Adicione as telas de Termos e Privacidade AQUI, dentro do AuthStack */}
      <AuthStack.Screen 
        name="TermsOfUse" 
        component={TermsOfUseScreen} 
        options={{ 
          headerShown: true,
          title: 'Termos de Utilização',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
      <AuthStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={{ 
          headerShown: true,
          title: 'Política de Privacidade',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' }
        }} 
      />
    </AuthStack.Navigator>
  );
};

// Componente AppContent que determina qual stack principal renderizar
const AppContent = () => {
  // CORRIGIDO: Acessa o contexto de autenticação de forma mais defensiva
  const authContext = useAuth(); 
  const currentUser = authContext?.currentUser; // Usa optional chaining
  const authLoading = authContext?.authLoading; // Usa optional chaining

  console.log('AppContent (RootNavigator Logic): Início da função');
  console.log('AppContent (RootNavigator Logic): authLoading =', authLoading);
  console.log('AppContent (RootNavigator Logic): currentUser =', currentUser ? 'Existe (uid: ' + currentUser.uid + ', profileCompleted: ' + currentUser.profileCompleted + ')' : 'Não existe (null)');

  // CORRIGIDO: Se authContext ainda não estiver disponível ou estiver carregando
  if (!authContext || authLoading === undefined || authLoading) { 
    console.log('AppContent (RootNavigator Logic): A exibir tela de carregamento de autenticação.');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#e0e0e0' }]}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>A carregar autenticação...</Text>
      </View>
    );
  }

  let initialRouteName;

  if (!currentUser) {
    initialRouteName = "Auth";
    console.log('AppContent: Utilizador NÃO autenticado. Rota inicial: Auth');
  } else if (!currentUser.profileCompleted) {
    initialRouteName = "CreateProfile";
    console.log('AppContent: Utilizador autenticado, mas perfil INCOMPLETO. Rota inicial: CreateProfile');
  } else {
    initialRouteName = "MainTabs";
    console.log('AppContent: Utilizador autenticado e perfil COMPLETO. Rota inicial: MainTabs');
  }

  console.log('AppContent: A renderizar RootStack.Navigator com initialRouteName:', initialRouteName);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRouteName}>
      <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      <RootStack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Telas que podem ser navegadas de dentro de MainTabs ou outras partes da aplicação */}
      <RootStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Definições',
          headerBackTitleVisible: false,
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: '#000' },
          headerTitleStyle: { color: '#fff' }
        }}
      />
      <RootStack.Screen
        name="ProfileDetail"
        component={ProfileDetailScreen}
        options={{
          headerShown: false, // Deixamos headerShown: false aqui, pois ProfileDetailScreen agora gerencia seu próprio cabeçalho
        }}
      />
      <RootStack.Screen
        name="Comments"
        component={CommentsScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* IMPORTANTE: REGISTRO DA CHATSCREEN AQUI */}
      <RootStack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{
          headerShown: true, // O cabeçalho será gerenciado pela própria ChatScreen
        }}
      />
      {/* ADICIONADO: REGISTRO DA STORYVIEWERSCREEN AQUI */}
      <RootStack.Screen
        name="StoryViewer"
        component={StoryViewerScreen}
        options={{
          headerShown: false, // O StoryViewerScreen geralmente não tem cabeçalho
          presentation: 'modal', // Abre como modal para uma experiência de story imersiva
        }}
      />
      {/* NOVO: REGISTRO DA POSTDETAILSCREEN AQUI */}
      <RootStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          headerShown: false, // O PostDetailScreen gerencia seu próprio cabeçalho
        }}
      />
    </RootStack.Navigator>
  );
};

export default function App() {
  console.log('App.js: A renderizar o componente App.');

  SplashScreen.preventAutoHideAsync();

  const [fontsLoaded] = useFonts({
    'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
    // Adicione outras fontes personalizadas aqui se você tiver
  });

  useEffect(() => {
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
          <AppContent />
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