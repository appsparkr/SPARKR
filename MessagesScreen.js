// MessagesScreen.js (Este arquivo está na raiz do projeto)
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext'; // Caminho para AuthContext (na raiz)
import Colors from './constants/Colors'; // Caminho para Colors (na pasta constants na raiz)

const MessagesScreen = () => {
    const navigation = useNavigation();
    const { currentUser, getChatsForUser } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchChats = useCallback(async () => {
        if (!currentUser || !currentUser.uid) {
            setLoading(false);
            setChats([]);
            return;
        }
        setLoading(true);
        try {
            console.log('MessagesScreen: Buscando chats...');
            const fetchedChats = await getChatsForUser();
            setChats(fetchedChats);
            console.log(`MessagesScreen: Chats carregados: ${fetchedChats.length}`);
            console.log("MessagesScreen: Estrutura dos chats carregados:", JSON.stringify(fetchedChats, null, 2)); 
        } catch (error) {
            console.error('MessagesScreen: Erro ao buscar chats:', error);
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

    // renderChatItem foi removido temporariamente para depuração

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando conversas...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mensagens</Text>
                <View style={{ width: 24 }} /> {/* Espaçador para alinhar o título */}
            </View>

            {/* ALTERADO: Removido FlatList, renderizando dados brutos */}
            <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ color: Colors.text, fontSize: 14 }}>
                    {/* Tenta renderizar o JSON dos chats. Se isso falhar, o problema é nos dados. */}
                    Chats Carregados (RAW): {JSON.stringify(chats, null, 2)}
                </Text>
                {chats.length === 0 && (
                    <View style={styles.emptyChatsContainer}>
                        <Ionicons name="chatbubbles-outline" size={60} color={Colors.textSecondary} />
                        <Text style={styles.emptyChatsText}>Nenhuma conversa ainda.</Text>
                        <Text style={styles.emptyChatsSubText}>Comece a seguir pessoas para enviar mensagens!</Text>
                    </View>
                )}
            </View>
            {/* FIM DA ALTERAÇÃO */}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    // Estilos de chatItem não serão usados nesta versão, mas mantidos
    chatItem: { 
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    chatUserImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
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