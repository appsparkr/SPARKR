import axios from "axios";

const UPLOADCARE_URL = "https://upload.uploadcare.com/base/";
const UPLOADCARE_PUBLIC_KEY = "demopublickey"; // Chave pública padrão de teste do UploadCare

export const uploadImage = async (imageUri) => {
  const formData = new FormData();
  formData.append("UPLOADCARE_PUB_KEY", UPLOADCARE_PUBLIC_KEY);
  formData.append("file", {
    uri: imageUri,
    type: "image/jpeg", // ou o tipo de imagem apropriado
    name: "upload.jpg",
  });

  try {
    const response = await axios.post(UPLOADCARE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Upload bem-sucedido:", response.data);
    return `https://ucarecdn.com/${response.data.file}/`; // URL da imagem no UploadCare
  } catch (error) {
    console.error("Erro ao fazer upload da imagem:", error);
    throw error;
  }
};
