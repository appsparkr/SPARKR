    // screens/ChatDetailScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors'; // CORRIGIDO: Ajuste o caminho para apontar para a pasta constants na raiz

const ChatDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    // Você pode acessar os parâmetros passados da MessagesScreen aqui
    const { chatId, otherUserId, otherUsername, otherUserProfileImage } = route.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{otherUsername || 'Chat'}</Text>
                <View style={{ width: 24 }} /> {/* Espaçador para alinhar o título */}
            </View>
            <View style={styles.content}>
                <Text style={styles.contentText}>Esta é a tela de detalhes do chat.</Text>
                <Text style={styles.contentText}>Chat ID: {chatId}</Text>
                <Text style={styles.contentText}>Conversando com: {otherUsername} ({otherUserId})</Text>
                <Text style={styles.contentText}>Aqui as mensagens serão exibidas.</Text>
            </View>
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
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.card, // Usar Colors.card para o cabeçalho
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contentText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default ChatDetailScreen;