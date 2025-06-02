import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import SearchScreen from './SearchScreen';
import AddContentScreen from './AddContentScreen';
import ProfileScreen from './ProfileScreen';
import Colors from './constants/Colors';

const Tab = createBottomTabNavigator();

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'AddContent') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomColor: Colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Sparkr',
          headerShown: true
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ 
          title: 'Buscar',
          headerShown: true
        }}
      />
      <Tab.Screen 
        name="AddContent" 
        component={AddContentScreen} 
        options={{ 
          title: 'Novo Post',
          headerShown: true
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Perfil',
          headerShown: false
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;
