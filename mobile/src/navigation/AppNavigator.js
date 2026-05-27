// mobile/src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { selectIsAuthenticated } from '../store/slices/userSlice';
import { useTheme } from '../theme/ThemeContext';
import { COLORS, DARK_COLORS } from '../constants/colors';

import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import ResultsScreen from '../screens/ResultsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import DetailScreen from '../screens/DetailScreen';
import SearchScreen from '../screens/SearchScreen';
import InfoScreen from '../screens/InfoScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home';
              break;
            case 'ScanTab':
              iconName = focused ? 'camera-alt' : 'camera-alt';
              break;
            case 'HistoryTab':
              iconName = focused ? 'history' : 'history';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person';
              break;
            default:
              iconName = 'circle';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: isDark ? '#606070' : COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: isDark ? '#16213e' : COLORS.surface,
          borderTopColor: isDark ? '#2a2a4a' : COLORS.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'Главная' }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanScreen}
        options={{ tabBarLabel: 'Сканировать' }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ tabBarLabel: 'История' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { isDark } = useTheme();
  
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: isDark ? '#16213e' : COLORS.primary,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Scan"
          component={ScanScreen}
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            title: 'Результаты анализа',
            headerStyle: {
              backgroundColor: isDark ? '#16213e' : COLORS.primary,
            },
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'История сканирований' }}
        />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ title: 'Детали добавки' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: 'Профиль' }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            title: 'Вход',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Поиск добавок' }}
        />
        <Stack.Screen
          name="Info"
          component={InfoScreen}
          options={{ title: 'О E-кодах' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;