// MainTabNavigator.js - Versão que importa suas telas reais e usa ProfileStackNavigator
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Para ícones
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importe seus componentes de tela REAIS
import AddContentScreen from './AddContentScreen';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
// Importe o novo ProfileStackNavigator
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // Oculta o cabeçalho padrão da tab screen
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'magnify' : 'magnify';
          } else if (route.name === 'AddContent') {
            iconName = focused ? 'plus-box' : 'plus-box-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6347',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="AddContent" component={AddContentScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

export default MainTabNavigator;