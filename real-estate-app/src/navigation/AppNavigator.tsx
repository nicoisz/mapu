import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme';
import { HomeScreen } from '../screens/home';
import { SearchDemoScreen } from '../screens/SearchDemoScreen';
import { MapDemoScreen } from '../screens/MapDemoScreen';
import { DashboardScreen } from '../screens/dashboard';
import { DemoScreen } from '../screens/DemoScreen';
import { PropertyDetailNavigationWrapper } from '../screens/property/PropertyDetailNavigationWrapper';
import { OnboardingFlow } from '../screens/onboarding/OnboardingFlow';
import { AuthScreen } from '../screens/auth';
import { RootStackParamList, MainTabParamList, SCREEN_NAMES } from './types';

const RootStack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.primary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name={SCREEN_NAMES.HOME}
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: () => '🏠',
          headerShown: false, // Hide header since HomeScreen has its own search bar
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.SEARCH}
        component={SearchDemoScreen}
        options={{
          title: 'Buscar',
          tabBarIcon: () => '🔍',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.MAP}
        component={MapDemoScreen}
        options={{
          title: 'Mapa',
          tabBarIcon: () => '🗺️',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.DASHBOARD}
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: () => '📊',
        }}
      />
      <Tab.Screen
        name={SCREEN_NAMES.PROFILE}
        component={DemoScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: () => '👤',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Stack Navigator
interface AppNavigatorProps {
  initialRouteName?: keyof RootStackParamList;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({ initialRouteName }) => {
  return (
    <RootStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        gestureEnabled: true,
      }}
    >
      <RootStack.Screen
        name={SCREEN_NAMES.ONBOARDING}
        component={OnboardingFlow}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.AUTH}
        component={AuthScreen}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.MAIN}
        component={MainTabNavigator}
        options={{
          gestureEnabled: false, // Prevent swipe back from main app
        }}
      />
      <RootStack.Screen
        name={SCREEN_NAMES.PROPERTY_DETAIL}
        component={PropertyDetailNavigationWrapper}
        options={{
          headerShown: true,
          title: 'Detalle de Propiedad',
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </RootStack.Navigator>
  );
};