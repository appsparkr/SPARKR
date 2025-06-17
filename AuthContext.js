import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

// Função mock para simular autenticação. Em um ambiente real, você usaria Firebase, AWS Amplify, etc.
const MOCK_FIREBASE_AUTH_SUCCESS_TOKEN = 'mocked-jwt-token'; // Token simples para simular login
const MOCK_REGISTER_UID = 'mocked-user-id-register'; // UID para um novo registro

export const AuthProvider = ({ children }) => {
  console.log('AuthContext (Depuracao Extrema): Renderizando AuthProvider.');
  const [currentUser, setCurrentUser] = useState(null); // Armazenará { uid, email, profileCompleted, username, userProfileImage }
  const [authLoading, setAuthLoading] = useState(true); // Indica se o processo de carregamento inicial da autenticação está em andamento

  useEffect(() => {
    // Ao iniciar, tenta carregar o usuário do SecureStore
    const loadUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          console.log('AuthContext: Usuário carregado do SecureStore:', user.email);
        }
      } catch (e) {
        console.error('AuthContext: Falha ao carregar usuário do SecureStore', e);
      } finally {
        setAuthLoading(false); // Carregamento inicial concluído
      }
    };
    loadUser();
  }, []);

  const register = async (email, password) => {
    setAuthLoading(true); // Inicia carregamento
    try {
      // Simula um atraso de rede e um registro bem-sucedido
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newUser = {
        uid: MOCK_REGISTER_UID,
        email: email,
        profileCompleted: false, // Novo usuário, perfil não completo
        username: null,
        userProfileImage: null,
      };
      await SecureStore.setItemAsync('user', JSON.stringify(newUser));
      setCurrentUser(newUser);
      console.log('AuthContext: Registro mockado concluído. Usuário:', newUser);
      return newUser;
    } catch (error) {
      console.error('AuthContext: Erro mockado no registro:', error);
      throw new Error('Falha no registro: ' + error.message);
    } finally {
      setAuthLoading(false); // Finaliza carregamento
    }
  };

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Simula login de um usuário que já completou o perfil para testes
      if (email === 'test@example.com' && password === 'password') {
        const loggedInUser = {
          uid: 'mocked-user-id-login',
          email: email,
          profileCompleted: true, // Simula perfil completo
          username: 'TestUser',
          userProfileImage: 'https://example.com/mock-profile.jpg', // URL mock
        };
        await SecureStore.setItemAsync('user', JSON.stringify(loggedInUser));
        setCurrentUser(loggedInUser);
        console.log('AuthContext: Login mockado bem-sucedido. Usuário:', loggedInUser);
        return loggedInUser;
      } else {
        throw new new Error('Credenciais inválidas ou usuário não mockado.');
      }
    } catch (error) {
      console.error('AuthContext: Erro mockado no login:', error);
      throw new Error('Falha no login: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    setAuthLoading(true);
    try {
      await SecureStore.deleteItemAsync('user');
      setCurrentUser(null);
      console.log('AuthContext: Logout mockado bem-sucedido.');
    } catch (error) {
      console.error('AuthContext: Erro mockado no logout:', error);
      throw new Error('Falha no logout: ' + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ***** NOVA FUNÇÃO: updateUserProfile *****
  const updateUserProfile = async (profileData) => {
    setAuthLoading(true); // Ativa o loading durante a atualização
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula atraso
      // Combina os dados existentes com os novos dados do perfil
      const updatedUser = {
        ...currentUser,
        ...profileData,
      };
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser); // Atualiza o estado do usuário
      console.log('AuthContext: Perfil do usuário mockado atualizado:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('AuthContext: Erro mockado ao atualizar perfil:', error);
      throw new Error('Falha ao atualizar perfil: ' + error.message);
    } finally {
      setAuthLoading(false); // Desativa o loading
    }
  };
  // ***** FIM NOVA FUNÇÃO *****

  const authContextValue = {
    currentUser,
    authLoading,
    register,
    login,
    logout,
    updateUserProfile, // ***** EXPOSTO AQUI! *****
  };

  console.log('AuthContext.js (Depuracao Extrema): Fim do arquivo. Exportações AuthProvider e useAuth.');
  console.log('AuthContext.js (Depuracao Extrema): typeof AuthProvider ao exportar:', typeof AuthProvider);
  console.log('AuthContext.js (Depuracao Extrema): typeof useAuth ao exportar:', typeof useAuth);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};