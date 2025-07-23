// SignupScreen.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker'; // <--- ADICIONADO
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
    // const [fullName, setFullName] = useState(''); // <--- REMOVIDO
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // --- INÍCIO DAS NOVAS VARIÁVEIS DE ESTADO PARA DATA ---
    const [dateOfBirth, setDateOfBirth] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    // --- FIM DAS NOVAS VARIÁVEIS DE ESTADO PARA DATA ---

    const { authLoading, signup } = useAuth(); // <--- signup ADICIONADO NOVAMENTE
    const navigation = useNavigation();

    // --- NOVA FUNÇÃO PARA LIDAR COM A MUDANÇA DE DATA ---
    const onDateChange = (event, selectedDate) => {
        setShowDatePicker(false); // Esconde o seletor
        if (selectedDate) {
            setDateOfBirth(selectedDate);
        }
    };
    
    // --- handleSignUp ATUALIZADO ---
    const handleSignUp = useCallback(async () => {
        setError('');
        console.log('SignupScreen - A iniciar validação...');

        if (!email || !password || !confirmPassword || !username.trim() || !dateOfBirth) {
            Alert.alert('Erro no Registo', 'Por favor, preencha todos os campos, incluindo a data de nascimento.');
            return;
        }

        // Verificação de Idade
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        if (age < 18) {
            Alert.alert('Registo Negado', 'Você precisa ter pelo menos 18 anos para se registar.');
            return;
        }

        if (!termsAccepted) {
            Alert.alert('Erro no Registo', 'Deve aceitar os Termos de Utilização e a Política de Privacidade.');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Erro no Registo', 'As palavras-passe não coincidem.');
            return;
        }

        // Lógica CORRIGIDA: Apenas navega para a próxima tela, passando os dados.
        // A criação do utilizador acontecerá no CreateProfileScreen.
        navigation.navigate('CreateProfile', { 
            email, 
            password, 
            username, 
            dateOfBirth: dateOfBirth.toISOString() // Passa a data como texto
        });

    }, [email, password, confirmPassword, username, termsAccepted, dateOfBirth, navigation]);

    const handleTermsLink = useCallback(() => {
        navigation.navigate('TermsOfUse');
    }, [navigation]);

    const handlePrivacyLink = useCallback(() => {
        navigation.navigate('PrivacyPolicy');
    }, [navigation]);

    const handleBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // --- LÓGICA DO BOTÃO ATUALIZADA ---
    const isButtonDisabled = !termsAccepted || !email || !password || !confirmPassword || !username.trim() || !dateOfBirth || loading || authLoading;

    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Registar</Text>
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

                {/* --- CAMPO "NOME COMPLETO" SUBSTITUÍDO POR "DATA DE NASCIMENTO" --- */}
                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Data de Nascimento</Text>
                    <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                        <Text style={dateOfBirth ? styles.dateText : styles.datePlaceholder}>
                            {dateOfBirth ? dateOfBirth.toLocaleDateString('pt-PT') : 'Selecione a sua data'}
                        </Text>
                    </TouchableOpacity>
                </View>
                
                {/* O DatePicker é renderizado condicionalmente */}
                {showDatePicker && (
                    <DateTimePicker
                        value={dateOfBirth || new Date()}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        maximumDate={new Date()} // Não permite selecionar datas futuras
                    />
                )}
                {/* --- FIM DA SUBSTITUIÇÃO --- */}

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
                        <Text style={styles.linkText} onPress={handleTermsLink}>Termos de Utilização</Text>
                        <Text> e a </Text>
                        <Text style={styles.linkText} onPress={handlePrivacyLink}>Política de Privacidade</Text>
                        <Text>, e confirmo que tenho pelo menos 18 anos.</Text>
                    </Text>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                    style={[styles.signupButton, isButtonDisabled && styles.disabledButton]}
                    disabled={isButtonDisabled}
                    onPress={handleSignUp}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color={Colors.background} />
                    ) : (
                        <Text style={styles.signupButtonText}>Criar Conta</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>OU</Text>
                    <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginButtonText}>Já tem uma conta? Entrar</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// --- NOVOS ESTILOS ADICIONADOS ---
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
        width: 24 + 10,
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
        justifyContent: 'center', // Adicionado para alinhar o texto do seletor de data
    },
    datePlaceholder: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
    dateText: {
        color: Colors.text,
        fontSize: 16,
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
        color: Colors.danger, // Corrigido para Colors.danger
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 14,
        width: '90%',
    },
});