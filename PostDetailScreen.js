// PostDetailScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, RefreshControl, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const PostDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { postId } = route.params;

    // Adicionado 'submitReport' ao useAuth
    const { getPostById, toggleLikePost, currentUser, deletePost, updatePostCaption, submitReport } = useAuth();

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showEditCaptionModal, setShowEditCaptionModal] = useState(false);
    const [editingCaption, setEditingCaption] = useState('');
    const [showReportModal, setShowReportModal] = useState(false); // NOVO: Estado para o modal de relatório
    const [reportReason, setReportReason] = useState(''); // NOVO: Estado para a razão do relatório
    const [reportDetails, setReportDetails] = useState(''); // NOVO: Estado para detalhes adicionais do relatório

    const reportReasons = [ // Opções de razão para o relatório
        'Spam',
        'Conteúdo Inapropriado',
        'Discurso de Ódio',
        'Assédio',
        'Nudez ou Atividade Sexual',
        'Violência ou Conteúdo Gráfico',
        'Informações Falsas',
        'Outro',
    ];

    const fetchPost = useCallback(async () => {
        setLoading(true);
        try {
            console.log(`PostDetailScreen: Buscando post com ID: ${postId}`);
            const fetchedPost = await getPostById(postId);
            if (fetchedPost) {
                setPost(fetchedPost);
                setEditingCaption(fetchedPost.caption || '');
                console.log("PostDetailScreen: Post carregado (dentro de fetchPost):", fetchedPost);
            } else {
                Alert.alert('Erro', 'Postagem não encontrada.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('PostDetailScreen: Erro ao buscar post:', error);
            Alert.alert('Erro', 'Não foi possível carregar a postagem. Tente novamente.');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [postId, getPostById, navigation]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPost();
        setRefreshing(false);
    }, [fetchPost]);

    const handleLikeToggle = async () => {
        if (!post) return;
        try {
            const newIsLiked = await toggleLikePost(post.id, post.likes || 0, post.isLiked);
            setPost(prevPost => ({
                ...prevPost,
                isLiked: newIsLiked,
                likes: newIsLiked ? (prevPost.likes || 0) + 1 : (prevPost.likes || 0) - 1,
            }));
        } catch (error) {
            console.error('PostDetailScreen: Erro ao alternar like:', error);
        }
    };

    const handleDeletePost = useCallback(() => {
        if (!post || !currentUser || post.userId !== currentUser.uid) {
            Alert.alert('Erro', 'Você não tem permissão para deletar esta postagem.');
            return;
        }

        Alert.alert(
            "Confirmar Exclusão",
            "Tem certeza que deseja apagar esta postagem? Esta ação não pode ser desfeita.",
            [
                {
                    text: "Cancelar",
                    style: "cancel",
                    onPress: () => setShowOptionsModal(false),
                },
                {
                    text: "Apagar",
                    style: "destructive",
                    onPress: async () => {
                        setShowOptionsModal(false);
                        try {
                            await deletePost(post.id, post.userId);
                            Alert.alert('Sucesso', 'Postagem apagada com sucesso!');
                            navigation.goBack();
                        } catch (error) {
                            console.error('PostDetailScreen: Erro ao deletar postagem:', error);
                            Alert.alert('Erro', 'Não foi possível apagar a postagem. Tente novamente.');
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    }, [post, currentUser, deletePost, navigation]);

    const handleEditCaption = useCallback(() => {
        setShowOptionsModal(false);
        setShowEditCaptionModal(true);
    }, []);

    const handleSaveCaption = useCallback(async () => {
        if (!post || !currentUser || post.userId !== currentUser.uid) {
            Alert.alert('Erro', 'Você não tem permissão para editar esta postagem.');
            return;
        }
        if (editingCaption === (post.caption || '')) {
            Alert.alert('Nenhuma alteração', 'A legenda não foi alterada.');
            setShowEditCaptionModal(false);
            return;
        }

        try {
            await updatePostCaption(post.id, editingCaption);
            setPost(prevPost => ({ ...prevPost, caption: editingCaption }));
            Alert.alert('Sucesso', 'Legenda atualizada com sucesso!');
            setShowEditCaptionModal(false);
        } catch (error) {
            console.error('PostDetailScreen: Erro ao salvar legenda:', error);
        }
    }, [post, currentUser, editingCaption, updatePostCaption]);

    const handleSharePost = useCallback(async () => {
        if (!post || !post.mediaUrl) {
            Alert.alert('Erro', 'Não foi possível compartilhar esta postagem (mídia ausente).');
            return;
        }
        setShowOptionsModal(false);

        try {
            const result = await Share.share({
                message: post.caption ? `${post.caption}\n\nConfira esta postagem no Sparkr!` : 'Confira esta postagem no Sparkr!',
                url: post.mediaUrl,
                title: 'Confira esta postagem no Sparkr!',
            }, {
                dialogTitle: 'Compartilhar Postagem',
                excludedActivityTypes: [],
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    console.log(`PostDetailScreen: Postagem compartilhada via ${result.activityType}`);
                } else {
                    console.log('PostDetailScreen: Postagem compartilhada com sucesso.');
                }
            } else if (result.action === Share.dismissedAction) {
                console.log('PostDetailScreen: Compartilhamento cancelado.');
            }
        } catch (error) {
            console.error('PostDetailScreen: Erro ao compartilhar postagem:', error.message);
            Alert.alert('Erro', 'Não foi possível compartilhar a postagem. Tente novamente.');
        }
    }, [post]);

    // NOVO: Função para iniciar o processo de relatório
    const handleReportPost = useCallback(() => {
        setShowOptionsModal(false); // Fecha o modal de opções
        setReportReason(''); // Reseta a razão
        setReportDetails(''); // Reseta os detalhes
        setShowReportModal(true); // Abre o modal de relatório
    }, []);

    // NOVO: Função para enviar o relatório
    const handleSubmitReport = useCallback(async () => {
        if (!reportReason) {
            Alert.alert('Erro', 'Por favor, selecione uma razão para o relatório.');
            return;
        }
        if (!post) {
            Alert.alert('Erro', 'Não foi possível reportar a postagem. Postagem não encontrada.');
            return;
        }

        try {
            await submitReport({
                reportedItemId: post.id,
                reportedItemType: 'post',
                reportReason: reportReason,
                additionalDetails: reportDetails,
                postOwnerId: post.userId,
            });
            Alert.alert('Relatório Enviado', 'Obrigado! Seu relatório foi enviado para revisão.');
            setShowReportModal(false); // Fecha o modal de relatório
        } catch (error) {
            console.error('PostDetailScreen: Erro ao enviar relatório:', error);
            // Alert.alert já é chamado em submitReport
        }
    }, [reportReason, reportDetails, post, submitReport]);


    const formatPostDate = (timestamp) => {
        let dateObject;

        if (timestamp && typeof timestamp.toDate === 'function') {
            dateObject = timestamp.toDate();
        } else if (timestamp) {
            try {
                if (typeof timestamp === 'object' && timestamp.seconds !== undefined && timestamp.nanoseconds !== undefined) {
                    dateObject = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
                } else {
                    dateObject = new Date(timestamp);
                }
            } catch (e) {
                console.error("PostDetailScreen: Erro ao criar objeto Date a partir de timestamp:", timestamp, e);
                return '';
            }
        } else {
            return '';
        }

        if (dateObject instanceof Date && !isNaN(dateObject)) {
            return dateObject.toLocaleDateString('pt-PT');
        }
        return '';
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Carregando postagem...</Text>
            </SafeAreaView>
        );
    }

    if (!post) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Postagem não disponível.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonEmpty}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const postUserImageUri = post.userProfileImage && String(post.userProfileImage).trim() !== ''
        ? String(post.userProfileImage)
        : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';

    const postMediaUri = post.imageUrl && String(post.imageUrl).trim() !== ''
        ? String(post.imageUrl)
        : (post.videoUrl && String(post.videoUrl).trim() !== '' ? String(post.videoUrl) : null);

    const isMyPost = currentUser && post.userId === currentUser.uid;

    console.log("DEBUG PostDetailScreen: isMyPost (antes do return):", isMyPost);
    console.log("DEBUG PostDetailScreen: currentUser?.uid (antes do return):", currentUser?.uid);
    console.log("DEBUG PostDetailScreen: post?.userId (antes do return):", post?.userId);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Postagem</Text>
                <TouchableOpacity 
                    onPress={() => {
                        console.log("PostDetailScreen: Botão de opções clicado!");
                        setShowOptionsModal(true);
                    }} 
                    style={styles.optionsButton}
                >
                    <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                <View style={styles.postContainer}>
                    <View style={styles.postHeader}>
                        <TouchableOpacity
                            style={styles.postUser}
                            onPress={() => navigation.navigate('ProfileDetail', { userId: String(post.userId) })}
                        >
                            <Image
                                source={{ uri: postUserImageUri }}
                                style={styles.postUserImage}
                            />
                            <Text style={styles.postUsername}>{String(post.username || 'Usuário Desconhecido')}</Text>
                        </TouchableOpacity>
                        <View style={{ width: 20 }} /> 
                    </View>

                    {postMediaUri ? (
                        <Image
                            source={{ uri: postMediaUri }}
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
                                <Ionicons
                                    name={post.isLiked ? "heart" : "heart-outline"}
                                    size={24}
                                    color={post.isLiked ? Colors.like : Colors.text}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('Comments', {
                                    postId: String(post.id),
                                    postUsername: String(post.username || 'Usuário Desconhecido'),
                                    postUserImage: String(post.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'),
                                })}
                            >
                                <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.actionButton} onPress={handleSharePost}>
                                <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity>
                            <Ionicons name="bookmark-outline" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.postInfo}>
                        <Text style={styles.postLikes}>{`${String(post.likes || 0)} curtidas`}</Text>
                        <View style={styles.postCaption}>
                            <Text style={styles.postUsername}>{String(post.username || 'Usuário Desconhecido')}</Text>
                            {String(post.caption || '').trim() !== '' && (
                                <Text style={styles.captionText}> {String(post.caption).trim()}</Text>
                            )}
                        </View>
                        {Number(post.comments || 0) > 0 && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Comments', {
                                    postId: String(post.id),
                                    postUsername: String(post.username || 'Usuário Desconhecido'),
                                    postUserImage: String(post.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'),
                                })}
                            >
                                <Text style={styles.commentsText}>
                                    Ver todos os {String(post.comments)} comentário{Number(post.comments || 0) > 1 ? 's' : ''}
                                </Text>
                            </TouchableOpacity>
                        )}
                        <Text style={styles.postTime}>
                            {String(formatPostDate(post.createdAt))}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Modal de Opções (Três Pontinhos) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showOptionsModal}
                onRequestClose={() => setShowOptionsModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowOptionsModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        {isMyPost && (
                            <>
                                <TouchableOpacity style={styles.modalOptionButton} onPress={handleEditCaption}>
                                    <Text style={styles.modalOptionText}>Editar Postagem</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.modalOptionButton} onPress={handleDeletePost}>
                                    <Text style={[styles.modalOptionTextDanger, { color: '#FF3B30' }]}>Apagar Postagem</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        <TouchableOpacity style={styles.modalOptionButton} onPress={handleSharePost}>
                            <Text style={styles.modalOptionText}>Compartilhar</Text>
                        </TouchableOpacity>
                        {/* NOVO: Opção para Reportar Postagem */}
                        <TouchableOpacity style={styles.modalOptionButton} onPress={handleReportPost}>
                            <Text style={[styles.modalOptionTextDanger, { color: Colors.textSecondary }]}>Reportar Postagem</Text> 
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalOptionButton, { borderBottomWidth: 0 }]}
                            onPress={() => setShowOptionsModal(false)}
                        >
                            <Text style={styles.modalOptionText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal para Edição da Legenda */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={showEditCaptionModal}
                onRequestClose={() => setShowEditCaptionModal(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowEditCaptionModal(false)}
                >
                    <View style={styles.editModalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.editModalTitle}>Editar Legenda</Text>
                        <TextInput
                            style={styles.captionInput}
                            multiline
                            placeholder="Escreva sua nova legenda..."
                            placeholderTextColor={Colors.textSecondary}
                            value={editingCaption}
                            onChangeText={setEditingCaption}
                            maxLength={2200}
                        />
                        <View style={styles.editModalButtons}>
                            <TouchableOpacity style={styles.editModalButton} onPress={() => setShowEditCaptionModal(false)}>
                                <Text style={styles.editModalButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.editModalButton, styles.editModalSaveButton]} onPress={handleSaveCaption}>
                                <Text style={styles.editModalSaveButtonText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* NOVO: Modal para Relatório de Postagem */}
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
        marginTop: 10,
        color: Colors.text,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    backButtonEmpty: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    backButtonText: {
        color: Colors.background,
        fontWeight: 'bold',
        fontSize: 16,
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
    optionsButton: {
        padding: 5,
    },
    scrollView: {
        flex: 1,
    },
    postContainer: {
        marginBottom: 15,
        backgroundColor: Colors.card,
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
        width: 32,
        height: 32,
        borderRadius: 16,
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
        flexWrap: 'wrap',
    },
    captionText: {
        fontSize: 14,
        color: Colors.text,
        marginLeft: 5,
        flexShrink: 1,
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
        minHeight: 100,
    },
    modalOptionButton: {
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
        alignItems: 'center',
    },
    modalOptionText: {
        fontSize: 18,
        color: Colors.text,
        fontWeight: '500',
    },
    modalOptionTextDanger: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    editModalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        minHeight: 200,
    },
    editModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 15,
        textAlign: 'center',
    },
    captionInput: {
        backgroundColor: Colors.background,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: Colors.text,
        fontSize: 16,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    editModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    editModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    editModalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    editModalSaveButton: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    editModalSaveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    // NOVOS ESTILOS PARA O MODAL DE RELATÓRIO
    reportModalContent: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 20,
        minHeight: 350, // Ajustado para acomodar mais conteúdo
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
        fontWeight: 'bold',
        color: Colors.text,
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
        backgroundColor: Colors.background,
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        color: Colors.text,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reportModalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    reportModalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    reportModalButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.text,
    },
    reportModalSubmitButton: {
        backgroundColor: Colors.red, // Um vermelho para a ação de reportar
        borderColor: Colors.red,
    },
    reportModalSubmitButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF', // Texto branco para contraste
    },
});

export default PostDetailScreen;