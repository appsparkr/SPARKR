import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation, route }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Usar o usuário da rota se disponível, caso contrário usar o usuário atual
  const profileUser = route?.params?.user || currentUser || profileData;

  useEffect(() => {
    // Carregar dados do perfil do armazenamento local
    const loadProfileData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          console.log('ProfileScreen - Dados do usuário carregados do armazenamento local:', userData);
          setProfileData(userData);
        }
      } catch (error) {
        console.error('ProfileScreen - Erro ao carregar dados do perfil:', error);
      }
    };

    if (!currentUser && !route?.params?.user) {
      loadProfileData();
    }

    // Carregar posts e destaques do usuário
    const loadUserContent = async () => {
      setIsLoading(true);
      try {
        // Em um app real, buscaríamos os posts do Firebase
        // Aqui usamos dados de exemplo para demonstração
        const demoHighlights = [
          { id: '1', title: 'Viagens', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=200' },
          { id: '2', title: 'Comida', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200' },
          { id: '3', title: 'Amigos', image: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=200' },
        ];

        const demoPosts = [
          { id: '1', image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=400' },
          { id: '2', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
          { id: '3', image: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=400' },
          { id: '4', image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400' },
          { id: '5', image: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=400' },
          { id: '6', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400' },
        ];

        setHighlights(demoHighlights);
        setPosts(demoPosts);
      } catch (error) {
        console.error('Erro ao carregar conteúdo do usuário:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserContent();
  }, [currentUser, route?.params?.user]);

  const handleEditProfile = () => {
    // Navegar para a tela de edição de perfil, que está no mesmo Stack Navigator aninhado
    navigation.navigate('EditProfile'); // <--- CORRIGIDO AQUI
  };

  const renderHighlightItem = ({ item }) => (
    <TouchableOpacity style={styles.highlightItem}>
      <View style={styles.highlightImageContainer}>
        <Image source={{ uri: item.image }} style={styles.highlightImage} />
      </View>
      <Text style={styles.highlightTitle}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.image }} style={styles.postImage} />
    </TouchableOpacity>
  );

  const renderEmptyContent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>
        {activeTab === 'posts' ? 'Nenhuma publicação ainda' : 'Nenhum vídeo ainda'}
      </Text>
    </View>
  );

  // Verificar se temos dados de perfil para exibir
  if (!profileUser) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>Carregando perfil...</Text>
      </View>
    );
  }

  console.log('ProfileScreen - Renderizando com dados de perfil:', profileUser);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{profileUser?.username || 'Perfil'}</Text>
        {/* O ícone de configurações deve navegar para EditProfile se for o perfil do usuário logado */}
        {profileUser?.uid === currentUser?.uid && (
          <TouchableOpacity onPress={handleEditProfile}>
            <Ionicons name="settings-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileInfo}>
          <View style={styles.profileImageContainer}>
            {profileUser?.profileImage ? (
              <Image
                source={{ uri: profileUser.profileImage }}
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
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Seguidores</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Seguindo</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioContainer}>
          <Text style={styles.username}>{profileUser?.username || 'Usuário'}</Text>
          <Text style={styles.bio}>{profileUser?.bio || 'Sem biografia'}</Text>
        </View>

        {/* O botão "Editar Perfil" também deve navegar para EditProfile */}
        {profileUser?.uid === currentUser?.uid && (
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <Text style={styles.editProfileButtonText}>Editar Perfil</Text>
          </TouchableOpacity>
        )}

        <View style={styles.highlightsContainer}>
          <FlatList
            data={highlights}
            renderItem={renderHighlightItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsList}
            ListHeaderComponent={
              <TouchableOpacity style={styles.highlightItem}>
                <View style={[styles.highlightImageContainer, styles.addHighlightButton]}>
                  <Ionicons name="add" size={24} color={Colors.text} />
                </View>
                <Text style={styles.highlightTitle}>Novo</Text>
              </TouchableOpacity>
            }
          />
        </View>

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

        <View style={styles.contentContainer}>
          {activeTab === 'posts' && posts.length > 0 ? (
            <FlatList
              data={posts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
            />
          ) : activeTab === 'videos' ? (
            renderEmptyContent()
          ) : (
            renderEmptyContent()
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  highlightsContainer: {
    marginBottom: 15,
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
  },
  addHighlightButton: {
    backgroundColor: Colors.lightGray,
  },
  highlightImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
  postItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
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
});

export default ProfileScreen;