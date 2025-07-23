import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Video } from 'expo-av';
import Constants from 'expo-constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Platform, RefreshControl, SafeAreaView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

// #####################################################################
// ## O COMPONENTE PostItem FOI MOVIDO PARA FORA DO HomeScreen ##
// ## ISTO É UMA OTIMIZAÇÃO DE PERFORMANCE IMPORTANTE ##
// #####################################################################
const PostItem = ({ post, onPostLikesUpdated, onOpenOptions, onShare }) => {
    const navigation = useNavigation();
    const { currentUser, toggleLikePost, checkIfPostIsLiked } = useAuth();
    const videoRef = useRef(null);
    const [isLiked, setIsLiked] = useState(() => checkIfPostIsLiked(post.id));
    const [currentLikesCount, setCurrentLikesCount] = useState(post.likes || 0);

    useEffect(() => {
        setIsLiked(checkIfPostIsLiked(post.id));
        setCurrentLikesCount(post.likes || 0);
    }, [post.id, post.likes, checkIfPostIsLiked]);

    const handleLikeToggle = async () => {
        if (!currentUser) return;
        const previousIsLiked = isLiked;
        // Atualização otimista da UI
        setIsLiked(prev => !prev);
        setCurrentLikesCount(prev => (previousIsLiked ? prev - 1 : prev + 1));
        try {
            await toggleLikePost(post.id, post.likes, previousIsLiked);
            const finalLikesCount = previousIsLiked ? (post.likes || 0) - 1 : (post.likes || 0) + 1;
            onPostLikesUpdated(post.id, finalLikesCount);
        } catch (error) {
            // Reverte a UI em caso de erro
            setIsLiked(previousIsLiked);
            setCurrentLikesCount(post.likes || 0);
            Alert.alert('Erro', 'Não foi possível atualizar a curtida.');
        }
    };

    const formatPostDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const dateObject = new Date(timestamp);
            if (isNaN(dateObject.getTime())) return '';
            return dateObject.toLocaleDateString('pt-PT');
        } catch (e) { return ''; }
    };

    return (
        <View style={styles.postContainer}>
            <View style={styles.postHeader}>
                <TouchableOpacity
                    style={styles.postUser}
                    onPress={() => navigation.navigate('ProfileDetail', { userId: post.userId })}
                >
                    <Image source={{ uri: post.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }} style={styles.postUserImage} />
                    <Text style={styles.postUsername}>{post.username || 'Usuário Desconhecido'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onOpenOptions(post)}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {post.mediaType === 'video' && post.videoUrl ? (
                <Video
                    ref={videoRef}
                    source={{ uri: post.videoUrl }}
                    style={styles.postImage}
                    resizeMode="cover"
                    isLooping
                    isMuted
                    shouldPlay
                />
            ) : post.mediaType === 'image' && post.imageUrl ? (
                <Image
                    source={{ uri: post.imageUrl }}
                    style={styles.postImage}
                />
            ) : (
                <View style={styles.noMediaPlaceholder}>
                    <Ionicons name="image-outline" size={80} color={Colors.textSecondary} />
                    <Text style={styles.noMediaText}>Conteúdo de mídia não disponível</Text>
                </View>
            )}

            <View style={styles.postActions}>
                <View style={styles.postActionsLeft}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLikeToggle}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? Colors.like : Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('Comments', { postId: post.id })}
                    >
                        <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={() => onShare(post)}>
                        <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity>
                    <Ionicons name="bookmark-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.postInfo}>
                <Text style={styles.postLikes}>{`${currentLikesCount} curtidas`}</Text>
                <View style={styles.postCaption}>
                    <Text style={styles.postUsername}>{post.username || 'Usuário Desconhecido'}</Text>
                    {post.caption ? <Text style={styles.captionText}> {post.caption}</Text> : null}
                </View>
                {post.comments > 0 && (
                    <TouchableOpacity onPress={() => navigation.navigate('Comments', { postId: post.id })}>
                        <Text style={styles.commentsText}>
                            Ver todos os {post.comments} comentário{post.comments > 1 ? 's' : ''}
                        </Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.postTime}>{formatPostDate(post.createdAt)}</Text>
            </View>
        </View>
    );
};

const HomeScreen = () => {
    const { getPosts, getStories, submitReport, currentUser, toggleLikePost, checkIfPostIsLiked, deletePost, blockUser } = useAuth();
    const navigation = useNavigation();
    const [posts, setPosts] = useState([]);
    const [stories, setStories] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
    const [selectedPostForOptions, setSelectedPostForOptions] = useState(null);

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    const hasLoadedInitialContent = useRef(false);

    const reportReasons = [
        'Spam', 'Conteúdo Inapropriado', 'Discurso de Ódio', 'Assédio',
        'Nudez ou Atividade Sexual', 'Violência ou Conteúdo Gráfico',
        'Informações Falsas', 'Outro',
    ];

    const loadContent = useCallback(async () => {
        console.log('HomeScreen: Iniciando loadContent...');
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno atraso para visualização do carregamento

            const postsData = await getPosts();
            console.log('HomeScreen: Posts data fetched:', postsData.length, 'posts');
            setPosts(postsData);

            const storiesData = await getStories();
            console.log('HomeScreen: Stories data fetched:', storiesData.length, 'stories');
            setStories(storiesData);
        } catch (error) {
            console.error('HomeScreen - Erro ao carregar conteúdo:', error);
        } finally {
            setLoading(false);
            console.log('HomeScreen: loadContent finalizado.');
        }
    }, [getPosts, getStories]);

    // ATENÇÃO: useFocusEffect alterado para NÃO recarregar todo o conteúdo a cada foco
    useFocusEffect(
        useCallback(() => {
            // Esta função só vai correr se o conteúdo ainda não tiver sido carregado
            if (!hasLoadedInitialContent.current) {
                const loadInitialContent = async () => {
                    console.log('HomeScreen: Carregando conteúdo inicial...');
                    setLoading(true); // Mostra o indicador de carregamento
                    try {
                        // Busca posts e stories em paralelo para mais rapidez
                        const [postsData, storiesData] = await Promise.all([
                            getPosts(),
                            getStories(),
                        ]);
                        setPosts(postsData);
                        setStories(storiesData);
                    } catch (error) {
                        console.error('HomeScreen - Erro ao carregar conteúdo:', error);
                        Alert.alert('Erro', 'Não foi possível carregar o feed.');
                    } finally {
                        setLoading(false); // Esconde o indicador de carregamento
                        hasLoadedInitialContent.current = true; // Marca como carregado
                        console.log('HomeScreen: Carregamento inicial finalizado.');
                    }
                };

                loadInitialContent();
            }
        }, []) // A dependência vazia [] garante que esta lógica de verificação só corre uma vez
    );

    // NOVA FUNÇÃO: Atualiza os likes de uma postagem específica no estado 'posts'
    const onPostLikesUpdated = useCallback((updatedPostId, newLikesCount) => {
        console.log(`HomeScreen: onPostLikesUpdated - Atualizando post ID ${updatedPostId} com ${newLikesCount} likes.`);
        setPosts(prevPosts =>
            prevPosts.map(post =>
                post.id === updatedPostId
                    ? { ...post, likes: newLikesCount }
                    : post
            )
        );
    }, []);

    const handleSharePost = useCallback(async (postToShare) => {
        if (!postToShare || !postToShare.mediaUrl) {
            Alert.alert('Erro', 'Não foi possível compartilhar esta postagem (mídia ausente).');
            return;
        }
        setShowPostOptionsModal(false);

        try {
            const result = await Share.share({
                message: postToShare.caption ? `${postToShare.caption}\n\nConfira esta postagem no Sparkr!` : 'Confira esta postagem no Sparkr!',
                url: postToShare.mediaUrl,
                title: 'Confira esta postagem no Sparkr!',
            }, {
                dialogTitle: 'Compartilhar Postagem',
                excludedActivityTypes: [],
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log(`HomeScreen: Postagem compartilhada via ${result.activityType}`);
                } else {
                    console.log('HomeScreen: Postagem compartilhada com sucesso.');
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('HomeScreen: Compartilhamento cancelado.');
            }
        } catch (error) {
            console.error('HomeScreen: Erro ao compartilhar postagem:', error.message);
            Alert.alert('Erro', 'Não foi possível compartilhar a postagem. Tente novamente.');
        }
    }, []);

    const openPostOptionsModal = useCallback((post) => {
        setSelectedPostForOptions(post);
        setShowPostOptionsModal(true);
    }, []);

    const handleReportPostFromOptions = useCallback(() => {
        setShowPostOptionsModal(false);
        setReportReason('');
        setReportDetails('');
        setShowReportModal(true);
    }, []);

    const handleSubmitReport = useCallback(async () => {
        if (!reportReason) {
            Alert.alert('Erro', 'Por favor, selecione uma razão para o relatório.');
            return;
        }
        if (!selectedPostForOptions) {
            Alert.alert('Erro', 'Não foi possível reportar a postagem. Postagem não encontrada.');
            return;
        }

        try {
            if (submitReport) {
                 await submitReport({
                     reportedItemId: selectedPostForOptions.id,
                     reportedItemType: 'post',
                     reportReason: reportReason,
                     additionalDetails: reportDetails,
                     postOwnerId: selectedPostForOptions.userId,
                 });
            } else {
                console.warn('HomeScreen: submitReport function not provided in AuthContext.');
            }

            Alert.alert('Relatório Enviado', 'Obrigado! Seu relatório foi enviado para revisão.');
            setShowReportModal(false);
        } catch (error) {
            console.error('HomeScreen: Erro ao enviar relatório:', error);
            Alert.alert('Erro', 'Não foi possível enviar o relatório. Tente novamente.');
        }
    }, [reportReason, reportDetails, selectedPostForOptions, submitReport]);

const onRefresh = useCallback(async () => {
        console.log('HomeScreen: Iniciando onRefresh...');
        setRefreshing(true);
        try {
            // A função onRefresh agora busca apenas os posts para ser mais rápida
            const postsData = await getPosts();
            setPosts(postsData);
        } catch (error) {
            console.error('HomeScreen - Erro no onRefresh:', error);
            Alert.alert('Erro', 'Não foi possível atualizar o feed.');
        } finally {
            setRefreshing(false);
            console.log('HomeScreen: onRefresh finalizado.');
        }
    }, [getPosts]); // A dependência agora é apenas getPosts


        const StoryItem = ({ story }) => {
        console.log('HomeScreen: Renderizando StoryItem para story ID:', story.id);
        console.log('HomeScreen: Story data para navegação:', {
            storyId: story.id,
            storyMediaUrl: story.mediaUrl,
            storyMediaType: story.mediaType,
            username: story.username,
            userProfileImage: story.userProfileImage
        });
        return (
            <TouchableOpacity
                style={styles.storyItem}
                onPress={() => navigation.push('StoryViewer', {
                    storyId: story.id,
                    storyMediaUrl: story.mediaUrl,
                    storyMediaType: story.mediaType,
                    username: story.username,
                    userProfileImage: story.userProfileImage
                })}
            >
                <View style={styles.storyImageBorder}>
                    <Image source={{ uri: story.userProfileImage || 'https://placehold.co/150x150/AAAAAA/000000?text=SP' }} style={styles.storyImage} />
                </View>
                <Text style={styles.storyUsername} numberOfLines={1}>{story.username || 'Usuário'}</Text>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando feed...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sparkr</Text>
                <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Messages')}>
                        <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={posts}
                // Passa a nova função onPostLikesUpdated como prop para cada PostItem
               renderItem={({ item }) => (
                    <PostItem
                        post={item}
                        onPostLikesUpdated={onPostLikesUpdated}
                        onOpenOptions={openPostOptionsModal}
                        onShare={handleSharePost}
                    />
                )}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <FlatList
                            data={stories}
                            renderItem={({ item }) => <StoryItem story={item} />}
                            keyExtractor={(item) => item.id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.storiesList}
                        />
                        <View style={styles.separator} />
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="image-outline" size={80} color={Colors.textSecondary} />
                        <Text style={styles.noMediaText}>Nenhuma postagem ainda.</Text>
                        <TouchableOpacity style={styles.uploadContentButton} onPress={() => navigation.navigate('AddContent')}>
                            <Text style={styles.uploadContentButtonText}>Adicionar primeira publicação</Text>
                        </TouchableOpacity>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={showPostOptionsModal}
                onRequestClose={() => setShowPostOptionsModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowPostOptionsModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        {/* Opções que só aparecem se for o dono do post */}
                        {selectedPostForOptions && selectedPostForOptions.userId === currentUser?.uid && (
                            <>
                                <TouchableOpacity
                                    style={styles.modalOptionButton}
                                    onPress={() => {
                                        setShowPostOptionsModal(false);
                                        navigation.navigate('PostDetail', { postId: selectedPostForOptions.id });
                                    }}
                                >
                                    <Text style={styles.modalOptionText}>Editar Postagem</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.modalOptionButton}
                                    onPress={() => {
                                        setShowPostOptionsModal(false);
                                        Alert.alert(
                                            'Confirmar Exclusão',
                                            'Tem certeza que deseja apagar esta postagem? Esta ação não pode ser desfeita.',
                                            [
                                                { text: 'Cancelar', style: 'cancel' },
                                                {
                                                    text: 'Apagar',
                                                    style: 'destructive',
                                                    onPress: async () => {
                                                        try {
                                                            await deletePost(selectedPostForOptions.id, selectedPostForOptions.userId);
                                                            Alert.alert('Sucesso', 'Postagem apagada com sucesso.');
                                                            onRefresh();
                                                        } catch (error) {
                                                            console.error('HomeScreen: Erro ao apagar postagem:', error);
                                                            Alert.alert('Erro', 'Não foi possível apagar a postagem.');
                                                        }
                                                    },
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Text style={[styles.modalOptionTextDanger, { color: '#FF3B30' }]}>Apagar Postagem</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Opção que só aparece se NÃO for o dono do post */}
                        {selectedPostForOptions && selectedPostForOptions.userId !== currentUser?.uid && (
                            <TouchableOpacity
                                style={styles.modalOptionButton}
                                onPress={() => {
                                    setShowPostOptionsModal(false);
                                    Alert.alert(
                                        'Bloquear Utilizador',
                                        `Tem a certeza que quer bloquear ${selectedPostForOptions.username}? Você não verá mais o perfil ou conteúdo desta pessoa.`,
                                        [
                                            { text: 'Cancelar', style: 'cancel' },
                                            {
                                                text: 'Bloquear',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await blockUser(selectedPostForOptions.userId);
                                                        onRefresh();
                                                    } catch (error) {
                                                        console.error("HomeScreen: Erro ao bloquear utilizador", error);
                                                        Alert.alert("Erro", "Não foi possível bloquear o utilizador.");
                                                    }
                                                },
                                            },
                                        ]
                                    );
                                }}
                            >
                                <Text style={[styles.modalOptionTextDanger, { color: '#FF3B30' }]}>Bloquear Utilizador</Text>
                            </TouchableOpacity>
                        )}
                        
                        {/* Opções que aparecem sempre */}
                        <TouchableOpacity style={styles.modalOptionButton} onPress={() => handleSharePost(selectedPostForOptions)}>
                            <Text style={styles.modalOptionText}>Compartilhar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.modalOptionButton} onPress={handleReportPostFromOptions}>
                            <Text style={[styles.modalOptionTextDanger, { color: Colors.textSecondary }]}>Reportar Postagem</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalOptionButton, { borderBottomWidth: 0 }]}
                            onPress={() => setShowPostOptionsModal(false)}
                        >
                            <Text style={styles.modalOptionText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <Modal
                animationType="slide"
                transparent={true}
                visible={showReportModal}
                onRequestClose={() => setShowReportModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReportModal(false)}
                >
                    <View style={styles.reportModalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.reportModalTitle}>Reportar Postagem</Text>

                        <Text style={styles.reportReasonLabel}>Razão do Relatório:</Text>
                        <View style={styles.reasonOptionsContainer}>
                            {reportReasons.map((reason, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.reasonOptionButton}
                                    onPress={() => setReportReason(reason)}
                                >
                                    <Ionicons
                                        name={reportReason === reason ? 'radio-button-on' : 'radio-button-off'}
                                        size={20}
                                        color={reportReason === reason ? Colors.primary : Colors.textSecondary}
                                        style={styles.radioIcon}
                                    />
                                    <Text style={styles.reasonOptionText}>{reason}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.reportReasonLabel}>Detalhes Adicionais (Opcional):</Text>
                        <TextInput
                            style={styles.reportDetailsInput}
                            multiline
                            placeholder="Forneça mais detalhes sobre o problema..."
                            placeholderTextColor={Colors.textSecondary}
                            value={reportDetails}
                            onChangeText={setReportDetails}
                            maxLength={500}
                        />

                        <View style={styles.reportModalButtons}>
                            <TouchableOpacity style={styles.reportModalButton} onPress={() => setShowReportModal(false)}>
                                <Text style={styles.reportModalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.reportModalButton, styles.reportModalSubmitButton]} onPress={handleSubmitReport}>
                                <Text style={styles.reportModalSubmitButtonText}>Enviar Relatório</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
        color: Colors.text,
        marginTop: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.background,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    headerIcons: {
        flexDirection: 'row',
    },
    iconButton: {
        marginLeft: 15,
    },
    storiesList: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    storyItem: {
        alignItems: 'center',
        marginHorizontal: 8,
    },
    storyImageBorder: {
        width: 68,
        height: 68,
        borderRadius: 34,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    storyImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    storyUsername: {
        fontSize: 12,
        color: Colors.text,
        maxWidth: 70,
        textAlign: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 5,
    },
    postContainer: {
        backgroundColor: Colors.card,
        marginBottom: 10,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postUser: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    postUserImage: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    postUsername: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    postImage: {
        width: '100%',
        aspectRatio: 1,
        resizeMode: 'cover',
    },
    noMediaPlaceholder: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMediaText: {
        color: Colors.textSecondary,
        marginTop: 10,
    },
    postActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    postActionsLeft: {
        flexDirection: 'row',
    },
    actionButton: {
        marginRight: 15,
    },
    postInfo: {
        paddingHorizontal: 15,
        paddingBottom: 10,
    },
    postLikes: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 5,
    },
    postCaption: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    captionText: {
        fontSize: 14,
        color: Colors.text,
        marginLeft: 5,
    },
    commentsText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 5,
    },
    postTime: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    modalOptionButton: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        width: '100%',
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 18,
        color: Colors.text,
    },
    modalOptionTextDanger: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    reportModalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    reportModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    reportReasonLabel: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 10,
        marginTop: 10,
    },
    reasonOptionsContainer: {
        marginBottom: 15,
    },
    reasonOptionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioIcon: {
        marginRight: 10,
    },
    reasonOptionText: {
        fontSize: 16,
        color: Colors.text,
    },
    reportDetailsInput: {
        minHeight: 80,
        backgroundColor: Colors.background,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 10,
        color: Colors.text,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    reportModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    reportModalButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportModalButtonText: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: 'bold',
    },
    reportModalSubmitButton: {
        backgroundColor: Colors.primary,
    },
    reportModalSubmitButtonText: {
        color: Colors.background,
        fontWeight: 'bold',
    },
});

export default HomeScreen;