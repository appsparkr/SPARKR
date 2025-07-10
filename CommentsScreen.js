// CommentsScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, // Importar SafeAreaView
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const CommentsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params;

  const { currentUser, addCommentToPost, getCommentsForPost, deleteCommentFromPost } = useAuth();

  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [postingComment, setPostingComment] = useState(false);

  const fetchComments = useCallback(async () => {
      setLoadingComments(true);
      try {
          console.log(`CommentsScreen: Buscando comentários para o post ${postId}.`);
          const fetchedComments = await getCommentsForPost(postId);
          // Inverter a ordem aqui para mostrar os mais recentes em baixo, se a busca retorna em ordem crescente
          setComments(fetchedComments.reverse()); 
          console.log(`CommentsScreen: Comentários carregados para o post ${postId}.`);
      } catch (error) {
          console.error('CommentsScreen: Erro ao buscar comentários:', error);
          Alert.alert('Erro', 'Não foi possível carregar os comentários. Tente novamente.');
      } finally {
          setLoadingComments(false);
      }
  }, [postId, getCommentsForPost]);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId, fetchComments]);

  const handleAddComment = async () => {
    if (!newCommentText.trim()) {
      Alert.alert('Aviso', 'O comentário não pode estar vazio.');
      return;
    }

    if (!currentUser || !currentUser.uid) {
      Alert.alert('Erro', 'Você precisa estar logado para comentar.');
      return;
    }

    setPostingComment(true);
    try {
      const addedComment = await addCommentToPost(postId, newCommentText);
      setComments(prevComments => [...prevComments, addedComment]); // Adiciona ao final
      setNewCommentText('');
      console.log('CommentsScreen: Comentário adicionado com sucesso e UI atualizada.');
    } catch (error) {
      console.error('CommentsScreen: Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o comentário. Tente novamente.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = useCallback(async (commentId) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja apagar este comentário?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Apagar",
          onPress: async () => {
            try {
              await deleteCommentFromPost(postId, commentId);
              setComments(prevComments => prevComments.filter(comment => comment.id !== commentId));
              console.log(`CommentsScreen: Comentário ${commentId} removido da UI.`);
            } catch (error) {
              console.error('CommentsScreen: Erro ao deletar comentário:', error);
            }
          },
          style: "destructive"
        }
      ],
      { cancelable: true }
    );
  }, [postId, deleteCommentFromPost]);

  const renderCommentItem = ({ item }) => {
    const isMyComment = currentUser && currentUser.uid === item.userId;

    return (
      <View style={styles.commentItem}>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileDetail', { userId: item.userId })}>
          <Image
            source={{ uri: item.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }}
            style={styles.commentUserImage}
          />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <Text style={styles.commentText}>
            <Text style={styles.commentUsername}>{String(item.username || 'Usuário Desconhecido')}</Text>{' '}
            {String(item.text || '')}
          </Text>
          <Text style={styles.commentTime}>
            {String(item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Data desconhecida')}
          </Text>
        </View>
        {isMyComment && (
          <TouchableOpacity onPress={() => handleDeleteComment(item.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    // SafeAreaView agora é o container principal
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.pop()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comentários</Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* KeyboardAvoidingView agora envolve a FlatList e a barra de input */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        // Ajuste o offset para iOS, Android geralmente não precisa de offset extra com 'height'
        // Usar 0 para Android e um valor que funcione para iOS (pode ser Constants.statusBarHeight ou um valor fixo se necessário)
        keyboardVerticalOffset={Platform.OS === 'ios' ? Constants.statusBarHeight : 0} 
      >
        {loadingComments ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Carregando comentários...</Text>
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.commentsList}
            ListEmptyComponent={
              <View style={styles.emptyCommentsContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyCommentsText}>Nenhum comentário ainda.</Text>
                <Text style={styles.emptyCommentsSubText}>Seja o primeiro a comentar!</Text>
              </View>
            }
          />
        )}

        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: currentUser?.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }}
            style={styles.currentUserImage}
          />
          <TextInput
            style={styles.commentInput}
            placeholder="Adicione um comentário..."
            placeholderTextColor={Colors.textSecondary}
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleAddComment}
            disabled={postingComment || newCommentText.trim() === ''}
          >
            {postingComment ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Ionicons name="send" size={24} color={Colors.background} />
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
    // paddingTop: Constants.statusBarHeight, // Removido daqui, pois o SafeAreaView principal já lida com isso
  },
  keyboardAvoidingContainer: { 
    flex: 1,
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
    // Adicionado paddingTop para respeitar a área segura superior diretamente no cabeçalho
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0, // Android precisa disso, iOS é tratado pelo SafeAreaView
  },
  backButton: {
    padding: 10,
    zIndex: 10, 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  commentUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
    marginRight: 10,
  },
  commentText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  commentUsername: {
    fontWeight: 'bold',
  },
  commentTime: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
    alignSelf: 'center',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
  },
  currentUserImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: Colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyCommentsText: {
    color: Colors.textSecondary,
    fontSize: 16,
    marginTop: 10,
  },
  emptyCommentsSubText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },
});

export default CommentsScreen;