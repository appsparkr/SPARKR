// WelcomeScreen.js
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants'; // Importar Constants para statusBarHeight
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from './constants/Colors';

// Não estamos a usar width/height diretamente para a imagem nesta versão, mas mantemos a importação
// const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation();

  const handleShowLogin = () => {
    console.log('Navegando para Login');
    navigation.navigate('Login');
  };

  const handleShowSignup = () => {
    console.log('Navegando para Registo');
    navigation.navigate('Signup');
  };

  const handleTermsOfUse = () => {
    navigation.navigate('TermsOfUse'); // Navega para a tela de Termos de Utilização
  };

  const handlePrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy'); // Navega para a tela de Política de Privacidade
  };

  return (
    // SafeAreaView para lidar com entalhes e barras de status
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: Colors.background }]}>
      {/* Contentor principal para centralizar e adicionar padding */}
      <View style={styles.contentWrapper}> 
        <Text style={[styles.logo, { color: Colors.primary }]}>SPARKR</Text>
        
        <Text style={styles.description}>
          Uma plataforma para a comunidade adulta (18+) partilhar e conectar-se num ambiente seguro e respeitoso.
        </Text>

        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: Colors.primary }]}
          onPress={handleShowLogin}
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signupButton, { backgroundColor: Colors.primary }]}
          onPress={handleShowSignup}
        >
          <Text style={styles.buttonText}>Criar Conta</Text>
        </TouchableOpacity>

        <Text style={styles.separatorText}>OU</Text>

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

        {/* Texto dos Termos de Uso e Política de Privacidade com links clicáveis */}
        <Text style={styles.termsText}>
          <Text>Ao entrar, confirma que tem pelo menos 18 anos e concorda com os nossos </Text>
          <Text style={styles.linkText} onPress={handleTermsOfUse}>
            Termos de Utilização
          </Text>
          <Text> e a nossa </Text>
          <Text style={styles.linkText} onPress={handlePrivacyPolicy}>
            Política de Privacidade
          </Text>
          <Text>.</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    // Adicionado padding superior para Android para respeitar a barra de status
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  contentWrapper: { // Renomeado de 'container' para 'contentWrapper' para maior clareza
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
  buttonText: { // Estilo comum para os textos dos botões principais
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
  separatorText: { // Estilo para o texto "OU"
    color: Colors.textSecondary,
    marginVertical: 15,
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
  termsText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});