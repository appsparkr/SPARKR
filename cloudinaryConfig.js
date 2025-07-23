import axios from 'axios';

// Configuração do Cloudinary para ambiente de produção
const CLOUDINARY_CLOUD_NAME = "dou4wpvcg";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
const CLOUDINARY_UPLOAD_PRESET = "sparkr_unsigned";

// Função principal para upload de mídia (imagem ou vídeo)
export const uploadImage = async (mediaUri, mediaType = 'image', onProgress = () => {}) => {
  if (!mediaUri) {
    console.log('uploadImage - Nenhuma mídia fornecida');
    return null;
  }

  console.log(`uploadImage - Iniciando upload de ${mediaType} para Cloudinary. URI:`, mediaUri);

  try {
    const formData = new FormData();
    const filename = mediaUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const fileExtension = match ? match[1] : mediaType === 'video' ? 'mp4' : 'jpeg';
    let mimeType;

    if (mediaType === 'video') {
      mimeType = `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`;
    } else {
      mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    }

    formData.append("file", {
      uri: mediaUri,
      type: mimeType,
      name: filename,
    });

    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // Adiciona parâmetros específicos para vídeo, se aplicável
    if (mediaType === 'video') {
      formData.append("resource_type", "video");
      // TODAS AS LINHAS "eager" FORAM REMOVIDAS DAQUI
    }

    // Fazer upload para o Cloudinary usando axios
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
        }
      },
    });

    console.log(`uploadImage - Upload de ${mediaType} bem-sucedido:`, response.data.secure_url);
    
    if (mediaType === 'video') {
      return {
        url: response.data.secure_url,
        duration: response.data.duration || 0,
        thumbnail: response.data.thumbnail_url || response.data.secure_url,
        format: response.data.format || 'mp4'
      };
    }
    
    return response.data.secure_url;
  } catch (error) {
    console.error(`uploadImage - Erro ao fazer upload de ${mediaType}:`, error);

    if (error.response) {
      console.error('uploadImage - Resposta de erro do servidor (data):', error.response.data);
      console.error('uploadImage - Resposta de erro do servidor (status):', error.response.status);
      console.error('uploadImage - Resposta de erro do servidor (headers):', error.response.headers);
    } else if (error.request) {
      console.error('uploadImage - Nenhuma resposta recebida para a requisição. Request:', error.request);
    } else {
      console.error('uploadImage - Erro na configuração da requisição:', error.message);
    }

    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'snack') {
        // ... (código de fallback mantido)
    }

    throw error;
  }
};

// Função para obter URL de imagem pública (para testes)
export const getPublicImageUrl = () => {
  const demoImages = [
    'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1548407260-da850faa41e3_kninfp.jpg',
    'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133410-c9f0d35500dd_aldcbh.jpg',
    'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133049-30b31e0e0b0e_yydpxw.jpg'
  ];
  const randomIndex = Math.floor(Math.random() * demoImages.length);
  return demoImages[randomIndex];
};

// Função para obter URL de vídeo público (para testes)
export const getPublicVideoUrl = () => {
  const demoVideos = [
    'https://res.cloudinary.com/demo/video/upload/v1689413302/samples/sea-turtle.mp4',
    'https://res.cloudinary.com/demo/video/upload/v1689413302/samples/elephants.mp4'
  ];
  const randomIndex = Math.floor(Math.random() * demoVideos.length);
  return {
    url: demoVideos[randomIndex],
    duration: 10,
    thumbnail: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
    format: 'mp4'
  };
};