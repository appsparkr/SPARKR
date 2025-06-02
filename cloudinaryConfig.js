import axios from 'axios';
// import * as FileSystem from 'expo-file-system'; // Não é estritamente necessário para este caso, mas útil para manipulação de arquivos

// Configuração do Cloudinary para ambiente de produção
// ATENÇÃO: Substitua "dou4wkpwc" pelo seu CLOUD NAME real do Cloudinary!
const CLOUDINARY_CLOUD_NAME = "dou4wkpwc"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
// ATENÇÃO: Substitua "sparkr_unsigned" pelo seu UPLOAD PRESET real do Cloudinary!
const CLOUDINARY_UPLOAD_PRESET = "sparkr_unsigned"; 

// A função imageToBase64 foi removida, pois não estava sendo usada e não era uma conversão real para base64.
// O ImagePicker já fornece um URI de arquivo que pode ser usado diretamente.

// Função principal para upload de imagem
export const uploadImage = async (imageUri) => {
  if (!imageUri) {
    console.log('uploadImage - Nenhuma imagem fornecida');
    return null;
  }

  console.log('uploadImage - Iniciando upload da imagem para Cloudinary. URI:', imageUri);

  try {
    const formData = new FormData();

    // Extrai o nome do arquivo e a extensão do URI para usar no FormData
    const filename = imageUri.split('/').pop(); // Pega a última parte do URI como nome do arquivo
    const match = /\.(\w+)$/.exec(filename); // Extrai a extensão (ex: jpg, png)
    const fileExtension = match ? match[1] : 'jpeg'; // Se não encontrar, assume jpeg
    
    // Tenta inferir o tipo MIME da imagem
    const imageType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

    // Adiciona o arquivo ao FormData.
    // Para React Native, o objeto { uri, type, name } é a forma correta de enviar um arquivo.
    formData.append("file", {
      uri: imageUri,
      type: imageType, // Tipo MIME da imagem (ex: image/jpeg, image/png)
      name: filename, // Nome do arquivo (ex: my_photo.jpg)
    });

    // Adiciona o preset de upload não autenticado
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    // Fazer upload para o Cloudinary usando axios
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: {
        // É crucial definir 'Content-Type' como 'multipart/form-data' para uploads de arquivos
        "Content-Type": "multipart/form-data", 
      },
    });

    console.log('uploadImage - Upload bem-sucedido:', response.data.secure_url);
    return response.data.secure_url;
  } catch (error) {
    console.error('uploadImage - Erro ao fazer upload da imagem:', error);

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
      console.log('uploadImage - Usando URL de imagem pública como fallback (ambiente Snack)');
      const demoImages = [
        'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg',
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1548407260-da850faa41e3_kninfp.jpg',
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133410-c9f0d35500dd_aldcbh.jpg',
        'https://res.cloudinary.com/demo/image/upload/c_scale,w_200/v1582134005/photo-1582134133049-30b31e0e0b0e_yydpxw.jpg'
      ];
      const randomIndex = Math.floor(Math.random() * demoImages.length);
      return demoImages[randomIndex];
    }

    // Re-lança o erro para ser tratado pela função chamadora (handleCreateProfile)
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
