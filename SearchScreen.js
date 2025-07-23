// SearchScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const SearchScreen = () => {
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const { searchUsers, followUser, unfollowUser, checkIfFollowing, currentUser } = useAuth();

    // Busca automática com debounce
    useEffect(() => {
        const delay = setTimeout(() => {
            if (searchText.trim()) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(delay);
    }, [searchText]);

    const handleSearch = useCallback(async () => {
        if (searchText.trim() === '') {
            setSearchResults([]);
            return;
        }
        setLoading(true);
        try {
            const results = await searchUsers(searchText);
            setSearchResults(results);
            console.log("SearchScreen: Search results updated with follow status.");
        } catch (error) {
            console.error('SearchScreen: Erro ao buscar usuários:', error);
            Alert.alert('Erro', 'Não foi possível buscar usuários. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }, [searchText, searchUsers]);

    const handleToggleFollow = useCallback(async (userId) => {
        if (!currentUser) {
            Alert.alert('Erro', 'Você precisa estar logado para seguir/deixar de seguir.');
            return;
        }

        const isCurrentlyFollowing = checkIfFollowing(userId);
        console.log(`SearchScreen: handleToggleFollow - userId: ${userId}`);
        console.log(`SearchScreen: handleToggleFollow - isCurrentlyFollowing (from checkIfFollowing): ${isCurrentlyFollowing}`);

        try {
            let newFollowStatus;
            if (isCurrentlyFollowing) {
                console.log(`SearchScreen: Chamando unfollowUser para ${userId}`);
                await unfollowUser(userId);
                newFollowStatus = false;
            } else {
                console.log(`SearchScreen: Chamando followUser para ${userId}`);
                await followUser(userId);
                newFollowStatus = true;
            }

            setSearchResults(prevResults =>
                prevResults.map(user =>
                    user.uid === userId ? { ...user, isFollowing: newFollowStatus } : user
                )
            );
            console.log(`SearchScreen: UI atualizada para ${userId}. Novo status: ${newFollowStatus ? 'Seguindo' : 'Não Seguindo'}`);
        } catch (error) {
            console.error('SearchScreen: Erro ao alternar seguir:', error);
            Alert.alert('Erro', 'Não foi possível completar a ação. Tente novamente.');
        }
    }, [currentUser, followUser, unfollowUser, checkIfFollowing]);

    const renderUserItem = ({ item }) => {
        const userProfileImageUri = item.userProfileImage && item.userProfileImage.trim() !== ''
            ? item.userProfileImage
            : 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';

        const isCurrentUserProfile = currentUser && currentUser.uid === item.uid;
        const displayIsFollowing = !!item.isFollowing;

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => {
                    navigation.navigate('ProfileDetail', { userId: item.uid });
                }}
            >
                <Image source={{ uri: userProfileImageUri }} style={styles.userImage} />
                <View style={styles.userInfo}>
                    <Text style={styles.username}>{item.username}</Text>
                    {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
                </View>
                {!isCurrentUserProfile && (
                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            displayIsFollowing ? styles.followingButton : styles.notFollowingButton,
                        ]}
                        onPress={() => handleToggleFollow(item.uid)}
                    >
                        <Text style={displayIsFollowing ? styles.followingButtonText : styles.notFollowingButtonText}>
                            {displayIsFollowing ? 'Seguindo' : 'Seguir'}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhum usuário encontrado.</Text>
            <Text style={styles.emptySubText}>Tente pesquisar por um nome diferente.</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar usuários..."
                    placeholderTextColor={Colors.textSecondary}
                    value={searchText}
                    onChangeText={setSearchText}
                    returnKeyType="search"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Buscando usuários...</Text>
                </View>
            ) : (
                <FlatList
                    data={searchResults}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.uid}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={searchText.length > 0 ? renderEmptyComponent : null}
                    contentContainerStyle={searchResults.length === 0 && searchText.length > 0 ? styles.emptyListContainer : null}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Constants.statusBarHeight,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 10,
        marginHorizontal: 15,
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: 16,
        paddingVertical: 8,
    },
    clearButton: {
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
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.border,
    },
    userImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    bio: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    followButton: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    followingButton: {
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    notFollowingButton: {
        backgroundColor: Colors.primary,
    },
    followingButtonText: {
        color: Colors.text,
        fontWeight: 'bold',
    },
    notFollowingButtonText: {
        color: Colors.background,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 50,
    },
    emptyText: {
        color: Colors.textSecondary,
        fontSize: 16,
        marginTop: 10,
    },
    emptySubText: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 5,
    },
    emptyListContainer: {
        flexGrow: 1,
        justifyContent: 'center',
    },
});

export default SearchScreen;