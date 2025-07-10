// ProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const ProfileScreen = ({ navigation }) => {
  const route = useRoute();
  const { userId: routeUserId } = route.params || {};

  const {
    currentUser,
    getUserPosts,
    getUserHighlights,
    getUserProfileById,
    followUser,
    unfollowUser,
    checkIfFollowing,
    getFollowCounts,
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

  const displayUserId = routeUserId || currentUser?.uid;
  const isMyProfile = currentUser && currentUser.uid === displayUserId;

  const loadProfileContent = useCallback(async () => {
    if (!displayUserId) {
      console.warn('ProfileScreen: displayUserId não fornecido.');
      setIsLoading(false);
      return;
    }

    console.log(`ProfileScreen: Iniciando carregamento de conteúdo para userId: ${displayUserId}`);
    setIsLoading(true);
    try {
      const fetchedProfileData = await getUserProfileById(displayUserId);
      setProfileData(fetchedProfileData);

      const userPosts = await getUserPosts(displayUserId);
      setPosts(userPosts || []);

      const userHighlights = await getUserHighlights(displayUserId);
      setHighlights(userHighlights || []);

      const counts = await getFollowCounts(displayUserId);
      setFollowersCount(counts.followers);
      setFollowingCount(counts.following);

      if (!isMyProfile) {
        const followingStatus = await checkIfFollowing(displayUserId);
        setIsFollowing(followingStatus);
      } else {
        setIsFollowing(false);
      }

    } catch (error) {
      console.error('ProfileScreen - Erro ao carregar perfil e conteúdo do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar o perfil. Tente novamente.');
      setProfileData(null);
      setPosts([]);
      setHighlights([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      console.log('ProfileScreen: Carregamento de conteúdo do usuário finalizado.');
    }
  }, [displayUserId, isMyProfile, getUserProfileById, getUserPosts, getUserHighlights, checkIfFollowing, getFollowCounts]);


  useFocusEffect(
    useCallback(() => {
      console.log('ProfileScreen: useFocusEffect - Tela focada.');
      loadProfileContent();
      return () => {
        console.log('ProfileScreen: useFocusEffect - Tela desfocada.');
      };
    }, [loadProfileContent])
  );

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleFollowToggle = async () => {
    if (!currentUser || !currentUser.uid) {
      Alert.alert('Erro', 'Você precisa estar logado para seguir/deixar de seguir.');
      return;
    }
    try {
      if (isFollowing) {
        await unfollowUser(displayUserId);
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        await followUser(displayUserId);
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("ProfileScreen: Erro ao alternar seguir:", error);
      Alert.alert("Erro", "Não foi possível realizar a ação de seguir/deixar de seguir.");
    }
  };

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
    <TouchableOpacity style={styles.postItem} onPress={() => navigation.navigate('PostDetail', { postId: item.id })}>
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
      {/* Certifique-se de que não há texto solto aqui, apenas componentes React */}
      {isMyProfile && activeTab === 'posts' && (
          <TouchableOpacity style={styles.uploadContentButton} onPress={() => navigation.navigate('Add')}>
            <Text style={styles.uploadContentButtonText}>Adicionar primeira publicação</Text>
          </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando perfil...</Text>
      </View>
    );
  }

  if (!profileData) {
      return (
          <View style={[styles.container, styles.loadingContainer]}>
              <Text style={styles.emptyText}>Não foi possível carregar os dados do perfil.</Text>
              <TouchableOpacity style={styles.uploadContentButton} onPress={loadProfileContent}>
                 <Text style={styles.uploadContentButtonText}>Tentar Novamente</Text>
              </TouchableOpacity>
          </View>
      );
  }

  const { username, bio, userProfileImage } = profileData;
  const displayUsername = typeof username === 'string' ? username : 'Usuário';
  const displayBio = typeof bio === 'string' ? bio : '';

  return (
    // SafeAreaView agora lida apenas com as áreas seguras, o padding superior é do Stack Navigator
    <SafeAreaView style={styles.container}> 
      <FlatList
        ListHeaderComponent={
          <>
            {/* O cabeçalho com o nome do usuário e ícone de configurações será renderizado pelo ProfileStackNavigator */}
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
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
                <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.otherUserButtonsContainer}>
                <TouchableOpacity
                  style={isFollowing ? styles.followingButton : styles.followButton}
                  onPress={handleFollowToggle}
                >
                  <Text style={isFollowing ? styles.followingButtonText : styles.followButtonText}>
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.messageButton}>
                  <Text style={styles.messageButtonText}>Mensagem</Text>
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
  container: { // Este é o container principal da tela, que agora é a SafeAreaView
    flex: 1,
    backgroundColor: Colors.background,
    // Removido paddingTop aqui, pois o Stack Navigator adiciona o cabeçalho
  },
  // Removido styles.header, styles.headerTitle, styles.safeAreaContainer, pois o Stack Navigator gerencia
  scrollViewContent: {
    paddingTop: 0,
    paddingBottom: 20,
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

export default ProfileScreen;