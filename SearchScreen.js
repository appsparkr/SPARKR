import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const SearchScreen = () => {
  const { searchUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results);
      setSearched(true);
    } catch (error) {
      console.error('SearchScreen - Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity style={styles.userItem}>
      <Image 
        source={{ uri: item.profileImage || 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg' }} 
        style={styles.userImage} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.userBio} numberOfLines={1}>{item.bio}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <Text style={styles.followButtonText}>Seguir</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      {searched ? (
        <>
          <Ionicons name="search" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            Nenhum resultado encontrado para "{searchQuery}"
          </Text>
        </>
      ) : (
        <>
          <Ionicons name="search" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            Busque por usuários para seguir
          </Text>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar"
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.uid}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={searchResults.length === 0 ? { flex: 1 } : null}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    margin: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.text,
  },
  clearButton: {
    padding: 5,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  userBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;
