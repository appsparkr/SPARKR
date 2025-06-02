// LoadingScreen.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import Colors from './constants/Colors';

const LoadingScreen = () => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text>Carregando...</Text> {}
  </View>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

export default LoadingScreen;