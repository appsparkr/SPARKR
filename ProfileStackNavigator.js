// ProfileStackNavigator.js
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TouchableOpacity } from 'react-native';
import Colors from './constants/Colors';

// Importe suas telas
import EditProfileScreen from './EditProfileScreen';
import ProfileScreen from './ProfileScreen';
import SettingsScreen from './SettingsScreen'; // Importe a nova tela de configurações

const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        // headerShown: true, // Removido daqui para que cada tela possa definir o seu próprio
        headerTintColor: Colors.white, // Cor do texto e ícones do cabeçalho
        headerStyle: {
          backgroundColor: Colors.background, // Cor de fundo do cabeçalho
          shadowOpacity: 0, // Remove sombra no iOS
          elevation: 0, // Remove sombra no Android
        },
        headerTitleStyle: {
          color: Colors.text, // Cor do título do cabeçalho (ajustado para Colors.text)
          fontWeight: 'bold',
        },
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: 'Perfil', // Título para o cabeçalho da ProfileScreen
          headerShown: true, // Garante que o cabeçalho seja visível para ProfileMain
          headerRight: () => (
            <TouchableOpacity
              // CORREÇÃO AQUI: navigation.navigate para 'SettingsScreen' dentro do mesmo stack
              // Se 'SettingsScreen' estiver no RootStack, você usaria navigation.getParent()?.navigate('Settings')
              // Mas para simplificar e manter o Settings dentro do ProfileStack, vamos navegar diretamente.
              onPress={() => navigation.navigate('SettingsScreen')} 
              style={{ marginRight: 15 }}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        })}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Editar Perfil',
          headerShown: true, // Garante que o cabeçalho seja visível para EditProfile
        }}
      />
      <ProfileStack.Screen
        name="SettingsScreen" // Adicione a SettingsScreen ao ProfileStack
        component={SettingsScreen}
        options={{
          title: 'Configurações', // Título para o cabeçalho da SettingsScreen
          headerShown: true, // Garante que o cabeçalho seja visível para SettingsScreen
        }}
      />
    </ProfileStack.Navigator>
  );
}

export default ProfileStackNavigator;