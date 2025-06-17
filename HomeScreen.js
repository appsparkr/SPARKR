import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const HomeScreen = () => {
  const { getPosts, currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      // Carregar posts
      const postsData = await getPosts(false);
      setPosts(postsData);
      
      // Carregar stories
      const storiesData = await getPosts(true);
      setStories(storiesData);
    } catch (error) {
      console.error('HomeScreen - Erro ao carregar conteúdo:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity style={styles.storyItem}>
      <View style={styles.storyImageContainer}>
        <Image 
          source={{ uri: item.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }} 
          style={styles.storyImage} 
        />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  const renderPostItem = ({ item }) => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        <View style={styles.postUser}>
          <Image 
            source={{ uri: item.userProfileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }} 
            style={styles.postUserImage} 
          />
          <Text style={styles.postUsername}>{item.username}</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <Image 
        source={{ uri: item.imageUrl }} 
        style={styles.postImage} 
      />
      
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.postInfo}>
        <Text style={styles.postLikes}>{item.likes} curtidas</Text>
        <View style={styles.postCaption}>
          <Text style={styles.postUsername}>{item.username}</Text>
          <Text style={styles.captionText}>{item.caption}</Text>
        </View>
        {item.comments > 0 && (
          <TouchableOpacity>
            <Text style={styles.commentsText}>Ver todos os {item.comments} comentários</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.postTime}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={48} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>
        Nenhuma publicação disponível
      </Text>
      <Text style={styles.emptySubText}>
        Siga outros usuários para ver suas publicações aqui
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <FlatList
              data={stories}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesList}
              ListHeaderComponent={
                <TouchableOpacity style={styles.storyItem}>
                  <View style={[styles.storyImageContainer, styles.addStoryButton]}>
                    <Ionicons name="add" size={24} color={Colors.text} />
                  </View>
                  <Text style={styles.storyUsername}>Seu story</Text>
                </TouchableOpacity>
              }
            />
          </View>
        }
        ListEmptyComponent={!loading ? renderEmptyComponent : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  storiesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
  },
  storiesList: {
    paddingHorizontal: 10,
  },
  storyItem: {
    marginHorizontal: 8,
    alignItems: 'center',
    width: 70,
  },
  storyImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  addStoryButton: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.border,
  },
  storyImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  storyUsername: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  postContainer: {
    marginBottom: 15,
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
});

export default HomeScreen;
