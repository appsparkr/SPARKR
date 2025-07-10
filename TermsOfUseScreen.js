// TermsOfUseScreen.js
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from './constants/Colors'; // Caminho de importação corrigido

export default function TermsOfUseScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termos de Utilização</Text>
        {/* Espaçador para alinhar o título. Certifique-se de que não há espaços aqui. */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.title}>Termos de Utilização do Sparkr</Text>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
          <Text style={styles.paragraph}>
            Ao criar uma conta e utilizar o Sparkr, concorda em cumprir estes Termos de Utilização e a Política de Privacidade. Se não concordar, não utilize a plataforma.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Idade Mínima</Text>
          <Text style={styles.paragraph}>
            O Sparkr é exclusivamente para utilizadores com mais de 18 anos. A utilização por menores é estritamente proibida.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Conteúdo Permitido e Restrições</Text>
          <Text style={styles.paragraph}>
            O Sparkr permite a publicação de conteúdo para adultos, desde que respeite as seguintes diretrizes:
          </Text>
          <Text style={styles.listItem}>• Conteúdo Legal: Não é permitido conteúdo que viole leis locais ou internacionais, incluindo, mas não se limitando a, exploração infantil, abuso, tráfico humano ou qualquer forma de violência não consensual.</Text>
          <Text style={styles.listItem}>• Consentimento: Deve possuir os direitos de todo o conteúdo que publica e garantir que todas as pessoas presentes no conteúdo deram consentimento explícito.</Text>
          <Text style={styles.listItem}>• Propriedade Intelectual: Não publique material protegido por direitos de autor sem permissão.</Text>
          <Text style={styles.listItem}>• Spam e Fraude: É proibido utilizar a plataforma para práticas enganosas, phishing ou venda de serviços ilícitos.</Text>
          <Text style={styles.listItem}>• Discurso de Ódio e Assédio: Qualquer forma de assédio, bullying ou discurso de ódio resultará na suspensão ou banimento da conta.</Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Política de Privacidade</Text>
          <Text style={styles.paragraph}>
            O Sparkr recolhe e processa dados conforme descrito na nossa Política de Privacidade. Os utilizadores têm controlo sobre os seus dados e podem eliminar as suas contas a qualquer momento.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Remoção de Conteúdo e Banimento</Text>
          <Text style={styles.paragraph}>
            O Sparkr pode remover qualquer conteúdo que viole estes termos e suspender ou banir utilizadores a seu critério. Em casos graves, as autoridades podem ser notificadas.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Pagamentos e Subscrições</Text>
          <Text style={styles.paragraph}>
            Se o Sparkr implementar funcionalidades pagas, os utilizadores concordam em seguir os termos de pagamento definidos e reconhecem que podem ser aplicadas taxas e encargos.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Responsabilidade do Utilizador</Text>
          <Text style={styles.paragraph}>
            Os utilizadores são inteiramente responsáveis pelo conteúdo que publicam e por qualquer interação na plataforma. O Sparkr não é responsável por danos resultantes da utilização do serviço.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Alterações aos Termos</Text>
          <Text style={styles.paragraph}>
            O Sparkr pode modificar estes Termos de Utilização a qualquer momento. Notificaremos os utilizadores sobre alterações relevantes.
          </Text>
        </View>
      
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Contacte-nos</Text>
          <Text style={styles.paragraph}>
            Para questões ou reclamações, por favor, contacte a nossa equipa de suporte em suporte@sparkr.com.
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