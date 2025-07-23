// HelpAndSupportScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from './constants/Colors';

const HelpAndSupportScreen = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ajuda e Suporte</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Perguntas Frequentes (FAQ)</Text>
                <View style={styles.faqItem}>
                    <Text style={styles.question}>Como posso apagar a minha conta?</Text>
                    <Text style={styles.answer}>
    {'Para apagar a sua conta, vá a Definições > Conta e selecione a opção "Apagar Conta". Por favor, note que esta ação é irreversível.'}
</Text>
                </View>
                <View style={styles.faqItem}>
                    <Text style={styles.question}>Como funciona a denúncia de conteúdo?</Text>
                    <Text style={styles.answer}>
                        Ao denunciar um post ou perfil, a nossa equipa de moderação irá rever o conteúdo. Se violar as nossas diretrizes, tomaremos a ação apropriada.
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Contacto</Text>
                <View style={styles.contactItem}>
                    <Text style={styles.contactText}>
                        Se precisar de ajuda adicional, por favor, entre em contacto connosco através do e-mail:
                    </Text>
                    <Text style={styles.emailText}>suporte@sparkr.app</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        height: 60,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
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
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        marginTop: 10,
    },
    faqItem: {
        marginBottom: 20,
    },
    question: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 5,
    },
    answer: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    contactItem: {
        marginTop: 10,
    },
    contactText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.primary,
        textAlign: 'center',
        marginTop: 10,
    },
});

export default HelpAndSupportScreen;