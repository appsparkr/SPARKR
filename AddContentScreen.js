import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';
import Colors from './constants/Colors';
import { uploadImage } from './cloudinaryConfig';

const AddContentScreen = () => {
  const { createPost, currentUser } = useAuth();
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [isStory, setIsStory] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!image) {
      Alert.alert('Erro', 'Selecione uma imagem para publicar.');
      return;
    }

    setUploading(true);
    try {
      // Upload da imagem para o Cloudinary
      const imageUrl = await uploadImage(image);
      
      // Criar post no Firebase
      await createPost({
        imageUrl,
        caption,
        isStory
      });
      
      // Limpar formulário
      setImage(null);
      setCaption('');
      
      Alert.alert(
        'Sucesso', 
        isStory ? 'Seu story foi publicado com sucesso!' : 'Sua publicação foi criada com sucesso!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('AddContentScreen - Erro ao criar publicação:', error);
      Alert.alert('Erro', 'Houve um problema ao criar a publicação: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.typeButton, !isStory && styles.activeTypeButton]}
          onPress={() => setIsStory(false)}
        >
          <Text style={[styles.typeButtonText, !isStory && styles.activeTypeButtonText]}>Post</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, isStory && styles.activeTypeButton]}
          onPress={() => setIsStory(true)}
        >
          <Text style={[styles.typeButtonText, isStory && styles.activeTypeButtonText]}>Story</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.placeholderText}>Toque para selecionar uma imagem</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {!isStory && (
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Escreva uma legenda..."
            placeholderTextColor={Colors.textSecondary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.postButton, { opacity: uploading ? 0.7 : 1 }]}
        onPress={uploading ? null : handlePost}
        disabled={uploading || !image}
      >
        {uploading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.postButtonText}>
            {isStory ? 'Publicar Story' : 'Publicar'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  activeTypeButton: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  activeTypeButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  imageContainer: {
    aspectRatio: 1,
    marginVertical: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.inputBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  captionContainer: {
    marginHorizontal: 10,
    marginBottom: 20,
  },
  captionInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 10,
    padding: 15,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 10,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  postButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddContentScreen;
