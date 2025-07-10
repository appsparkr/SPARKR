import { Ionicons } from '@expo/vector-icons';
import { Video } from 'expo-av';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from './AuthContext';
import { uploadImage } from './cloudinaryConfig';
import Colors from './constants/Colors';

const AddContentScreen = () => {
  const { createPost, currentUser } = useAuth();
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState('');
  const [isStory, setIsStory] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoRef = useRef(null);

  const pickMedia = async (type = 'all') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à galeria.');
      return;
    }

    let options = {
      allowsEditing: true,
      quality: 1,
    };

    if (type === 'image') {
      options.mediaTypes = ImagePicker.MediaTypeOptions.Images;
    } else if (type === 'video') {
      options.mediaTypes = ImagePicker.MediaTypeOptions.Videos;
      options.videoMaxDuration = 60;
    } else {
      options.mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchImageLibraryAsync(options);

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setMedia(selectedAsset.uri);
      
      if (selectedAsset.type === 'video') {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const captureMedia = async (type = 'all') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'É necessário permitir o acesso à câmera.');
      return;
    }

    let options = {
      allowsEditing: true,
      quality: 1,
    };

    if (type === 'image') {
      options.mediaTypes = ImagePicker.MediaTypeOptions.Images;
    } else if (type === 'video') {
      options.mediaTypes = ImagePicker.MediaTypeOptions.Videos;
      options.videoMaxDuration = 60;
    } else {
      options.mediaTypes = ImagePicker.MediaTypeOptions.All;
    }

    const result = await ImagePicker.launchCameraAsync(options);

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setMedia(selectedAsset.uri);
      
      if (selectedAsset.type === 'video') {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const handlePost = async () => {
    if (!media) {
      Alert.alert('Erro', 'Selecione uma imagem ou vídeo para publicar.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const mediaUrl = await uploadImage(media, mediaType, (progress) => {
        setUploadProgress(progress);
      });
      
      await createPost({
        mediaUrl,
        mediaType,
        caption,
        isStory
      });

      setMedia(null);
      setMediaType(null);
      setCaption('');
      setUploadProgress(0);

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

  const renderMediaPreview = () => {
    if (!media) return null; // Se não há mídia, não renderiza nada

    // Garante que o URI é uma string válida antes de passar para source
    const mediaUri = typeof media === 'string' ? media : (media?.uri || null);

    if (!mediaUri) return null; // Se o URI ainda for inválido, não renderiza

    if (mediaType === 'video') {
      return (
        <View style={styles.mediaPreview}>
          <Video
            ref={videoRef}
            source={{ uri: mediaUri }} // Usa mediaUri validado
            style={styles.videoPreview}
            useNativeControls
            resizeMode="contain"
            isLooping
          />
          <View style={styles.videoControls}>
            <TouchableOpacity 
              style={styles.videoControlButton}
              onPress={() => videoRef.current?.playAsync()}
            >
              <Ionicons name="play" size={24} color={Colors.text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.videoControlButton}
              onPress={() => videoRef.current?.pauseAsync()}
            >
              <Ionicons name="pause" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <Image source={{ uri: mediaUri }} style={styles.imagePreview} /> // Usa mediaUri validado
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <ScrollView style={styles.scrollViewContent}>
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

        {media ? (
          <View style={styles.mediaContainer}>
            {renderMediaPreview()}
            <TouchableOpacity style={styles.changeMediaButton} onPress={() => pickMedia()}>
              <Text style={styles.changeMediaButtonText}>Alterar mídia</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mediaPickerContainer}>
            <View style={styles.mediaTypeSelector}>
              <TouchableOpacity 
                style={styles.mediaTypeButton} 
                onPress={() => pickMedia('image')}
              >
                <Ionicons name="image-outline" size={32} color={Colors.primary} />
                <Text style={styles.mediaTypeText}>Foto da Galeria</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaTypeButton} 
                onPress={() => pickMedia('video')}
              >
                <Ionicons name="videocam-outline" size={32} color={Colors.primary} />
                <Text style={styles.mediaTypeText}>Vídeo da Galeria</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mediaTypeSelector}>
              <TouchableOpacity 
                style={styles.mediaTypeButton} 
                onPress={() => captureMedia('image')}
              >
                <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                <Text style={styles.mediaTypeText}>Tirar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.mediaTypeButton} 
                onPress={() => captureMedia('video')}
              >
                <Ionicons name="recording-outline" size={32} color={Colors.primary} />
                <Text style={styles.mediaTypeText}>Gravar Vídeo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.postButton,
            { opacity: uploading || !media ? 0.7 : 1 }
          ]}
          onPress={uploading ? null : handlePost}
          disabled={uploading || !media}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
  },
  scrollViewContent: {
    flexGrow: 1, // Use flexGrow para garantir que o conteúdo preencha o espaço e permita rolagem
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
  mediaContainer: {
    marginVertical: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: Colors.inputBackground,
  },
  mediaPickerContainer: {
    marginVertical: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    padding: 20,
    backgroundColor: Colors.inputBackground,
  },
  mediaTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mediaTypeButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: Colors.background,
    width: '45%',
  },
  mediaTypeText: {
    marginTop: 10,
    color: Colors.text,
    fontWeight: '500',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  videoPreview: {
    width: '100%',
    aspectRatio: 16/9,
    borderRadius: 10,
  },
  mediaPreview: {
    width: '100%',
  },
  videoControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 10,
  },
  videoControlButton: {
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: Colors.inputBackground,
    borderRadius: 20,
  },
  changeMediaButton: {
    backgroundColor: Colors.background,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
    borderRadius: 5,
  },
  changeMediaButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
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
  progressContainer: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: Colors.inputBackground,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 5,
    color: Colors.text,
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