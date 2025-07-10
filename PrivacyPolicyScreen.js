// PrivacyPolicyScreen.js
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from './constants/Colors'; // Caminho de importação corrigido

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        {/* Espaçador para alinhar o título. Certifique-se de que não há espaços aqui. */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Política de Privacidade do Sparkr</Text>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Dados que Recolhemos</Text>
          <Text style={styles.paragraph}>
            Recolhemos informações que nos fornece diretamente, como o seu nome de utilizador, endereço de e-mail, imagem de perfil e qualquer conteúdo que publique. Também recolhemos dados técnicos, como informações do dispositivo e endereço IP.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Como Utilizamos os Seus Dados</Text>
          <Text style={styles.paragraph}>
            Os seus dados são utilizados para:
          </Text>
          <Text style={styles.listItem}>• Fornecer e manter os nossos serviços.</Text>
          <Text style={styles.listItem}>• Personalizar a sua experiência.</Text>
          <Text style={styles.listItem}>• Melhorar a nossa plataforma e desenvolver novas funcionalidades.</Text>
          <Text style={styles.listItem}>• Comunicar consigo sobre a sua conta e atualizações.</Text>
          <Text style={styles.listItem}>• Garantir a segurança e prevenir fraudes.</Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Partilha e Divulgação de Dados</Text>
          <Text style={styles.paragraph}>
            Não vendemos os seus dados pessoais. Podemos partilhar informações com:
          </Text>
          <Text style={styles.listItem}>• Fornecedores de serviços que nos ajudam a operar a plataforma (por exemplo, alojamento na cloud, análise).</Text>
          <Text style={styles.listItem}>• Autoridades policiais ou governamentais, se exigido por lei.</Text>
          <Text style={styles.listItem}>• Outros utilizadores, para conteúdo que escolha tornar público (por exemplo, publicações, informações de perfil).</Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Os Seus Direitos</Text>
          <Text style={styles.paragraph}>
            Tem o direito de:
          </Text>
          <Text style={styles.listItem}>• Aceder e obter uma cópia dos seus dados.</Text>
          <Text style={styles.listItem}>• Solicitar a correção de dados incorretos.</Text>
          <Text style={styles.listItem}>• Solicitar a eliminação dos seus dados (sujeito a obrigações legais).</Text>
          <Text style={styles.listItem}>• Opor-se ou restringir determinado processamento dos seus dados.</Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Segurança dos Dados</Text>
          <Text style={styles.paragraph}>
            Implementamos medidas de segurança razoáveis para proteger os seus dados contra acesso não autorizado, alteração, divulgação ou destruição.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Alterações a Esta Política</Text>
          <Text style={styles.paragraph}>
            Podemos atualizar esta Política de Privacidade periodicamente. Notificá-lo-emos de quaisquer alterações publicando a nova política nesta página.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Contacte-nos</Text>
          <Text style={styles.paragraph}>
            Se tiver alguma questão sobre esta Política de Privacidade, por favor, contacte-nos em privacy@sparkr.com.
          </Text>
        </View>
      
        <View style={styles.footer}>
          <Text style={styles.footerText}>Última atualização: 31 de março de 2025</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 8,
    paddingLeft: 10,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});