// App.js
import { NavigationContainer } from '@react-navigation/native'; // <--- useNavigation REIMPORTADO
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './AuthContext';

// Importe os componentes de tela usados no AuthStack e RootNavigator
import ChatScreen from './ChatScreen';
import CommentsScreen from './CommentsScreen';
import CreateProfileScreen from './CreateProfileScreen';
import EditProfileScreen from './EditProfileScreen';
import HelpAndSupportScreen from './HelpAndSupportScreen';
import LoginScreen from './LoginScreen';
import MainTabNavigator from './MainTabNavigator';
import MessagesScreen from './MessagesScreen';
import NotificationSettingsScreen from './NotificationSettingsScreen';
import PostDetailScreen from './PostDetailScreen';
import PrivacyPolicyScreen from './PrivacyPolicyScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import ProfileDetailScreen from './ProfileDetailScreen';
import SettingsScreen from './SettingsScreen';
import SignupScreen from './SignupScreen';
import StoryViewerScreen from './StoryViewerScreen';
import TermsOfUseScreen from './TermsOfUseScreen';
import WelcomeScreen from './WelcomeScreen';

import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Colors from './constants/Colors';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

// Componente AuthStackNavigator
const AuthStackNavigator = () => {
    // A rota inicial é sempre 'Welcome'. A lógica de qual tela mostrar
    // é tratada pela navegação normal (push/pop).
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
            <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Signup" component={SignupScreen} />
            <AuthStack.Screen name="CreateProfile" component={CreateProfileScreen} />
            <AuthStack.Screen
                name="TermsOfUse"
                component={TermsOfUseScreen}
                options={{ headerShown: true, title: 'Termos de Utilização' }}
            />
            <AuthStack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
                options={{ headerShown: true, title: 'Política de Privacidade' }}
            />
        </AuthStack.Navigator>
    );
};

// Componente AppContent que determina qual stack principal renderizar
const AppContent = () => {
    const { currentUser, authLoading, networkError } = useAuth();

    console.log('AppContent (RootNavigator Logic): Início da função');
    console.log('AppContent (RootNavigator Logic): authLoading =', authLoading);
    console.log('AppContent (RootNavigator Logic): currentUser =', currentUser ? 'Existe (uid: ' + currentUser.uid + ', profileCompleted: ' + currentUser.profileCompleted + ')' : 'Não existe (null)');

    if (authLoading === undefined || authLoading) {
        console.log('AppContent (RootNavigator Logic): A exibir tela de carregamento global.');
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>A preparar o aplicativo...</Text>
                {networkError && (
                    <Text style={styles.networkErrorText}>
                        Erro de conexão. Verifique sua internet ou tente novamente mais tarde.
                    </Text>
                )}
            </View>
        );
    }

    const initialRootRoute = currentUser && currentUser.profileCompleted ? 'MainTabs' : 'Auth';
    console.log('AppContent: A renderizar RootStack.Navigator com initialRouteName:', initialRootRoute);

    return (
        <RootStack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRootRoute}>
            <RootStack.Screen name="Auth" component={AuthStackNavigator} />
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Comments" component={CommentsScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="Messages" component={MessagesScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
            <RootStack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'modal' }} />
            <RootStack.Screen name="PostDetail" component={PostDetailScreen} options={{ headerShown: false }} />
        </RootStack.Navigator>
    );
};

export default function App() {
    console.log('App.js: A renderizar o componente App.');
    SplashScreen.preventAutoHideAsync();
    const [fontsLoaded] = useFonts({
        'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
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
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 10,
        color: Colors.text,
    },
    networkErrorText: {
        marginTop: 10,
        color: 'red',
        textAlign: 'center',
        marginHorizontal: 20,
    }
});