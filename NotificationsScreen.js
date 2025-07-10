// NotificationsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const NotificationsScreen = () => {
    const { getNotifications, markNotificationAsRead, currentUser } = useAuth();
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser) {
            setLoading(false);
            setNotifications([]);
            return;
        }
        setLoading(true);
        try {
            const fetched = await getNotifications();
            setNotifications(fetched);
        } catch (error) {
            console.error('NotificationsScreen: Erro ao buscar notificações:', error);
            Alert.alert('Erro', 'Não foi possível carregar as notificações.');
        } finally {
            setLoading(false);
        }
    }, [getNotifications, currentUser]);

    useFocusEffect(
        useCallback(() => {
            fetchNotifications();
            return () => {};
        }, [fetchNotifications])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, [fetchNotifications]);

    const handleNotificationPress = async (notification) => {
        if (!notification.read) {
            await markNotificationAsRead(notification.id);
            setNotifications(prevNotifications =>
                prevNotifications.map(n =>
                    n.id === notification.id ? { ...n, read: true } : n
                )
            );
        }

        if (notification.type === 'like' || notification.type === 'comment' || notification.type === 'follow') {
            navigation.navigate('ProfileDetail', { userId: notification.sourceUserId });
        } else if (notification.type === 'chat_message') { // NOVO: Navegação para DM
            navigation.navigate('ChatScreen', {
                chatId: notification.chatId,
                otherUserId: notification.sourceUserId, // O remetente da DM é o "outro usuário"
                otherUsername: notification.sourceUsername,
                otherUserProfileImage: notification.sourceUserProfileImage,
            });
        }
    };

    const renderNotificationItem = ({ item }) => {
        let notificationText = '';
        let iconName = 'notifications'; // Ícone padrão
        let iconColor = Colors.textSecondary;

        switch (item.type) {
            case 'like':
                notificationText = `curtiu sua publicação.`;
                iconName = 'heart';
                iconColor = Colors.like;
                break;
            case 'comment':
                notificationText = `comentou: "${item.commentText}" em sua publicação.`;
                iconName = 'chatbubble';
                iconColor = Colors.primary;
                break;
            case 'follow':
                notificationText = `começou a seguir você.`;
                iconName = 'person-add';
                iconColor = Colors.primary;
                break;
            case 'chat_message': // NOVO TIPO DE NOTIFICAÇÃO
                notificationText = `enviou uma mensagem: "${item.messageText ? item.messageText.substring(0, 50) : ''}${item.messageText && item.messageText.length > 50 ? '...' : ''}"`; // Snippet da mensagem
                iconName = 'chatbox'; // Ícone de mensagem
                iconColor = Colors.accent; // Uma cor diferente para DMs
                break;
            default:
                notificationText = 'Nova notificação.';
                break;
        }

        const notificationStyle = item.read ? styles.notificationItemRead : styles.notificationItemUnread;

        return (
            <TouchableOpacity
                style={notificationStyle}
                onPress={() => handleNotificationPress(item)}
            >
                <Image
                    source={{ uri: item.sourceUserProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }}
                    style={styles.notificationUserImage}
                />
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationText}>
                        <Text style={styles.notificationUsername}>{item.sourceUsername || 'Usuário Desconhecido'}</Text> {notificationText}
                    </Text>
                    <Text style={styles.notificationTime}>{item.createdAt}</Text>
                </View>
                <Ionicons name={iconName} size={20} color={iconColor} style={styles.notificationIcon} />
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>
                Nenhuma notificação por enquanto.
            </Text>
            <Text style={styles.emptySubText}>
                Volte mais tarde para ver as novidades!
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeAreaContainer}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notificações</Text>
            </View>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Carregando notificações...</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyComponent}
                    contentContainerStyle={notifications.length === 0 ? styles.emptyListContent : null}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeAreaContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    },
    header: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    notificationItemUnread: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.card,
    },
    notificationItemRead: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
        opacity: 0.7,
    },
    notificationUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    notificationContent: {
        flex: 1,
    },
    notificationText: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    notificationUsername: {
        fontWeight: 'bold',
    },
    notificationTime: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    notificationIcon: {
        marginLeft: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: Colors.text,
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        height: 300,
    },
    emptyText: {
        marginTop: 10,
        color: Colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    emptySubText: {
        marginTop: 5,
        color: Colors.textSecondary,
        fontSize: 14,
        textAlign: 'center',
    },
    emptyListContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});

export default NotificationsScreen;