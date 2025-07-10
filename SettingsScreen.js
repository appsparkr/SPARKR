// SettingsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const SettingsScreen = () => {
    const { logout, currentUser } = useAuth();
    const navigation = useNavigation();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = useCallback(async () => {
        Alert.alert(
            'Sair da Conta',
            'Tem a certeza de que deseja sair?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Sair',
                    onPress: async () => {
                        setIsLoggingOut(true);
                        try {
                            await logout();
                            // Após o logout, redefinir a navegação para a tela de autenticação
                            // Assumindo que a rota de autenticação principal no seu RootStack é 'Auth'
                            navigation.dispatch(
                                CommonActions.reset({
                                    index: 0,
                                    routes: [{ name: 'Auth' }], // 'Auth' deve ser o nome da sua rota de autenticação no RootStack
                                })
                            );
                            console.log('SettingsScreen: Navegação redefinida para a tela de autenticação.');
                        } catch (error) {
                            console.error('SettingsScreen: Erro ao fazer logout:', error);
                            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
                        } finally {
                            setIsLoggingOut(false);
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }, [logout, navigation]);

    // Função para navegar para Termos de Utilização (navegação aninhada)
    const handleTermsOfUse = useCallback(() => {
        // Navega para o 'Auth' Stack, e dentro dele, para a tela 'TermsOfUse'
        navigation.navigate('Auth', { screen: 'TermsOfUse' });
    }, [navigation]);

    // Função para navegar para Política de Privacidade (navegação aninhada)
    const handlePrivacyPolicy = useCallback(() => {
        // Navega para o 'Auth' Stack, e dentro dele, para a tela 'PrivacyPolicy'
        navigation.navigate('Auth', { screen: 'PrivacyPolicy' });
    }, [navigation]);

    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            {/* Cabeçalho da tela de definições */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Definições</Text>
                {/* Espaçador para centralizar o título. Não renderiza texto visível. */}
                <View style={styles.placeholder} />
            </View>

            <View style={styles.content}>
                {/* Exemplo de outras opções de configuração */}
                <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Funcionalidade', 'Gerir notificações')}>
                    <Text style={styles.settingText}>Notificações</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Funcionalidade', 'Definições de privacidade')}>
                    <Text style={styles.settingText}>Privacidade</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* NOVOS: Links para Termos de Utilização e Política de Privacidade */}
                <TouchableOpacity style={styles.settingItem} onPress={handleTermsOfUse}>
                    <Text style={styles.settingText}>Termos de Utilização</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={handlePrivacyPolicy}>
                    <Text style={styles.settingText}>Política de Privacidade</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingItem} onPress={() => Alert.alert('Funcionalidade', 'Ajuda e Suporte')}>
                    <Text style={styles.settingText}>Ajuda e Suporte</Text>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Botão de Sair */}
                <TouchableOpacity
                    style={[styles.logoutButton, isLoggingOut && { opacity: 0.7 }]}
                    onPress={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.logoutButtonText}>Sair</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    placeholder: {
        width: 24 + 10,
    },
    content: {
        flex: 1,
        padding: 15,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    settingText: {
        fontSize: 16,
        color: Colors.text,
    },
    logoutButton: {
        backgroundColor: Colors.danger,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    logoutButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SettingsScreen;