import axios from 'axios';

// Configuração do Cloudinary para ambiente de produção
// ATENÇÃO: Substitua "dou4wpvcg" pelo seu CLOUD NAME real do Cloudinary!
const CLOUDINARY_CLOUD_NAME = "dou4wpvcg";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
// ATENÇÃO: Substitua "sparkr_unsigned" pelo seu UPLOAD PRESET real do Cloudinary!
const CLOUDINARY_UPLOAD_PRESET = "sparkr_unsigned";

// Função principal para upload de mídia (imagem ou vídeo)
export const uploadImage = async (mediaUri, mediaType = 'image') => {
  if (!mediaUri) {
    console.log('uploadImage - Nenhuma mídia fornecida');
    return null;
  }

  console.log(`uploadImage - Iniciando upload de ${mediaType} para Cloudinary. URI:`, mediaUri);

  try {
    const formData = new FormData();

    // Extrai o nome do arquivo e a extensão do URI para usar no FormData
    const filename = mediaUri.split('/').pop(); // Pega a última parte do URI como nome do arquivo
    const match = /\.(\w+)$/.exec(filename); // Extrai a extensão (ex: jpg, png, mp4)
    const fileExtension = match ? match[1] : mediaType === 'video' ? 'mp4' : 'jpeg'; // Se não encontrar, assume mp4 para vídeo ou jpeg para imagem

    // Tenta inferir o tipo MIME da mídia
    let mimeType;
    if (mediaType === 'video') {
      mimeType = `video/${fileExtension === 'mov' ? 'quicktime' : fileExtension}`;
    } else {
      mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    }

    // Adiciona o arquivo ao FormData.
    // Para React Native, o objeto { uri, type, name } é a forma correta de enviar um arquivo.
    formData.append("file", {
      uri: mediaUri,
      type: mimeType, // Tipo MIME da mídia
      name: filename, // Nome do arquivo
    });

    // Adiciona o preset de upload não autenticado
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // Adiciona parâmetros específicos para vídeo, se aplicável
    if (mediaType === 'video') {
      // Configurações para otimização de vídeo
      formData.append("resource_type", "video");
      formData.append("eager", "c_scale,w_640");
      formData.append("eager_async", "true");
      formData.append("eager_notification_url", "");
    }

    // Fazer upload para o Cloudinary usando axios
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: {
        // É crucial definir 'Content-Type' como 'multipart/form-data' para uploads de arquivos
        "Content-Type": "multipart/form-data",
      },
    });

    console.log(`uploadImage - Upload de ${mediaType} bem-sucedido:`, response.data.secure_url);
    
    // Para vídeos, retornar informações adicionais
    if (mediaType === 'video') {
      return {
        url: response.data.secure_url,
        duration: response.data.duration || 0,
        thumbnail: response.data.thumbnail_url || response.data.secure_url,
        format: response.data.format || 'mp4'
      };
    }
    
    // Para imagens, retornar apenas a URL
    return response.data.secure_url;
  } catch (error) {
    console.error(`uploadImage - Erro ao fazer upload de ${mediaType}:`, error);

    // --- ADICIONADO: Log mais detalhado do erro para depuração ---
    if (error.response) {
      // O servidor (Cloudinary) respondeu com um status de erro (ex: 4xx, 5xx)
      console.error('uploadImage - Resposta de erro do servidor (data):', error.response.data);
      console.error('uploadImage - Resposta de erro do servidor (status):', error.response.status);
      console.error('uploadImage - Resposta de erro do servidor (headers):', error.response.headers);
    } else if (error.request) {
      // A requisição foi feita, mas nenhuma resposta foi recebida (ex: problema de rede)
      console.error('uploadImage - Nenhuma resposta recebida para a requisição. Request:', error.request);
    } else {
      // Algo aconteceu na configuração da requisição que disparou um erro
      console.error('uploadImage - Erro na configuração da requisição:', error.message);
    }
    // --- FIM DO LOG DETALHADO ---

    // Fallback para ambiente Snack Expo (mantido do seu código original)
    if (process.env.EXPO_PUBLIC_ENVIRONMENT === 'snack') {
      console.log(`uploadImage - Usando URL de ${mediaType} pública como fallback (ambiente Snack)`);
      
      if (mediaType === 'video') {
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
      } else {
        const demoImages = [
          'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
          'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1548407260-da850faa41e3_kninfp.jpg',
          'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133410-c9f0d35500dd_aldcbh.jpg',
          'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133049-30b31e0e0b0e_yydpxw.jpg'
        ];
        const randomIndex = Math.floor(Math.random() * demoImages.length);
        return demoImages[randomIndex];
      }
    }

    // Re-lança o erro para ser tratado pela função chamadora
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
