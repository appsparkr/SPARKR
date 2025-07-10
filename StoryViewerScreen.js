// StoryViewerScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Video } from 'expo-av'; // ADICIONADO: Importação do componente Video
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from './constants/Colors'; // Ajuste o caminho se necessário

const { width, height } = Dimensions.get('window'); // Obtém as dimensões da tela para layout

const StoryViewerScreen = () => {
    console.log('--- STORYVIEWERSCREEN LOGS ---');
    console.log('StoryViewerScreen: Componente StoryViewerScreen iniciado.');

    const route = useRoute();
    const navigation = useNavigation();
    // Pega a URL da mídia e o tipo do story dos parâmetros da rota
    const { storyMediaUrl, storyMediaType } = route.params || {}; // MODIFICADO: Pega storyMediaUrl e storyMediaType

    console.log('StoryViewerScreen: storyMediaUrl RECEBIDA via params:', storyMediaUrl);
    console.log('StoryViewerScreen: storyMediaType RECEBIDA via params:', storyMediaType);

    return (
        <View style={styles.container}>
            {/* Botão para fechar a tela do story */}
            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                <Ionicons name="close-circle" size={30} color="white" />
            </TouchableOpacity>
            
            {/* Exibe a mídia do story (imagem ou vídeo) ou um placeholder */}
            {storyMediaUrl ? (
                storyMediaType === 'video' ? (
                    <Video
                        source={{ uri: storyMediaUrl }}
                        style={styles.storyMedia} // Estilo unificado para mídia
                        useNativeControls={false} // Você pode querer customizar os controles ou ter autoplay
                        resizeMode="contain"
                        isLooping
                        shouldPlay
                        onLoadStart={() => console.log('Video: Carregamento iniciado.')}
                        onLoad={() => console.log('Video: Carregado com sucesso.')}
                        onError={(error) => console.error('Video: Erro ao carregar vídeo:', error)}
                    />
                ) : ( // Assume 'image' ou outro tipo padrão como imagem
                    <Image 
                        source={{ uri: storyMediaUrl }} 
                        style={styles.storyMedia} // Estilo unificado para mídia
                        resizeMode="contain"
                    />
                )
            ) : (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>Nenhuma história para mostrar.</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.black,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyMedia: { // Estilo unificado para imagem e vídeo
        width: '100%',
        height: '100%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: Colors.textSecondary,
        fontSize: 16,
    },
});

export default StoryViewerScreen;