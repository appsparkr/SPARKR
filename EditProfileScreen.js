// EditProfileScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from './constants/Colors'; // Assumindo que Colors está no mesmo nível ou acessível

const EditProfileScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tela de Edição de Perfil</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // Use sua cor de fundo padrão
  },
  text: {
    color: Colors.text, // Use sua cor de texto padrão
    fontSize: 20,
  },
});

export default EditProfileScreen;