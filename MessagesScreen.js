// MessagesScreen.js (Etapa 8: Completa e Funcional)
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from './AuthContext'; // Caminho para AuthContext (na raiz)
import Colors from './constants/Colors'; // Caminho para Colors (na pasta constants na raiz)

const MessagesScreen = () => {
    const navigation = useNavigation();
    const { currentUser, getChatsForUser } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Configura o cabeçalho usando navigation.setOptions
    useEffect(() => {
        navigation.setOptions({
            headerShown: true, // Garante que o cabeçalho é visível
            title: 'Mensagens', // Título da tela
            headerStyle: { backgroundColor: Colors.background }, // Estilo do cabeçalho
            headerTintColor: Colors.text, // Cor do texto e ícones do cabeçalho
            headerTitleStyle: { fontWeight: 'bold' }, // Estilo do título
            headerBackTitleVisible: false, // Esconde o "Voltar" de texto no iOS
            headerLeft: () => ( // Botão de voltar personalizado
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 5 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
            ),
        });
    }, [navigation]); // Dependências: navigation

    const fetchChats = useCallback(async () => {
        if (!currentUser || !currentUser.uid) {
            setLoading(false);
            setChats([]);
            return;
        }
        setLoading(true);
        try {
            console.log('MessagesScreen (Etapa 8): Buscando chats...');
            const fetchedChats = await getChatsForUser();
            setChats(fetchedChats);
            console.log(`MessagesScreen (Etapa 8): Chats carregados: ${fetchedChats.length}`);
            console.log("MessagesScreen (Etapa 8): Estrutura dos chats carregados:", JSON.stringify(fetchedChats, null, 2));
        } catch (error) {
            console.error('MessagesScreen (Etapa 8): Erro ao buscar chats:', error);
            Alert.alert('Erro', 'Não foi possível carregar suas conversas. Verifique sua conexão ou tente novamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUser, getChatsForUser]);

    useFocusEffect(
        useCallback(() => {
            fetchChats();
            return () => {
                // Limpeza, se necessário
            };
        }, [fetchChats])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchChats();
    }, [fetchChats]);

    // Função para renderizar cada item do chat na FlatList
    const renderChatItem = ({ item }) => {
        const otherUser = item.otherParticipant;
        // Log para ver o item completo
        console.log("MessagesScreen: renderChatItem - Item:", item);

        // Se por algum motivo o otherParticipant não for carregado, não renderiza o item
        if (!otherUser) {
            console.warn("MessagesScreen: otherParticipant é nulo para o chat:", item.id);
            return null;
        }

        // Extrai e verifica as propriedades da última mensagem de forma mais defensiva
        // Usa String() para garantir que são strings, mesmo que sejam null/undefined
        const lastMessageText = String(item.lastMessage?.text || ''); // Garante que é uma string
        const lastMessageSenderId = item.lastMessage?.senderId;
        const lastMessageCreatedAt = item.lastMessage?.createdAt; // Já deve ser ISO string do AuthContext

        // Formatação defensiva do tempo
        let formattedTime = '';
        try {
            if (lastMessageCreatedAt) {
                const date = new Date(lastMessageCreatedAt);
                if (!isNaN(date.getTime())) { // Verifica se a data é válida
                    formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    console.warn("MessagesScreen: Data de createdAt inválida para formatação:", lastMessageCreatedAt);
                }
            }
        } catch (e) {
            console.error("MessagesScreen: Erro ao formatar lastMessageTime:", e, "Valor:", lastMessageCreatedAt);
            formattedTime = ''; // Define como vazio em caso de erro de formatação
        }

        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigation.navigate('ChatScreen', {
                    chatId: item.id,
                    otherUserId: otherUser.uid,
                    otherUsername: otherUser.username,
                    otherUserProfileImage: otherUser.userProfileImage,
                })}
            >
                {/* Imagem do perfil do outro usuário */}
                <Image
                    source={{ uri: String(otherUser.userProfileImage || 'https://placehold.co/100x100/CCCCCC/000000?text=User') }}
                    style={styles.chatUserImage}
                />
                
                <View style={styles.chatContent}>
                    {/* Nome de usuário do outro participante */}
                    <Text style={styles.chatUsername}>{String(otherUser.username || 'Usuário Desconhecido')}</Text>
                    
                    {/* Última mensagem (se existir) */}
                    {lastMessageText.length > 0 ? (
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {lastMessageSenderId === currentUser?.uid ? 'Você: ' : ''}
                            {lastMessageText}
                        </Text>
                    ) : (
                        <Text style={styles.lastMessage}>Nenhuma mensagem ainda.</Text>
                    )}
                </View>
                
                {/* Horário da última mensagem (se existir e for uma data válida) */}
                {formattedTime ? (
                    <Text style={styles.lastMessageTime}>
                        {formattedTime}
                    </Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando conversas...</Text>
            </SafeAreaView>
        );
    }

    return (
        // Removido o cabeçalho do JSX principal, ele é gerido pelo navigation.setOptions
        <SafeAreaView style={styles.container}>
            {chats.length === 0 ? (
                <View style={styles.emptyChatsContainer}>
                    <Ionicons name="chatbubbles-outline" size={60} color={Colors.textSecondary} />
                    <Text style={styles.emptyChatsText}>Nenhuma conversa ainda.</Text>
                    <Text style={styles.emptyChatsSubText}>Comece a seguir pessoas para enviar mensagens!</Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        // paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // Removido, pois o cabeçalho do navigator já lida com isso
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 10,
        color: Colors.text,
    },
    // Estilos do cabeçalho não são mais necessários aqui, pois são definidos em navigation.setOptions
    // header: { ... }
    // backButton: { ... }
    // headerTitle: { ... }
    messagesListContent: {
        paddingVertical: 10,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.card,
        marginHorizontal: 10,
        marginVertical: 5,
        borderRadius: 10,
    },
    chatUserImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    chatContent: {
        flex: 1,
    },
    chatUsername: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 2,
    },
    lastMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    lastMessageTime: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginLeft: 10,
    },
    emptyChatsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyChatsText: {
        color: Colors.textSecondary,
        fontSize: 16,
        marginTop: 10,
    },
    emptyChatsSubText: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
});

export default MessagesScreen;