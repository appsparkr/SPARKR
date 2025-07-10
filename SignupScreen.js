// SignupScreen.js
import { Ionicons } from '@expo/vector-icons'; // ADICIONADO: Importação do Ionicons
import { useNavigation } from '@react-navigation/native';
import Checkbox from 'expo-checkbox';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

export default function SignupScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signup, authLoading } = useAuth();
    const navigation = useNavigation();

    const handleSignUp = useCallback(async () => {
        setError('');

        console.log('SignupScreen - A iniciar registo...');

        if (!email || !password || !confirmPassword || !username.trim()) {
            Alert.alert('Erro no Registo', 'Por favor, preencha todos os campos.');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Erro no Registo', 'Deve aceitar os Termos de Utilização e a Política de Privacidade.');
            console.log('SignupScreen - Termos não aceites');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro no Registo', 'As palavras-passe não coincidem.');
            console.log('SignupScreen - Palavras-passe não coincidem');
            return;
        }

        setLoading(true);
        try {
            await signup(email, password);
            console.log('SignupScreen - Registo concluído.');

            // MODIFICADO: Remover a navegação explícita para 'MainTabs'.
            // O App.js já lida com o redirecionamento para CreateProfileScreen ou MainTabs
            // com base no estado do perfil do usuário após o signup.
            // Apenas retorna e deixa o AuthContext/App.js fazer o trabalho.
            console.log('SignupScreen: Registo bem-sucedido. O AuthContext/App.js irá gerir o redirecionamento.');
            
        } catch (err) {
            console.error('SignupScreen - Erro no registo:', err);
            Alert.alert('Erro no Registo', err.message || 'Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
            console.log('SignupScreen - A finalizar handleSignUp');
        }
    }, [email, password, confirmPassword, username, termsAccepted, signup]); // Removido 'navigation' das dependências, pois não é mais usado para navegação direta aqui.

    const handleTermsLink = useCallback(() => {
        navigation.navigate('TermsOfUse'); 
    }, [navigation]);

    const handlePrivacyLink = useCallback(() => {
        navigation.navigate('PrivacyPolicy'); 
    }, [navigation]);

    // Função para a seta de voltar
    const handleBack = useCallback(() => {
        console.log('Navegando para Welcome');
        navigation.goBack(); // Volta para a tela anterior na pilha (WelcomeScreen)
    }, [navigation]);

    const isButtonDisabled = !termsAccepted || !email || !password || !confirmPassword || !username.trim() || loading || authLoading;

    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            {/* Cabeçalho com a seta de voltar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registar</Text>
                {/* Espaçador para centralizar o título */}
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <Text style={styles.logo}>SPARKR</Text>
                <Text style={styles.description}>
                    Crie a sua conta para se conectar com a comunidade SPARKR
                </Text>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="O seu e-mail"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nome de Utilizador</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="O seu nome de utilizador"
                        placeholderTextColor={Colors.textSecondary}
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Palavra-passe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="A sua palavra-passe"
                        placeholderTextColor={Colors.textSecondary}
                        secureTextEntry={true}
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirmar Palavra-passe</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Confirme a sua palavra-passe"
                        placeholderTextColor={Colors.textSecondary}
                        secureTextEntry={true}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />
                </View>

                <View style={styles.termsContainer}>
                    <Checkbox
                        style={styles.checkbox}
                        value={termsAccepted}
                        onValueChange={setTermsAccepted}
                        color={termsAccepted ? Colors.primary : Colors.textSecondary}
                    />
                    <Text style={styles.termsText}>
                        <Text>Eu li e aceito os </Text>
                        <Text style={styles.linkText} onPress={handleTermsLink}>
                            Termos de Utilização
                        </Text>
                        <Text> e a </Text>
                        <Text style={styles.linkText} onPress={handlePrivacyLink}>
                            Política de Privacidade
                        </Text>
                        <Text>.</Text>
                    </Text>
                </View>
                
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                    style={[styles.signupButton, isButtonDisabled && styles.disabledButton]}
                    disabled={isButtonDisabled}
                    onPress={handleSignUp}
                >
                    {loading ? <ActivityIndicator size="small" color={Colors.background} /> : <Text style={styles.signupButtonText}>Criar Conta</Text>}
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OU</Text>
                    <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginButtonText}>Já tem uma conta? Entrar</Text>
                </TouchableOpacity>
                <Text style={styles.ageWarning}>
                    Ao registar-se, confirma que tem pelo menos 18 anos de idade.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    backButton: {
        padding: 5,
    },
    placeholder: {
        width: 24 + 10, // Largura do ícone + padding para centralizar o título
    },
    scrollView: {
        flex: 1,
        width: '100%',
    },
    contentContainer: {
        alignItems: 'center',
        padding: 20,
        paddingTop: 40,
        paddingBottom: 40,
        width: '100%',
    },
    logo: {
        fontSize: 42,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    inputGroup: {
        width: '90%',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: Colors.text,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: Colors.card,
        borderRadius: 5,
        paddingHorizontal: 15,
        color: Colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 10,
        width: '90%',
    },
    checkbox: {
        marginRight: 10,
    },
    termsText: {
        color: Colors.textSecondary,
        fontSize: 13,
        flex: 1,
        flexWrap: 'wrap',
    },
    linkText: {
        color: Colors.primary,
        textDecorationLine: 'underline',
        fontWeight: 'bold',
    },
    signupButton: {
        width: '90%',
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    disabledButton: {
        backgroundColor: Colors.border,
        opacity: 0.7,
    },
    signupButtonText: {
        color: Colors.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '90%',
        marginBottom: 20,
        marginTop: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.border,
    },
    dividerText: {
        color: Colors.textSecondary,
        paddingHorizontal: 10,
        fontSize: 14,
    },
    loginButton: {
        width: '90%',
        height: 50,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    loginButtonText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    ageWarning: {
        color: Colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        paddingHorizontal: 10,
    },
    errorText: {
        color: Colors.danger,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
        width: '90%',
    },
});