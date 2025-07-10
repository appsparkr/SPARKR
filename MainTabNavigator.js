// MainTabNavigator.js

// Importações de bibliotecas e ícones
import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '@react-navigation/native';

// Importe suas telas REAIS
import AddContentScreen from './AddContentScreen';
import HomeScreen from './HomeScreen';
import NotificationsScreen from './NotificationsScreen';
import SearchScreen from './SearchScreen';
// Importe o Stack Navigator para o perfil
import ProfileStackNavigator from './ProfileStackNavigator';

// Importe o novo componente de badge
import NotificationIconWithBadge from './NotificationIconWithBadge'; // AJUSTE O CAMINHO SE NotificationIconWithBadge.js NÃO ESTIVER NA MESMA PASTA QUE MainTabNavigator.js
// Se NotificationIconWithBadge.js estiver na raiz e MainTabNavigator.js também, o caminho é './NotificationIconWithBadge'
// Se MainTabNavigator.js estiver em uma subpasta (ex: 'navigators/MainTabNavigator.js') e o badge na raiz, o caminho seria '../NotificationIconWithBadge'
// Se ambos estiverem em 'screens/', seria './NotificationIconWithBadge'

// Importe o arquivo de cores
import Colors from './constants/Colors'; // AJUSTE O CAMINHO: Assumindo que Colors.js está em uma pasta 'constants' no mesmo nível ou acima.

const Tab = createBottomTabNavigator();

const MainTabNavigator = () => {
    const { colors } = useTheme(); // Mantém o uso do tema para outras cores se desejar

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false, // Oculta o cabeçalho padrão das telas da aba (o ProfileStack agora tem seu próprio)
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName;

                    if (route.name === 'HomeTab') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Search') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'Add') {
                        iconName = focused ? 'add-circle' : 'add-circle-outline';
                    } else if (route.name === 'Notifications') {
                        // AQUI! Usamos o novo componente para o ícone de notificações
                        return <NotificationIconWithBadge color={color} size={size} />;
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person' : 'person-outline';
                    }
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: Colors.primary, // Usando Colors do seu arquivo
                tabBarInactiveTintColor: Colors.textSecondary, // Usando Colors do seu arquivo
                tabBarStyle: {
                    backgroundColor: colors.card || Colors.card, // Prefere o tema, mas fallback para Colors
                    borderTopColor: colors.border || Colors.border, // Prefere o tema, mas fallback para Colors
                },
                tabBarHideOnKeyboard: true,
            })}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Início',
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    tabBarLabel: 'Buscar',
                }}
            />
            <Tab.Screen
                name="Add"
                component={AddContentScreen}
                options={{
                    tabBarLabel: '',
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarLabel: 'Notificações',
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStackNavigator} // Continua a usar o Stack Navigator
                options={{
                    tabBarLabel: 'Perfil',
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;