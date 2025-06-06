import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, Linking, ScrollView } from 'react-native';
import Checkbox from 'expo-checkbox';
import Colors from './constants/Colors';
import { useAuth } from './AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigation = useNavigation();

  const handleSignUp = async () => {
    setLoading(true);
    setError('');

    console.log('SignupScreen - Iniciando signup...');

    if (!termsAccepted) {
      setError('Você precisa aceitar os termos de uso.');
      setLoading(false);
      console.log('SignupScreen - Termos não aceitos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      console.log('SignupScreen - Senhas não coincidem');
      return;
    }

    try {
      await signup(email, password, username);
      console.log('SignupScreen - Signup concluído, navegando para CreateProfile...');
      navigation.replace('CreateProfile');
      console.log('SignupScreen - Navegação para CreateProfile executada');
    } catch (err) {
      console.error('SignupScreen - Erro no signup:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('SignupScreen - Finalizando handleSignUp');
    }
  };

  const handleTermsLink = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handlePrivacyLink = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleBack = () => {
    console.log('Navigating to Welcome');
    navigation.navigate('Welcome');
  };

  const isButtonDisabled = !termsAccepted || !email || !password || !confirmPassword || !username || loading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.logo}>SPARKR</Text>
        <Text style={styles.description}>
          Crie sua conta para se conectar com a comunidade SPARKR
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Nome de usuário"
            placeholderTextColor={Colors.textSecondary}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={Colors.textSecondary}
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirmar senha"
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
            Eu li e aceito os{' '}
            <Text style={styles.linkText} onPress={handleTermsLink}>
              Termos de Uso
            </Text>
            {' '}e{' '}
            <Text style={styles.linkText} onPress={handlePrivacyLink}>
              Política de Privacidade
            </Text>
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.signupButton, isButtonDisabled && styles.disabledButton]}
          disabled={isButtonDisabled}
          onPress={handleSignUp}
        >
          <Text style={styles.signupButtonText}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </Text>
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
          Ao se cadastrar, você confirma que tem pelo menos 18 anos de idade.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
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
  inputContainer: {
    width: '90%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 60,
    backgroundColor: Colors.card,
    borderRadius: 5,
    marginBottom: 10,
    paddingHorizontal: 15,
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
    fontSize: 14,
    flex: 1,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
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
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 30,
    color: Colors.primary,
  },
  errorText: {
    color: Colors.error,
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 14,
  },
});