// ProfileStackNavigator.js
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importe suas telas
import EditProfileScreen from './EditProfileScreen'; // Sua tela de edição de perfil
import ProfileScreen from './ProfileScreen'; // Sua tela de perfil
// Importe outras telas relacionadas ao perfil aqui se tiver (ex: SettingsScreen, PrivacyScreen)

const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      {/* Adicione outras telas relacionadas ao perfil aqui */}
    </ProfileStack.Navigator>
  );
}

export default ProfileStackNavigator;