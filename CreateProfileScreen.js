import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from './AuthContext';
import { uploadImage } from './cloudinaryConfig'; // Certifique-se de que 'cloudinaryConfig' está correto
import Colors from './constants/Colors'; // Certifique-se de que este arquivo existe e exporta Colors

const CreateProfileScreen = ({ navigation }) => {
  // Desestruturando currentUser e updateUserProfile de useAuth
  const { currentUser, updateUserProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null); // URI da imagem selecionada (local ou URL)
  const [uploading, setUploading] = useState(false); // Indica se está fazendo upload de imagem/atualizando perfil
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Indica se está verificando permissões da galeria

  console.log('CreateProfileScreen - Rendering...');
  console.log('CreateProfileScreen - currentUser:', currentUser);

  // Efeito para pré-popular os campos se o usuário já tiver dados existentes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.username) {
        setUsername(currentUser.username);
      }
      if (currentUser.bio) {
        setBio(currentUser.bio);
      }
      // Note: Use userProfileImage conforme definido no AuthContext para consistência
      if (currentUser.userProfileImage) {
        setProfileImage(currentUser.userProfileImage);
      }
    }
  }, [currentUser]);

  // Função para solicitar permissões da galeria (necessário para o ImagePicker)
  const requestImagePickerPermissions = async () => {
    setLoadingPermissions(true);
    try {
      // Solicita permissão para acessar a biblioteca de mídia (galeria)
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
    // Verifica se tem permissão antes de continuar
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) {
      return;
    }

    try {
      // Abre a galeria para seleção de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images, // Correção: Usando o enum MediaType.Images
        allowsEditing: true, // Permite que o usuário edite/corte a imagem
        aspect: [1, 1],      // Define um aspecto quadrado para a imagem
        quality: 0.7,        // Qualidade da imagem (0 a 1)
        selectionLimit: 1,   // Permite selecionar apenas 1 imagem
      });

      // Se a seleção não foi cancelada e há assets (imagens)
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri); // Armazena a URI local da imagem selecionada
        console.log('pickImage - Imagem selecionada:', result.assets[0].uri);
      } else {
        console.log('pickImage - Seleção de imagem cancelada.');
      }
    } catch (error) {
      console.error('pickImage - Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Houve um problema ao selecionar a imagem.');
    }
  };

  // Função para voltar à tela anterior (por exemplo, tela de registro)
  const handleGoBack = () => {
    navigation.goBack();
  };

  // Função para criar ou atualizar o perfil do usuário
  const handleCreateProfile = async () => {
    // Validação básica do nome de usuário
    if (!username.trim()) {
      Alert.alert('Erro', 'O nome de usuário é obrigatório.');
      return;
    }

    setUploading(true); // Ativa o estado de upload (mostra ActivityIndicator no botão)
    try {
      let profileImageUrl = '';
      // Se uma imagem foi selecionada e não é uma URL já existente (ou seja, é um URI local novo)
      if (profileImage && !profileImage.startsWith('http')) {
        try {
          console.log('handleCreateProfile - Iniciando upload da imagem para Cloudinary');
          profileImageUrl = await uploadImage(profileImage, 'image'); // Tenta fazer upload
          console.log('handleCreateProfile - URL da imagem após upload:', profileImageUrl);
        } catch (error) {
          console.error('handleCreateProfile - Erro ao fazer upload da imagem para Cloudinary:', error);
          Alert.alert('Aviso', 'Falha ao fazer upload da foto. O perfil será salvo sem imagem.');
          // Em caso de falha no upload, profileImageUrl permanecerá vazia, ou a URL antiga se já existia.
        }
      } else if (profileImage && profileImage.startsWith('http')) {
        // Se já é uma URL (usuário não mudou a imagem ou é uma imagem pré-existente)
        profileImageUrl = profileImage;
      }

      // Prepara os dados do perfil para enviar para o AuthContext
      const profileData = {
        username: username.trim(),
        bio: bio.trim(),
        userProfileImage: profileImageUrl, // Salva a URL final da imagem
        profileCompleted: true, // Marca o perfil como completo
      };

      console.log('handleCreateProfile - Atualizando perfil com:', profileData);
      // Chama a função updateUserProfile do AuthContext (agora disponível e mockada)
      await updateUserProfile(profileData);
      console.log('handleCreateProfile - Perfil atualizado com sucesso');

      // Redefine a pilha de navegação para ir para a tela principal (tabs)
      // Isso é importante para que o usuário não possa voltar para as telas de autenticação/criação de perfil
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }], // Assegura que o nome da rota 'MainTabs' está correto no RootNavigator
      });
      console.log('handleCreateProfile - Navegando para MainTabs');

    } catch (error) {
      console.error('handleCreateProfile - Erro ao criar perfil:', error);
      Alert.alert('Erro', 'Houve um problema ao criar o perfil: ' + error.message);
    } finally {
      setUploading(false); // Desativa o estado de upload
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
        // Desabilita o botão se as permissões estiverem sendo carregadas ou se estiver fazendo upload
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
          textAlignVertical="top" // Para Android, faz o texto começar no topo
          numberOfLines={4} // Sugere uma altura de 4 linhas
        />
      </View>
      <TouchableOpacity
        style={[
          styles.createButton,
          { backgroundColor: Colors.primary, opacity: (uploading || loadingPermissions || !username.trim()) ? 0.7 : 1 }
        ]}
        onPress={uploading || loadingPermissions || !username.trim() ? null : handleCreateProfile}
        // Desabilita o botão se estiver fazendo upload, carregando permissões ou se o nome de usuário estiver vazio
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
    resizeMode: 'cover', // Garante que a imagem preencha o espaço
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Para preencher o TouchableOpacity
    height: '100%', // Para preencher o TouchableOpacity
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