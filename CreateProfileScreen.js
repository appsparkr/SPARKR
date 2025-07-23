import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const CreateProfileScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();

    // --- ALTERAÇÃO 1: Importar a função 'signup' ---
    const { updateUserProfile, uploadImageToFirebase, signup } = useAuth();

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    // --- ALTERAÇÃO 2: Receber 'dateOfBirth' em vez de 'fullName' ---
    const { email, password, username: initialUsername, dateOfBirth } = route.params || {};

    useEffect(() => {
        // Verifica se os dados essenciais foram recebidos
        if (!email || !password || !dateOfBirth) {
            Alert.alert('Erro', 'Dados de registo ausentes. Por favor, tente novamente.');
            navigation.goBack();
        }
        // Preenche o nome de utilizador que veio do ecrã anterior
        if (initialUsername) {
            setUsername(initialUsername);
        }
    }, [email, password, dateOfBirth, initialUsername, navigation]);

    const requestImagePickerPermissions = async () => {
        setLoadingPermissions(true);
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'É necessário permitir o acesso à galeria para escolher uma foto.');
                return false;
            }
            return true;
        } catch (error) {
            console.error("Erro ao solicitar permissões de mídia:", error);
            Alert.alert('Erro', 'Não foi possível solicitar permissões da galeria.');
            return false;
        } finally {
            setLoadingPermissions(false);
        }
    };

    const pickImage = async () => {
        const hasPermission = await requestImagePickerPermissions();
        if (!hasPermission) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets?.length > 0) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erro ao selecionar imagem:', error);
            Alert.alert('Erro', 'Houve um problema ao selecionar a imagem.');
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    // --- ALTERAÇÃO 3: Lógica de criação de perfil corrigida ---
    const handleCreateProfile = async () => {
        if (!username.trim()) {
            Alert.alert('Erro', 'O nome de usuário é obrigatório.');
            return;
        }

        setUploading(true);
        try {
            // Passo 1: Chama a função signup para criar o utilizador e o documento inicial no Firestore
            const user = await signup(email, password, username.trim(), dateOfBirth);
            if (!user) {
                // Se o signup falhar (ex: email já existe), o erro é mostrado pelo AuthContext e a função para.
                throw new Error("A criação do utilizador falhou.");
            }

            // Passo 2: Faz o upload da imagem de perfil, se houver uma
            let profileImageUrl = null;
            if (profileImage) {
                try {
                    profileImageUrl = await uploadImageToFirebase(profileImage, `profile_images/${user.uid}.jpg`);
                } catch (error) {
                    console.error('Erro no upload da imagem:', error);
                    Alert.alert('Aviso', 'Falha ao fazer upload da foto. O perfil será salvo sem imagem.');
                }
            }

            // Passo 3: Prepara os dados finais do perfil para ATUALIZAR o documento
            const profileData = {
                username: username.trim(),
                bio: bio.trim(),
                userProfileImage: profileImageUrl,
                profileCompleted: true, // Marca o perfil como completo
            };

            // Passo 4: Atualiza o perfil do utilizador com os dados finais
            await updateUserProfile(user.uid, profileData);

            // Passo 5: Redireciona para a aplicação principal
            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
            });
        } catch (error) {
            console.error('Erro ao criar perfil e conta:', error);
            // O Alert de erro já é mostrado pela função signup, então não precisamos de outro aqui.
        } finally {
            setUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Finalizar Perfil</Text>
            <TouchableOpacity
                style={[styles.profileImagePicker]}
                onPress={pickImage}
                disabled={loadingPermissions || uploading}
            >
                {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.profileImage} />
                ) : (
                    <View style={styles.profileImagePlaceholder}>
                        {loadingPermissions ? (
                            <ActivityIndicator size="small" color={Colors.textSecondary} />
                        ) : (
                            <>
                                <Ionicons name="person-circle-outline" size={48} color={Colors.textSecondary} />
                                <Text style={styles.placeholderText}>Escolher Foto</Text>
                            </>
                        )}
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Nome de Usuário"
                    placeholderTextColor={Colors.textSecondary}
                    value={username}
                    onChangeText={setUsername}
                />
            </View>
            <View style={[styles.inputContainer, styles.bioInputContainer]}>
                <TextInput
                    style={[styles.input, styles.bioInput]}
                    placeholder="Bio (Opcional)"
                    placeholderTextColor={Colors.textSecondary}
                    value={bio}
                    onChangeText={setBio}
                    multiline
                    textAlignVertical="top"
                    numberOfLines={4}
                />
            </View>
            <TouchableOpacity
                style={[
                    styles.createButton,
                    {
                        backgroundColor: Colors.primary,
                        opacity: uploading || loadingPermissions || !username.trim() ? 0.7 : 1,
                    },
                ]}
                onPress={handleCreateProfile}
                disabled={uploading || loadingPermissions || !username.trim()}
            >
                <Text style={styles.createButtonText}>{uploading ? 'A criar...' : 'Finalizar Registo'}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        padding: 20,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 40, // Ajustado para melhor posicionamento
        left: 20,
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 60,
        marginBottom: 20,
    },
    profileImagePicker: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: Colors.lightGray,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    profileImagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 5,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    input: {
        backgroundColor: Colors.card,
        borderRadius: 8,
        padding: 15,
        color: Colors.text,
        width: '100%',
    },
    bioInputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    bioInput: {
        minHeight: 100,
        height: 'auto',
        paddingTop: 15,
        paddingBottom: 15,
    },
    createButton: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    createButtonText: {
        color: '#000', // Alterado para preto para melhor contraste
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default CreateProfileScreen;