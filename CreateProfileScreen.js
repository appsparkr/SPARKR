import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';

const CreateProfileScreen = ({ navigation }) => {
  const { currentUser, updateUserProfile, uploadImageToFirebase } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null); // URI da imagem selecionada (local ou URL)
  const [uploading, setUploading] = useState(false); // Indica se está fazendo upload de imagem/atualizando perfil
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Indica se está verificando permissões da galeria

  console.log('CreateProfileScreen - Rendering...');
  console.log('CreateProfileScreen - currentUser:', currentUser ? { uid: currentUser.uid, profileData: currentUser.profileData } : 'null');

  // Efeito para pré-popular os campos se o usuário já tiver dados existentes
  useEffect(() => {
    if (currentUser && currentUser.profileData) { // Verifica se profileData existe
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

  // Função para solicitar permissões da galeria (necessário para o ImagePicker)
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
        console.log('pickImage - Imagem selecionada:', result.assets[0].uri);
      } else {
        console.log('pickImage - Seleção de imagem cancelada.');
      }
    } catch (error) {
      console.error('pickImage - Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Houve um problema ao selecionar a imagem.');
    }
  };

  // Função para voltar à tela anterior
  const handleGoBack = () => {
    // Esta tela geralmente é a primeira após o signup se o perfil não estiver completo.
    // O navigation.reset em handleCreateProfile já lida com a navegação principal.
    // O goBack aqui seria útil se o usuário pudesse chegar a esta tela de outro fluxo
    // onde o perfil já estava completo e ele está apenas editando, mas para o fluxo de "criar perfil",
    // ele pode não ser o mais intuitivo se o signup for o único caminho para cá.
    // Mantido por consistência, mas considere o fluxo exato do seu app.
    navigation.goBack();
  };

  // Função para criar ou atualizar o perfil do usuário
  const handleCreateProfile = async () => {
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
      // INÍCIO DA CORREÇÃO E MELHORIA AQUI
      // 1. Inicia com a URL da imagem de perfil atual do usuário (se existir)
      let profileImageUrl = currentUser?.profileData?.userProfileImage || null;

      // 2. Se uma NOVA imagem foi selecionada e é um URI local (não começa com 'http')
      if (profileImage && !profileImage.startsWith('http')) {
        try {
          console.log('handleCreateProfile - Iniciando upload da imagem para Firebase Storage');
          // Chama a função de upload do AuthContext para o URI local
          profileImageUrl = await uploadImageToFirebase(profileImage, `profile_images/${currentUser.uid}.jpg`);
          console.log('handleCreateProfile - URL da imagem após upload:', profileImageUrl);
        } catch (error) {
          console.error('handleCreateProfile - Erro ao fazer upload da imagem para Firebase Storage:', error);
          Alert.alert('Aviso', 'Falha ao fazer upload da foto. O perfil será salvo sem imagem (ou com a anterior, se houver).');
          // Se o upload falhar, profileImageUrl permanece com o valor anterior (ou null se não havia anterior)
        }
      } else if (profileImage === null && currentUser?.profileData?.userProfileImage) {
        // Se o usuário 'limpou' a imagem (definiu profileImage para null), então também limpa no Firestore
        // Isso só se aplica se houver uma imagem anterior.
        profileImageUrl = null;
      }
      // Se profileImage já é uma URL (e não foi alterada para uma nova local), profileImageUrl já estará correto do passo 1.
      // FIM DA CORREÇÃO E MELHORIA AQUI

      const profileData = {
        username: username.trim(),
        bio: bio.trim(),
        userProfileImage: profileImageUrl, // Salva a URL final da imagem (pode ser null)
        profileCompleted: true, // Marca o perfil como completo
      };

      console.log('handleCreateProfile - Atualizando perfil para UID:', currentUser.uid, 'com dados:', profileData);
      // Chama a função updateUserProfile do AuthContext com o UID do usuário
      await updateUserProfile(currentUser.uid, profileData);
      console.log('handleCreateProfile - Perfil atualizado com sucesso');

      // Redefine a pilha de navegação para ir para a tela principal (tabs)
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
      console.log('handleCreateProfile - Navegando para MainTabs');

    } catch (error) {
      console.error('handleCreateProfile - Erro ao criar perfil:', error);
      Alert.alert('Erro', 'Houve um problema ao criar o perfil: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.text} />
      </TouchableOpacity>
      <Text style={styles.title}>Criar Perfil</Text>
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
          { backgroundColor: Colors.primary, opacity: (uploading || loadingPermissions || !username.trim()) ? 0.7 : 1 }
        ]}
        onPress={uploading || loadingPermissions || !username.trim() ? null : handleCreateProfile}
        disabled={uploading || loadingPermissions || !username.trim()}
      >
        <Text style={styles.createButtonText}>
          {uploading ? 'Criando...' : 'Criar Perfil'}
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
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateProfileScreen;