import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração do Firebase
const apiKey = "AIzaSyAv4DOv6yoI9QcGGyITHimmuZJQb58Ptig";
const projectId = 'sparkr-app';
const projectNumber = '278148826560';

console.log('firebaseConfig - apiKey:', apiKey);

// Função para registrar um novo usuário
export async function signup(email, password, username) {
  console.log('signup - Chamando API REST com:', { email, username });
  
  try {
    // URL para autenticação do Firebase
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;
    
    // Criar usuário com Authentication REST API
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });
    
    const authData = await authResponse.json();
    
    if (authData.error) {
      console.error('signup - Erro na autenticação:', authData);
      throw new Error(authData.error?.message || 'Falha ao criar usuário');
    }
    
    console.log('signup - Usuário criado:', { uid: authData.localId, email: authData.email });
    
    // Salvar dados do usuário no Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${authData.localId}`;
    
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.idToken}`,
      },
      body: JSON.stringify({
        fields: {
          username: { stringValue: username },
          email: { stringValue: email },
          profileCompleted: { booleanValue: false },
          createdAt: { integerValue: Date.now() }
        }
      }),
    });
    
    if (!firestoreResponse.ok) {
      const errorData = await firestoreResponse.json();
      console.error('signup - Erro ao salvar dados no Firestore:', errorData);
    }
    
    // Armazenar token e dados do usuário localmente
    const userData = {
      uid: authData.localId,
      email: authData.email,
      username,
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
      profileCompleted: false,
    };
    
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('signup - Erro:', error);
    throw error;
  }
}

// Função para fazer login
export async function login(email, password) {
  try {
    // URL para autenticação do Firebase
    const authUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    
    // Fazer login com Authentication REST API
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });
    
    const authData = await authResponse.json();
    
    if (authData.error) {
      console.error('login - Erro na autenticação:', authData);
      throw new Error(authData.error?.message || 'Falha ao fazer login');
    }
    
    // Buscar dados do usuário no Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${authData.localId}`;
    
    const firestoreResponse = await fetch(firestoreUrl, {
      headers: {
        'Authorization': `Bearer ${authData.idToken}`,
      },
    });
    
    let userData = {
      uid: authData.localId,
      email: authData.email,
      idToken: authData.idToken,
      refreshToken: authData.refreshToken,
    };
    
    if (firestoreResponse.ok) {
      const firestoreData = await firestoreResponse.json();
      
      // Extrair dados do usuário do Firestore
      if (firestoreData.fields) {
        userData = {
          ...userData,
          username: firestoreData.fields.username?.stringValue || '',
          bio: firestoreData.fields.bio?.stringValue || '',
          profileImage: firestoreData.fields.profileImage?.stringValue || '',
          profileCompleted: firestoreData.fields.profileCompleted?.booleanValue || false,
        };
      }
    }
    
    // Armazenar dados do usuário localmente
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
    
    return userData;
  } catch (error) {
    console.error('login - Erro:', error);
    throw error;
  }
}

// Função para fazer logout
export async function logout() {
  try {
    // Remover dados do usuário do armazenamento local
    await AsyncStorage.removeItem('userData');
    return true;
  } catch (error) {
    console.error('logout - Erro:', error);
    throw error;
  }
}

// Função para atualizar o perfil do usuário
export async function updateUserProfile(uid, profileData) {
  try {
    // Obter token de autenticação do armazenamento local
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('Usuário não autenticado');
    }
    
    const userData = JSON.parse(userDataString);
    const idToken = userData.idToken;
    
    if (!idToken) {
      throw new Error('Token de autenticação não disponível');
    }
    
    // URL para o Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`;
    
    // Preparar os dados para o Firestore
    const firestoreFields = {};
    
    // Converter os dados do perfil para o formato do Firestore
    Object.keys(profileData).forEach(key => {
      const value = profileData[key];
      
      if (typeof value === 'boolean') {
        firestoreFields[key] = { booleanValue: value };
      } else if (typeof value === 'string') {
        firestoreFields[key] = { stringValue: value };
      } else if (typeof value === 'number') {
        firestoreFields[key] = { integerValue: value };
      }
    });
    
    // Adicionar timestamp de atualização
    firestoreFields.updatedAt = { integerValue: Date.now() };
    
    // Enviar dados para o Firestore
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fields: firestoreFields
      }),
    });
    
    if (!firestoreResponse.ok) {
      const errorData = await firestoreResponse.json();
      console.error('updateUserProfile - Erro ao salvar perfil:', errorData);
      throw new Error('Erro ao salvar perfil');
    }
    
    // Atualizar dados do usuário no armazenamento local
    const updatedUserData = {
      ...userData,
      ...profileData
    };
    
    await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
    
    return updatedUserData;
  } catch (error) {
    console.error('updateUserProfile - Erro:', error);
    throw error;
  }
}

// Função para criar uma nova publicação
export async function createPost(postData) {
  try {
    // Obter token de autenticação do armazenamento local
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('Usuário não autenticado');
    }
    
    const userData = JSON.parse(userDataString);
    const idToken = userData.idToken;
    const uid = userData.uid;
    
    if (!idToken || !uid) {
      throw new Error('Token de autenticação não disponível');
    }
    
    // Gerar ID único para o post
    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // URL para o Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
    
    // Preparar os dados para o Firestore
    const firestoreFields = {
      userId: { stringValue: uid },
      username: { stringValue: userData.username || '' },
      userProfileImage: { stringValue: userData.profileImage || '' },
      imageUrl: { stringValue: postData.imageUrl || '' },
      caption: { stringValue: postData.caption || '' },
      likes: { integerValue: 0 },
      comments: { integerValue: 0 },
      createdAt: { integerValue: Date.now() },
      isStory: { booleanValue: postData.isStory || false }
    };
    
    // Enviar dados para o Firestore
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        fields: firestoreFields
      }),
    });
    
    if (!firestoreResponse.ok) {
      const errorData = await firestoreResponse.json();
      console.error('createPost - Erro ao salvar publicação:', errorData);
      throw new Error('Erro ao salvar publicação');
    }
    
    return {
      id: postId,
      ...postData,
      userId: uid,
      username: userData.username,
      userProfileImage: userData.profileImage,
      likes: 0,
      comments: 0,
      createdAt: Date.now()
    };
  } catch (error) {
    console.error('createPost - Erro:', error);
    throw error;
  }
}

// Função para buscar publicações
export async function getPosts(isStories = false) {
  try {
    // Obter token de autenticação do armazenamento local
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('Usuário não autenticado');
    }
    
    const userData = JSON.parse(userDataString);
    const idToken = userData.idToken;
    
    if (!idToken) {
      throw new Error('Token de autenticação não disponível');
    }
    
    // URL para o Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    
    // Criar consulta para buscar publicações
    const queryData = {
      structuredQuery: {
        from: [{ collectionId: 'posts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'isStory' },
            op: 'EQUAL',
            value: { booleanValue: isStories }
          }
        },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 20
      }
    };
    
    // Enviar consulta para o Firestore
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(queryData),
    });
    
    if (!firestoreResponse.ok) {
      const errorData = await firestoreResponse.json();
      console.error('getPosts - Erro na busca:', errorData);
      throw new Error('Erro ao buscar publicações');
    }
    
    const responseData = await firestoreResponse.json();
    
    // Processar resultados
    const posts = responseData
      .filter(item => item.document)
      .map(item => {
        const postId = item.document.name.split('/').pop();
        const fields = item.document.fields || {};
        
        return {
          id: postId,
          userId: fields.userId?.stringValue || '',
          username: fields.username?.stringValue || '',
          userProfileImage: fields.userProfileImage?.stringValue || '',
          imageUrl: fields.imageUrl?.stringValue || '',
          caption: fields.caption?.stringValue || '',
          likes: Number(fields.likes?.integerValue || 0),
          comments: Number(fields.comments?.integerValue || 0),
          createdAt: Number(fields.createdAt?.integerValue || 0),
          isStory: fields.isStory?.booleanValue || false
        };
      });
    
    return posts;
  } catch (error) {
    console.error('getPosts - Erro:', error);
    throw error;
  }
}

// Função para buscar usuários
export async function searchUsers(query) {
  try {
    // Obter token de autenticação do armazenamento local
    const userDataString = await AsyncStorage.getItem('userData');
    if (!userDataString) {
      throw new Error('Usuário não autenticado');
    }
    
    const userData = JSON.parse(userDataString);
    const idToken = userData.idToken;
    
    if (!idToken) {
      throw new Error('Token de autenticação não disponível');
    }
    
    // URL para o Firestore
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`;
    
    // Criar consulta para buscar usuários pelo nome de usuário
    const queryData = {
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'username' },
            op: 'GREATER_THAN_OR_EQUAL',
            value: { stringValue: query }
          }
        },
        limit: 10
      }
    };
    
    // Enviar consulta para o Firestore
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(queryData),
    });
    
    if (!firestoreResponse.ok) {
      const errorData = await firestoreResponse.json();
      console.error('searchUsers - Erro na busca:', errorData);
      throw new Error('Erro ao buscar usuários');
    }
    
    const responseData = await firestoreResponse.json();
    
    // Processar resultados
    const users = responseData
      .filter(item => item.document)
      .map(item => {
        const userId = item.document.name.split('/').pop();
        const fields = item.document.fields || {};
        
        return {
          uid: userId,
          username: fields.username?.stringValue || '',
          profileImage: fields.profileImage?.stringValue || '',
          bio: fields.bio?.stringValue || '',
        };
      });
    
    return users;
  } catch (error) {
    console.error('searchUsers - Erro:', error);
    throw error;
  }
}
