// ChatScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react'; // Adicionado React e useCallback
import {
    ActivityIndicator,
    Alert // Importar Alert para mensagens de erro
    ,

    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext'; // Ajuste o caminho conforme necessário
import Colors from './constants/Colors'; // Ajuste o caminho conforme necessário

const ChatScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    // 1. Desestruturação de route.params mais segura
    const { chatId, otherUserId, otherUsername, otherUserProfileImage } = route.params || {};

    // Removido getUserProfileById, pois não é usado aqui
    const { currentUser, sendMessage, getMessages } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);

    // 2. Tratamento robusto para chatId ausente
    useEffect(() => {
        if (!chatId) {
            console.error('ChatScreen: chatId é undefined. Não é possível carregar mensagens.');
            Alert.alert('Erro no Chat', 'Não foi possível iniciar o chat. ID do chat ausente.');
            navigation.goBack(); // Volta para a tela anterior
            return;
        }

        // Define o título do cabeçalho da tela
        navigation.setOptions({
            headerShown: true,
            title: otherUsername || 'Chat',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerBackTitleVisible: false,
            // Adiciona um botão de voltar personalizado no cabeçalho
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
            ),
        });

        // Listener de mensagens em tempo real
        setLoadingMessages(true);
        const unsubscribe = getMessages(chatId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            setLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [chatId, navigation, otherUsername, getMessages]); // Adicionado getMessages às dependências

    const handleSendMessage = useCallback(async () => {
        if (newMessage.trim() === '' || sendingMessage) {
            return;
        }
        setSendingMessage(true);
        try {
            // Garante que otherUserId é passado, mesmo que otherParticipant.uid seja undefined no log
            // A função sendMessage em AuthContext deve usar o otherUserId para determinar o recipiente
            await sendMessage(chatId, newMessage, otherUserId); // Passa otherUserId para sendMessage
            setNewMessage('');
        } catch (error) {
            console.error('ChatScreen: Erro ao enviar mensagem:', error);
            Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
        } finally {
            setSendingMessage(false);
        }
    }, [chatId, newMessage, sendingMessage, sendMessage, otherUserId]); // Adicionado otherUserId às dependências

    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderId === currentUser?.uid; // Acesso seguro a currentUser.uid
        const messageStyle = isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble;
        const messageTextStyle = isMyMessage ? styles.myMessageText : styles.otherMessageText;
        const containerAlignment = isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer;

        // 4. Defesa na renderização de mensagens
        const senderProfileImage = String(item.senderProfileImage || 'https://placehold.co/100x100/CCCCCC/000000?text=User');
        const messageText = String(item.text || '');

        let formattedTime = '';
        try {
            if (item.createdAt) {
                const date = new Date(item.createdAt);
                if (!isNaN(date.getTime())) {
                    formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    console.warn("ChatScreen: Data de createdAt inválida para formatação:", item.createdAt);
                }
            }
        } catch (e) {
            console.error("ChatScreen: Erro ao formatar messageTime:", e, "Valor:", item.createdAt);
            formattedTime = '';
        }

        return (
            <View style={containerAlignment}>
                {!isMyMessage && (
                    <Image source={{ uri: senderProfileImage }} style={styles.messageAvatar} />
                )}
                <View style={messageStyle}>
                    <Text style={messageTextStyle}>{messageText}</Text>
                    {formattedTime ? (
                        <Text style={styles.messageTime}>{formattedTime}</Text>
                    ) : null}
                </View>
            </View>
        );
    };

    if (loadingMessages) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando mensagens...</Text>
            </SafeAreaView>
        );
    }

    // Se chatId for nulo, o useEffect já deveria ter navegado de volta.
    // Este return é um fallback.
    if (!chatId) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Erro: ID do chat ausente.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Ajuste conforme a altura real do seu cabeçalho
            >
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) => item.id ? String(item.id) : index.toString()}
                    contentContainerStyle={styles.messagesListContent}
                    inverted={false} // Se quiser as mensagens mais recentes no topo, mude para true e ajuste o layout
                    showsVerticalScrollIndicator={false}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.messageInput}
                        placeholder="Digite uma mensagem..."
                        placeholderTextColor={Colors.textSecondary}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                    />
                    <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSendMessage}
                        disabled={sendingMessage || newMessage.trim() === ''}
                    >
                        {sendingMessage ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Ionicons name="send" size={24} color={Colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: 10,
        fontSize: 16,
    },
    messagesListContent: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 10,
    },
    myMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    otherMessageContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: 8,
    },
    myMessageBubble: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderBottomRightRadius: 2,
        maxWidth: '80%',
    },
    otherMessageBubble: {
        backgroundColor: Colors.card,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderBottomLeftRadius: 2,
        maxWidth: '80%',
    },
    myMessageText: {
        color: Colors.black, // Depende de Colors.black
        fontSize: 15,
    },
    otherMessageText: {
        color: Colors.text,
        fontSize: 15,
    },
    messageTime: {
        fontSize: 10,
        color: Colors.textSecondary,
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    messageAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 8,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: Colors.background,
    },
    messageInput: {
        flex: 1,
        backgroundColor: Colors.inputBackground || Colors.card, // Usar Colors.card como fallback
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: Colors.text,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: Colors.primary,
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default ChatScreen;