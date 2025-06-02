import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';
import { uploadImage } from './cloudinaryConfig'; // Certifique-se de que 'cloudinaryConfig' está correto
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateProfileScreen = ({ navigation }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(false); // Novo estado para permissões

  console.log('CreateProfileScreen - Rendering...');
  console.log('CreateProfileScreen - currentUser:', currentUser);

  useEffect(() => {
    // Preencher campos com dados existentes, se disponíveis
    if (currentUser) {
      if (currentUser.username) {
        setUsername(currentUser.username);
      }
      if (currentUser.bio) {
        setBio(currentUser.bio);
      }
      if (currentUser.profileImage) {
        setProfileImage(currentUser.profileImage);
      }
    }
    // Requisição de permissão ao montar o componente (opcional, pode ser no pickImage)
    // requestImagePickerPermissions(); 
  }, [currentUser]);

  // Função para solicitar permissões de mídia
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
      Alert.alert('Erro', 'Não foi possível solicitar permissões de galeria.');
      return false;
    } finally {
      setLoadingPermissions(false);
    }
  };

  const pickImage = async () => {
    // Verifica e solicita permissões antes de abrir a galeria
    const hasPermission = await requestImagePickerPermissions();
    if (!hasPermission) {
      return; // Sai da função se a permissão não foi concedida
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Apenas imagens
        allowsEditing: true, // Permite editar/cortar a imagem
        aspect: [1, 1], // Proporção 1:1 para foto de perfil
        quality: 0.7, // Qualidade da imagem (pode ajustar, 0.7 é um bom equilíbrio)
        selectionLimit: 1, // Garante que apenas uma imagem possa ser selecionada
      });

      if (!result.canceled) {
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

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Erro', 'O nome de usuário é obrigatório.');
      return;
    }

    setUploading(true);
    try {
      let profileImageUrl = '';
      if (profileImage) {
        try {
          console.log('handleCreateProfile - Iniciando upload da imagem para Cloudinary');
          profileImageUrl = await uploadImage(profileImage);
          console.log('handleCreateProfile - URL da imagem após upload:', profileImageUrl);
        } catch (error) {
          console.error('handleCreateProfile - Erro ao fazer upload da imagem para Cloudinary:', error);
          Alert.alert('Aviso', 'Falha ao fazer upload da foto. O perfil será salvo sem imagem.');
        }
      }

      const profileData = {
        username,
        bio: bio || '',
        profileImage: profileImageUrl,
        profileCompleted: true,
      };

      console.log('handleCreateProfile - Atualizando perfil com:', profileData);
      await updateUserProfile(profileData);
      console.log('handleCreateProfile - Perfil atualizado com sucesso');

      const availableScreens = navigation.getState()?.routeNames || [];
      console.log('handleCreateProfile - Telas disponíveis:', availableScreens);

      if (availableScreens.includes('Main')) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
        console.log('handleCreateProfile - Navegando para Main');
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
        console.log('handleCreateProfile - Navegando para Profile (fallback)');
      }
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
        disabled={loadingPermissions || uploading} // Desabilita enquanto busca permissões ou faz upload
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            {loadingPermissions ? ( // Mostra um spinner enquanto busca permissões
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
      <View style={[styles.inputContainer, styles.bioInput]}>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Bio (Opcional)"
          placeholderTextColor={Colors.textSecondary}
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
        />
      </View>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: Colors.primary, opacity: uploading || loadingPermissions ? 0.7 : 1 }]}
        onPress={uploading || loadingPermissions ? null : handleCreateProfile}
        disabled={uploading || loadingPermissions}
      >
        <Text style={styles.createButtonText}>{uploading ? 'Criando...' : 'Criar Perfil'}</Text>
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
  },
  profileImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    padding: 15,
    color: Colors.text,
    width: '100%',
  },
  bioInput: {
    height: 100,
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