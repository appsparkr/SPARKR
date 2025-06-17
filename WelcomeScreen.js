import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import Colors from './constants/Colors';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleShowLogin = () => {
    console.log('Navigating to Login');
    navigation.navigate('Login');
  };

  const handleShowSignup = () => {
    console.log('Navigating to Signup');
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <Text style={[styles.logo, { color: Colors.primary }]}>SPARKR</Text>
      <Text style={styles.description}>
        Uma plataforma para a comunidade adulta (18+) compartilhar e conectar-se em um ambiente seguro e respeitoso.
      </Text>

      <TouchableOpacity
        style={[styles.loginButton, { backgroundColor: Colors.primary }]}
        onPress={handleShowLogin}
      >
        <Text style={styles.loginButtonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.signupButton, { backgroundColor: Colors.primary }]}
        onPress={handleShowSignup}
      >
        <Text style={styles.signupButtonText}>Criar Conta</Text>
      </TouchableOpacity>

      <Text style={{ color: Colors.textSecondary, marginVertical: 15 }}>OU</Text>

      <TouchableOpacity
        style={[styles.socialButton, { backgroundColor: '#000', borderWidth: 1, borderColor: Colors.primary }]}
      >
        <Text style={[styles.socialButtonText, { color: Colors.primary }]}>Continuar com Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.socialButton, { backgroundColor: '#000', borderWidth: 1, borderColor: Colors.primary }]}
      >
        <Text style={[styles.socialButtonText, { color: Colors.primary }]}>Continuar com Apple</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        Ao entrar, você confirma que tem pelo menos 18 anos e concorda com nossos Termos de Uso e Política de Privacidade.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  loginButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
    width: '90%',
    alignSelf: 'center',
  },
  loginButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginTop: 15,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  socialButton: {
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    width: '90%',
    alignSelf: 'center',
  },
  socialButtonText: {
    fontSize: 16,
  },
});