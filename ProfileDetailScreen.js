// ProfileDetailScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants'; // Certifique-se de que Constants está importado
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Adicionado Platform
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const ProfileDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { userId } = route.params;

    console.log('ProfileDetailScreen: userId from route.params (top of component):', userId);

    const {
        currentUser,
        getUserProfileById,
        getUserPosts,
        getUserHighlights,
        followUser,
        unfollowUser,
        checkIfFollowing,
        getFollowCounts,
        createOrGetChat,
    } = useAuth();

    const [activeTab, setActiveTab] = useState('posts');
    const [posts, setPosts] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [isTogglingFollow, setIsTogglingFollow] = useState(false);
    const [isStartingChat, setIsStartingChat] = useState(false);

    const isMyProfile = currentUser && currentUser.uid === userId;

    const loadProfileContent = useCallback(async () => {
        if (!userId) {
            console.warn('ProfileDetailScreen: userId não fornecido.');
            setIsLoading(false);
            return;
        }

        console.log(`ProfileDetailScreen: Iniciando carregamento de conteúdo para userId: ${userId}`);
        setIsLoading(true);
        try {
            const fetchedProfileData = await getUserProfileById(userId);
            setProfileData(fetchedProfileData);

            if (!fetchedProfileData) {
                Alert.alert("Erro", "Perfil de usuário não encontrado.");
                navigation.goBack();
                return;
            }

            const userPosts = await getUserPosts(userId);
            setPosts(userPosts || []);

            const userHighlights = await getUserHighlights(userId);
            setHighlights(userHighlights || []);

            const counts = await getFollowCounts(userId);
            setFollowersCount(counts.followers);
            setFollowingCount(counts.following);

            if (!isMyProfile) {
                const followingStatus = checkIfFollowing(userId);
                setIsFollowing(followingStatus);
            } else {
                setIsFollowing(false);
            }

        } catch (error) {
            console.error('ProfileDetailScreen - Erro ao carregar perfil e conteúdo do usuário:', error);
            Alert.alert('Erro', 'Não foi possível carregar o perfil. Tente novamente.');
            setProfileData(null);
            setPosts([]);
            setHighlights([]);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
            console.log('ProfileDetailScreen: Carregamento de conteúdo do usuário finalizado.');
        }
    }, [userId, isMyProfile, currentUser, getUserProfileById, getUserPosts, getUserHighlights, checkIfFollowing, getFollowCounts, navigation]);

    useFocusEffect(
        useCallback(() => {
            console.log('ProfileDetailScreen: useFocusEffect - Tela focada.');
            loadProfileContent();
            return () => {
                console.log('ProfileDetailScreen: useFocusEffect - Tela desfocada.');
            };
        }, [loadProfileContent])
    );

    const handleFollowToggle = async () => {
        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para seguir/deixar de seguir.');
            return;
        }

        setIsTogglingFollow(true);
        const previousIsFollowing = isFollowing;
        
        setIsFollowing(prev => !prev);
        setFollowersCount(prev => prev + (previousIsFollowing ? -1 : 1));

        try {
            console.log(`LOG Botão Seguir/Deixar de Seguir clicado para ${userId}`);
            if (previousIsFollowing) {
                await unfollowUser(userId);
            } else {
                await followUser(userId);
            }

            const updatedCounts = await getFollowCounts(userId);
            setFollowersCount(updatedCounts.followers);
            setFollowingCount(updatedCounts.following);

        } catch (error) {
            console.error("ProfileDetailScreen: Erro ao alternar seguir:", error);
            Alert.alert("Erro", "Não foi possível realizar a ação de seguir/deixar de seguir.");
            setIsFollowing(previousIsFollowing);
            const currentCounts = await getFollowCounts(userId);
            setFollowersCount(currentCounts.followers);
            setFollowingCount(currentCounts.following);
        } finally {
            setIsTogglingFollow(false);
        }
    };

    const handleMessage = useCallback(async () => {
        console.log('handleMessage: Função chamada.');
        console.log('handleMessage: Valor atual do estado profileData (dentro da closure):', profileData);
        console.log('handleMessage: Valor de userId (do route.params, dentro da closure):', userId);

        if (!currentUser || !currentUser.uid) {
            Alert.alert('Erro', 'Você precisa estar logado para enviar mensagens.');
            return;
        }
        
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.error('handleMessage: userId (da rota) ausente ou inválido.');
            Alert.alert('Erro', 'ID do usuário do destinatário não disponível.');
            return;
        }
        if (currentUser.uid === userId) {
            Alert.alert('Erro', 'Você não pode enviar mensagens para si mesmo através desta opção.');
            return;
        }

        setIsStartingChat(true);
        try {
            console.log(`ProfileDetailScreen: Tentando criar ou obter chat com ${userId}`);
            const chatId = await createOrGetChat(userId);
            console.log(`ProfileDetailScreen: Chat ID obtido/criado: ${chatId}`);

            if (chatId) {
                navigation.navigate('ChatScreen', { 
                    chatId: chatId,
                    otherUserId: userId,
                    otherUsername: profileData?.username || 'Usuário Desconhecido',
                    otherUserProfileImage: profileData?.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
                });
            } else {
                Alert.alert('Erro', 'Não foi possível iniciar o chat. ID do chat não retornado.');
            }
        } catch (error) {
            console.error('ProfileDetailScreen: Erro ao iniciar chat:', error);
            Alert.alert('Erro', 'Não foi possível iniciar o chat. Tente novamente.');
        } finally {
            setIsStartingChat(false);
        }
    }, [currentUser, userId, createOrGetChat, navigation, profileData]);


    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadProfileContent();
    }, [loadProfileContent]);

    const renderHighlightItem = ({ item }) => (
        <TouchableOpacity style={styles.highlightItem}>
            <View style={styles.highlightImageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.highlightImage} />
                ) : (
                    <View style={[styles.highlightImage, styles.noHighlightImage]}>
                        <Ionicons name="image-outline" size={24} color={Colors.textSecondary} />
                    </View>
                )}
            </View>
            <Text style={styles.highlightTitle} numberOfLines={1}>{item.title || 'Destaque'}</Text>
        </TouchableOpacity>
    );

    const renderPostItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.postItem} 
            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        >
            {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
            ) : (
                <View style={[styles.postImage, styles.noPostImage]}>
                    <Ionicons name="image-outline" size={30} color={Colors.textSecondary} />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderEmptyContent = () => (
        <View style={styles.emptyContentContainer}>
            <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>
                {activeTab === 'posts' ? 'Nenhuma publicação ainda.' : 'Nenhum vídeo ainda.'}
            </Text>
            {isMyProfile && activeTab === 'posts' && (
                <TouchableOpacity style={styles.uploadContentButton} onPress={() => navigation.navigate('AddContent')}>
                    <Text style={styles.uploadContentButtonText}>Adicionar primeira publicação</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando perfil...</Text>
            </SafeAreaView>
        );
    }

    if (!profileData) {
        return (
            <SafeAreaView style={[styles.container, styles.loadingContainer]}>
                <Text style={styles.emptyText}>Não foi possível carregar os dados do perfil.</Text>
                <TouchableOpacity style={styles.uploadContentButton} onPress={loadProfileContent}>
                    <Text style={styles.uploadContentButtonText}>Tentar Novamente</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const { username, bio, userProfileImage } = profileData;
    const displayUsername = typeof username === 'string' ? username : 'Usuário';
    const displayBio = typeof bio === 'string' ? bio : '';

    return (
        <SafeAreaView style={styles.container}>
            {/* Cabeçalho fixo no topo */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{displayUsername}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Opções', 'Abrir menu de opções do perfil')}>
                    <Ionicons name="ellipsis-vertical" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                ListHeaderComponent={
                    <>
                        <View style={styles.profileInfo}>
                            <View style={styles.profileImageContainer}>
                                {userProfileImage ? (
                                    <Image
                                        source={{ uri: userProfileImage }}
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <View style={[styles.profileImage, styles.noProfileImage]}>
                                        <Ionicons name="person" size={40} color={Colors.textSecondary} />
                                    </View>
                                )}
                            </View>

                            <View style={styles.statsContainer}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{posts.length}</Text>
                                    <Text style={styles.statLabel}>Publicações</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{followersCount}</Text>
                                    <Text style={styles.statLabel}>Seguidores</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statNumber}>{followingCount}</Text>
                                    <Text style={styles.statLabel}>Seguindo</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.bioContainer}>
                            <Text style={styles.username}>{displayUsername}</Text>
                            {displayBio !== '' && <Text style={styles.bio}>{displayBio}</Text>}
                        </View>

                        {/* Botões de Ação: Editar Perfil ou Seguir/Mensagem */}
                        {isMyProfile ? (
                            <TouchableOpacity style={styles.editProfileButton} onPress={() => Alert.alert('Funcionalidade', 'Redirecionar para tela de edição de perfil.')}>
                                <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.otherUserButtonsContainer}>
                                <TouchableOpacity
                                    style={[styles.followButton, isFollowing ? styles.followingButton : styles.notFollowingButton]}
                                    onPress={handleFollowToggle}
                                    disabled={isTogglingFollow || isLoading}
                                >
                                    {isTogglingFollow ? (
                                        <ActivityIndicator size="small" color={isFollowing ? Colors.text : Colors.background} />
                                    ) : (
                                        <Text style={isFollowing ? styles.followingButtonText : styles.notFollowingButtonText}>
                                            {isFollowing ? 'Seguindo' : 'Seguir'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.messageButton}
                                    onPress={handleMessage}
                                    disabled={isStartingChat || isLoading}
                                >
                                    {isStartingChat ? (
                                        <ActivityIndicator size="small" color={Colors.text} />
                                    ) : (
                                        <Text style={styles.messageButtonText}>Mensagem</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Destaques (Highlights) */}
                        {highlights.length > 0 && (
                            <View style={styles.highlightsContainer}>
                                <FlatList
                                    data={highlights}
                                    renderItem={renderHighlightItem}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.highlightsList}
                                    ListHeaderComponent={isMyProfile ? (
                                        <TouchableOpacity style={styles.highlightItem} onPress={() => Alert.alert('Funcionalidade', 'Adicionar novo destaque')}>
                                            <View style={[styles.highlightImageContainer, styles.addHighlightButton]}>
                                                <Ionicons name="add" size={24} color={Colors.text} />
                                            </View>
                                            <Text style={styles.highlightTitle}>Novo</Text>
                                        </TouchableOpacity>
                                    ) : null}
                                />
                            </View>
                        )}

                        {/* Abas de Conteúdo */}
                        <View style={styles.contentTabsContainer}>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'posts' && styles.activeTabButton]}
                                onPress={() => setActiveTab('posts')}
                            >
                                <Ionicons
                                    name="grid-outline"
                                    size={24}
                                    color={activeTab === 'posts' ? Colors.primary : Colors.textSecondary}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tabButton, activeTab === 'videos' && styles.activeTabButton]}
                                onPress={() => setActiveTab('videos')}
                            >
                                <Ionicons
                                    name="play-circle-outline"
                                    size={24}
                                    color={activeTab === 'videos' ? Colors.primary : Colors.textSecondary}
                                />
                            </TouchableOpacity>
                        </View>
                    </>
                }
                data={activeTab === 'posts' ? posts : []}
                renderItem={renderPostItem}
                keyExtractor={(item, index) => item.id || index.toString()}
                numColumns={3}
                contentContainerStyle={styles.postsGrid}
                ListEmptyComponent={renderEmptyContent()}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // Adicionado para Android
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: Colors.textSecondary,
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, 
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    profileInfo: {
        flexDirection: 'row',
        padding: 15,
    },
    profileImageContainer: {
        marginRight: 20,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    noProfileImage: {
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    bioContainer: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    username: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    bio: {
        fontSize: 14,
        color: Colors.text,
    },
    editProfileButton: {
        marginHorizontal: 15,
        marginBottom: 15,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    editProfileButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    otherUserButtonsContainer: {
        flexDirection: 'row',
        marginHorizontal: 15,
        marginBottom: 15,
    },
    followButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        borderRadius: 4,
        alignItems: 'center',
        marginRight: 8,
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
    followingButton: {
        flex: 1,
        backgroundColor: Colors.card,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        marginRight: 8,
    },
    followingButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    messageButton: {
        flex: 1,
        backgroundColor: Colors.card,
        paddingVertical: 8,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        marginLeft: 8,
    },
    messageButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.text,
    },
    highlightsContainer: {
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 10,
    },
    highlightsList: {
        paddingHorizontal: 10,
    },
    highlightItem: {
        marginHorizontal: 5,
        alignItems: 'center',
    },
    highlightImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    addHighlightButton: {
        backgroundColor: Colors.lightGray,
    },
    highlightImage: {
        width: '100%',
        height: '100%',
        borderRadius: 27,
    },
    noHighlightImage: {
        backgroundColor: Colors.card,
    },
    highlightTitle: {
        fontSize: 12,
        color: Colors.text,
        marginTop: 5,
        textAlign: 'center',
    },
    contentTabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        marginBottom: 1,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
    },
    activeTabButton: {
        borderBottomWidth: 2,
        borderBottomColor: Colors.primary,
    },
    contentContainer: {
        flex: 1,
    },
    postsGrid: {
        // Pode adicionar padding aqui se desejar um espaçamento geral para o grid
    },
    postItem: {
        width: '33.33%',
        aspectRatio: 1,
        padding: 1,
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    noPostImage: {
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContentContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 300,
    },
    emptyText: {
        marginTop: 10,
        color: Colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    uploadContentButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: Colors.primary,
        borderRadius: 5,
    },
    uploadContentButtonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 15,
    }
});

export default ProfileDetailScreen;