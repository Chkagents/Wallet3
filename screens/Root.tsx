import { Dimensions, Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';

import BrowserScreen from './browser';
import DAppsScreen from './dapps';
import Drawer from './drawer';
import { DrawerNavigationHelpers } from '@react-navigation/drawer/lib/typescript/src/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Networks from '../viewmodels/Networks';
import SettingScreen from './settings';
import Theme from '../viewmodels/settings/Theme';
import WalletScreen from './wallet';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import i18n from '../i18n';
import { observer } from 'mobx-react-lite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DrawerRoot = createDrawerNavigator();
const TabNavigation = createBottomTabNavigator();
const ScreenWidth = Dimensions.get('window').width;

type RootStackParamList = {
  Home: undefined;
  QRScan: undefined;
  Portfolio: undefined;
};

const RootTab = observer(() => {
  const { t } = i18n;
  const { current } = Networks;
  const navigation = useNavigation() as DrawerNavigationHelpers;
  const { Navigator, Screen } = TabNavigation;
  const { bottom, top } = useSafeAreaInsets();
  let { foregroundColor, backgroundColor, systemBorderColor, borderColor, isLightMode } = Theme;

  foregroundColor = isLightMode ? foregroundColor : current.color;
  const baseTarBarStyle = { backgroundColor, borderTopColor: systemBorderColor };
  const tabBarStyle = bottom === 0 ? { ...baseTarBarStyle, height: 57 } : baseTarBarStyle;

  return (
    <Navigator
      initialRouteName="Wallet"
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: current.color,
        tabBarInactiveTintColor: 'gray',
        tabBarLabelStyle: { marginBottom: bottom === 0 ? 7 : 3, marginTop: -3 },
        tabBarStyle,
        headerStyle: { backgroundColor },
        tabBarLabelPosition: 'below-icon',
        tabBarIcon: ({ focused, size }) => {
          const icons = {
            Wallet: 'credit-card',
            Explore: 'compass',
            FashionWallet: 'credit-card',
          };

          return <Feather name={icons[route.name]} size={size} color={focused ? current.color : 'gray'} />;
        },
      })}
    >
      <Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: t('home-tab-wallet'),
          header: () => (
            <View
              style={{
                paddingTop: top + 4,
                paddingBottom: 7,
                backgroundColor,
                flexDirection: 'row',
                alignItems: 'center',
                borderBottomColor: systemBorderColor,
                borderBottomWidth: 0.33,
              }}
            >
              <TouchableOpacity
                style={{ padding: 16, paddingVertical: 4 }}
                onPress={() => navigation.dispatch(DrawerActions.openDrawer)}
              >
                <Feather name="menu" size={20} color={foregroundColor} style={{}} />
              </TouchableOpacity>

              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => PubSub.publish('openAccountsMenu')}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 0 }}
                >
                  <Text style={{ fontFamily: 'Questrial', fontSize: 21, color: foregroundColor }}>Wallet 3</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('QRScan')}
                style={{
                  zIndex: 5,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  paddingStart: 13,
                  paddingVertical: 5,
                  paddingEnd: 15,
                }}
              >
                <Ionicons name="scan-outline" size={21} color={foregroundColor} />
                <View
                  style={{
                    position: 'absolute',
                    left: 2,
                    right: 4.5,
                    height: 1.2,
                    marginEnd: 15,
                    marginStart: 14,
                    backgroundColor: foregroundColor,
                  }}
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <Screen
        name="Explore"
        component={BrowserScreen}
        options={{
          tabBarLabel: 'Web3',
          headerShown: false,
          tabBarStyle,
        }}
      />
    </Navigator>
  );
});

export default observer(({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) => {
  const { Navigator, Screen } = DrawerRoot;
  const { t } = i18n;
  const { backgroundColor, foregroundColor, borderColor } = Theme;
  const [swipeEnabled, setSwipeEnabled] = useState(true);

  useEffect(() => {
    PubSub.subscribe('drawer-swipeEnabled', (_, data) => setSwipeEnabled(data));

    return () => {
      PubSub.unsubscribe('drawer-swipeEnabled');
    };
  }, []);

  return (
    <Navigator
      initialRouteName="Home"
      drawerContent={Drawer}
      screenOptions={{
        sceneContainerStyle: { backgroundColor: backgroundColor },
        headerTransparent: false,
        headerTintColor: foregroundColor,
        swipeEdgeWidth: ScreenWidth * 0.25,
        swipeEnabled,
        drawerType: 'slide',
        headerBackgroundContainerStyle: { borderBottomColor: borderColor },
        headerStyle: { backgroundColor, borderBottomColor: borderColor },
        headerLeft: () => (
          <TouchableOpacity
            style={{ padding: 16, paddingVertical: 0 }}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer)}
          >
            <Feather name="menu" size={20} color={foregroundColor} style={{}} />
          </TouchableOpacity>
        ),
      }}
    >
      <Screen name="Home" component={RootTab} options={{ headerShown: false }} />

      <Screen name="Settings" component={SettingScreen} options={{ title: t('home-drawer-settings') }} />
      <Screen name="DApps" component={DAppsScreen} options={{ title: t('connectedapps-title') }} />
    </Navigator>
  );
});
