// EditProfileScreen.js
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext'; // Importe o AuthContext
import Colors from './constants/Colors'; // Assumindo que Colors está no mesmo nível ou acessível

const EditProfileScreen = ({ navigation }) => {
  // Desestruturando currentUser, updateUserProfile e uploadImageToFirebase de useAuth
  const { currentUser, updateUserProfile, uploadImageToFirebase, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null); // URI da imagem selecionada (local ou URL)
  const [uploading, setUploading] = useState(false); // Indica se está fazendo upload de imagem/atualizando perfil
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Indica se está verificando permissões da galeria

  useEffect(() => {
    // Pré-popula os campos com os dados do perfil do usuário logado
    if (currentUser && currentUser.profileData) {
      if (currentUser.profileData.username) {
        setUsername(currentUser.profileData.username);
      }
      if (currentUser.profileData.bio) {
        setBio(currentUser.profileData.bio);
      }
      if (currentUser.profileData.userProfileImage) {
        setProfileImage(currentUser.profileData.userProfileImage);
      }
    }
  }, [currentUser]);

  // Função para solicitar permissões da galeria
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

  // Função para abrir a galeria e permitir a seleção de uma imagem
  const pickImage = async () => {
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      } else {
        console.log('Seleção de imagem cancelada.');
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Houve um problema ao selecionar a imagem.');
    }
  };

  // Função para remover a imagem de perfil
  const removeImage = () => {
    Alert.alert(
      "Remover Foto",
      "Tem certeza que deseja remover sua foto de perfil?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Remover",
          onPress: () => setProfileImage(null) // Define a imagem como null
        }
      ]
    );
  };

  // Função para atualizar o perfil do usuário
  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Erro', 'O nome de usuário é obrigatório.');
      return;
    }

    if (!currentUser || !currentUser.uid) {
      Alert.alert('Erro', 'Usuário não autenticado.');
      return;
    }

    setUploading(true);
    try {
      // 1. Começa com a URL da imagem de perfil atual do usuário (se existir)
      let finalProfileImageUrl = currentUser?.profileData?.userProfileImage || null;

      // 2. Se uma NOVA imagem foi selecionada e é um URI local (não começa com 'http')
      if (profileImage && !profileImage.startsWith('http')) {
        try {
          console.log('EditProfileScreen - Iniciando upload da imagem para Firebase Storage');
          finalProfileImageUrl = await uploadImageToFirebase(profileImage, `profile_images/${currentUser.uid}.jpg`);
          console.log('EditProfileScreen - URL da imagem após upload:', finalProfileImageUrl);
        } catch (error) {
          console.error('EditProfileScreen - Erro ao fazer upload da imagem para Firebase Storage:', error);
          Alert.alert('Aviso', 'Falha ao fazer upload da foto. O perfil será salvo sem imagem (ou com a anterior, se houver).');
          // Se o upload falhar, finalProfileImageUrl permanece com o valor anterior (ou null se não havia anterior)
        }
      } else if (profileImage === null) {
        // Se o usuário explicitamente removeu a imagem (profileImage agora é null)
        finalProfileImageUrl = null;
      }
      // Se profileImage já é uma URL (e não foi alterada para uma nova local), finalProfileImageUrl já estará correto do passo 1.

      const updatedData = {
        username: username.trim(),
        bio: bio.trim(),
        userProfileImage: finalProfileImageUrl, // Salva a URL final da imagem (pode ser null)
        // profileCompleted não é alterado aqui, pois esta tela é para edição
      };

      console.log('EditProfileScreen - Atualizando perfil para UID:', currentUser.uid, 'com dados:', updatedData);
      await updateUserProfile(currentUser.uid, updatedData);
      console.log('EditProfileScreen - Perfil atualizado com sucesso');

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      navigation.goBack(); // Volta para a tela de perfil após a atualização
    } catch (error) {
      console.error('EditProfileScreen - Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Houve um problema ao atualizar o perfil: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Editar Perfil</Text>

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
              <Ionicons name="person-circle-outline" size={48} color={Colors.textSecondary} />
            )}
            <Text style={styles.placeholderText}>
              {loadingPermissions ? 'Verificando permissões...' : 'Escolher Foto'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {profileImage && ( // Mostra o botão "Remover Foto" apenas se houver uma foto
        <TouchableOpacity onPress={removeImage} style={styles.removeImageButton}>
          <Text style={styles.removeImageText}>Remover Foto</Text>
        </TouchableOpacity>
      )}

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
          styles.updateButton,
          { backgroundColor: Colors.primary, opacity: (uploading || loadingPermissions || !username.trim()) ? 0.7 : 1 }
        ]}
        onPress={uploading || loadingPermissions || !username.trim() ? null : handleUpdateProfile}
        disabled={uploading || loadingPermissions || !username.trim()}
      >
        <Text style={styles.updateButtonText}>
          {uploading ? 'Atualizando...' : 'Atualizar Perfil'}
        </Text>
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
    top: 20,
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
    marginBottom: 10, // Ajustado para dar espaço ao botão "Remover Foto"
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
  removeImageButton: {
    marginBottom: 20,
  },
  removeImageText: {
    color: Colors.error, // Uma cor para indicar ação de remoção
    fontSize: 14,
    fontWeight: 'bold',
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
  updateButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default EditProfileScreen;