import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';

import HomeScreen from '../screens/app/HomeScreen';
import DocumentsScreen from '../screens/app/DocumentsScreen';
import DocumentDetailScreen from '../screens/app/DocumentDetailScreen';
import ScanScreen from '../screens/app/ScanScreen';
import FoldersScreen from '../screens/app/FoldersScreen';
import FolderDetailScreen from '../screens/app/FolderDetailScreen';

export type DocumentsStackParamList = {
  DocumentsList: undefined;
  DocumentDetail: { documentId: string };
};

export type FoldersStackParamList = {
  FoldersList: undefined;
  FolderDetail: { folderId: string; folderName: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  DocumentDetail: { documentId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  DocumentsTab: undefined;
  ScanTab: undefined;
  FoldersTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const DocsStack = createStackNavigator<DocumentsStackParamList>();
const FolderStack = createStackNavigator<FoldersStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

const tabIcon = (name: string) => () => (
  <Text style={{ fontSize: 22 }}>{name}</Text>
);

const DocumentsStackNavigator: React.FC = () => (
  <DocsStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1a73e8' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <DocsStack.Screen
      name="DocumentsList"
      component={DocumentsScreen}
      options={{ title: 'Documents' }}
    />
    <DocsStack.Screen
      name="DocumentDetail"
      component={DocumentDetailScreen}
      options={{ title: 'Document' }}
    />
  </DocsStack.Navigator>
);

const FoldersStackNavigator: React.FC = () => (
  <FolderStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1a73e8' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <FolderStack.Screen
      name="FoldersList"
      component={FoldersScreen}
      options={{ title: 'Folders' }}
    />
    <FolderStack.Screen
      name="FolderDetail"
      component={FolderDetailScreen}
      options={({ route }) => ({ title: route.params.folderName })}
    />
  </FolderStack.Navigator>
);

const HomeStackNavigator: React.FC = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1a73e8' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <HomeStack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ title: 'Docusnake' }}
    />
    <HomeStack.Screen
      name="DocumentDetail"
      component={DocumentDetailScreen}
      options={{ title: 'Document' }}
    />
  </HomeStack.Navigator>
);

const AppNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#1a73e8',
      tabBarInactiveTintColor: '#80868b',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#e0e0e0',
        height: 60,
        paddingBottom: 8,
      },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{ title: 'Home', tabBarIcon: tabIcon('🏠') }}
    />
    <Tab.Screen
      name="DocumentsTab"
      component={DocumentsStackNavigator}
      options={{ title: 'Documents', tabBarIcon: tabIcon('📄') }}
    />
    <Tab.Screen
      name="ScanTab"
      component={ScanScreen}
      options={{ title: 'Scan', tabBarIcon: tabIcon('📷') }}
    />
    <Tab.Screen
      name="FoldersTab"
      component={FoldersStackNavigator}
      options={{ title: 'Folders', tabBarIcon: tabIcon('📁') }}
    />
  </Tab.Navigator>
);

export default AppNavigator;
