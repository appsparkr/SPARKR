// ChatScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image // ADICIONADO: Importação do componente Image
    ,
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
    const { chatId, otherUserId, otherUsername, otherUserProfileImage } = route.params;

    const { currentUser, sendMessage, getMessages, getUserProfileById } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);

    // Define o título do cabeçalho da tela
    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: otherUsername || 'Chat',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerBackTitleVisible: false,
        });
    }, [navigation, otherUsername]);

    // Listener de mensagens em tempo real
    useEffect(() => {
        if (!chatId) {
            setLoadingMessages(false);
            return;
        }

        setLoadingMessages(true);
        const unsubscribe = getMessages(chatId, (fetchedMessages) => {
            setMessages(fetchedMessages);
            setLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [chatId, getMessages]);

    const handleSendMessage = async () => {
        if (newMessage.trim() === '' || sendingMessage) {
            return;
        }
        setSendingMessage(true);
        try {
            await sendMessage(chatId, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('ChatScreen: Erro ao enviar mensagem:', error);
            Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
        } finally {
            setSendingMessage(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMyMessage = item.senderId === currentUser.uid;
        const messageStyle = isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble;
        const messageTextStyle = isMyMessage ? styles.myMessageText : styles.otherMessageText;
        const containerAlignment = isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer;

        return (
            <View style={containerAlignment}>
                {!isMyMessage && item.senderProfileImage && (
                    <Image source={{ uri: item.senderProfileImage }} style={styles.messageAvatar} />
                )}
                <View style={messageStyle}>
                    <Text style={messageTextStyle}>{item.text}</Text>
                    <Text style={styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>
        );
    };

    if (loadingMessages) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando mensagens...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesListContent}
                    inverted={false}
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
        color: Colors.black,
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
        backgroundColor: Colors.inputBackground,
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