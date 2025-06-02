import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as firebase from './firebaseConfig';

// Criar o contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor de autenticação
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar estado de autenticação quando o componente montar
  useEffect(() => {
    console.log('AuthContext - Verificando estado de autenticação...');
    
    const checkAuthState = async () => {
      try {
        // Verificar se há um usuário armazenado localmente
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setCurrentUser(userData);
          console.log('AuthContext - Usuário encontrado no armazenamento local:', userData);
        }
        setLoading(false);
      } catch (error) {
        console.error('AuthContext - Erro ao verificar autenticação:', error);
        setCurrentUser(null);
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  // Função para registrar um novo usuário
  const signup = async (email, password, username) => {
    console.log('AuthContext - Registrando novo usuário:', { email, username });
    
    try {
      // Chamar a função de signup do Firebase
      const userData = await firebase.signup(email, password, username);
      
      // Atualizar o estado do usuário atual
      setCurrentUser(userData);
      
      return userData;
    } catch (error) {
      console.error('AuthContext - Erro ao registrar:', error);
      throw error;
    }
  };

  // Função para fazer login
  const login = async (email, password) => {
    try {
      // Chamar a função de login do Firebase
      const userData = await firebase.login(email, password);
      
      // Atualizar o estado do usuário atual
      setCurrentUser(userData);
      
      return userData;
    } catch (error) {
      console.error('AuthContext - Erro ao fazer login:', error);
      throw error;
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      // Chamar a função de logout do Firebase
      await firebase.logout();
      
      // Limpar o estado do usuário atual
      setCurrentUser(null);
    } catch (error) {
      console.error('AuthContext - Erro ao fazer logout:', error);
      throw error;
    }
  };

  // Função para atualizar o perfil do usuário
  const updateUserProfile = async (profileData) => {
    try {
      if (!currentUser) {
        throw new Error('Nenhum usuário autenticado');
      }
      
      // Chamar a função de atualização de perfil do Firebase
      const updatedUser = await firebase.updateUserProfile(currentUser.uid, profileData);
      
      // Atualizar o estado do usuário atual com os novos dados
      setCurrentUser(prev => ({
        ...prev,
        ...profileData
      }));
      
      return updatedUser;
    } catch (error) {
      console.error('AuthContext - Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  // Função para criar uma nova publicação
  const createPost = async (postData) => {
    try {
      if (!currentUser) {
        throw new Error('Nenhum usuário autenticado');
      }
      
      // Chamar a função de criação de post do Firebase
      const post = await firebase.createPost(postData);
      
      return post;
    } catch (error) {
      console.error('AuthContext - Erro ao criar publicação:', error);
      throw error;
    }
  };

  // Função para buscar publicações
  const getPosts = async (isStories = false) => {
    try {
      // Chamar a função de busca de posts do Firebase
      const posts = await firebase.getPosts(isStories);
      
      return posts;
    } catch (error) {
      console.error('AuthContext - Erro ao buscar publicações:', error);
      throw error;
    }
  };

  // Função para buscar usuários
  const searchUsers = async (query) => {
    try {
      // Chamar a função de busca de usuários do Firebase
      const users = await firebase.searchUsers(query);
      
      return users;
    } catch (error) {
      console.error('AuthContext - Erro ao buscar usuários:', error);
      throw error;
    }
  };

  // Valor do contexto
  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    createPost,
    getPosts,
    searchUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
