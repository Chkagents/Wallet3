import * as Animatable from 'react-native-animatable';
import * as Linking from 'expo-linking';

import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation, WebViewProps } from 'react-native-webview';

import { Account } from '../../viewmodels/account/Account';
import AccountSelector from '../../modals/dapp/AccountSelector';
import App from '../../viewmodels/App';
import Avatar from '../../components/Avatar';
import { BlurView } from 'expo-blur';
import DeviceInfo from 'react-native-device-info';
import GetPageMetadata from './scripts/Metadata';
import HookWalletConnect from './scripts/InjectWalletConnectObserver';
import { INetwork } from '../../common/Networks';
import { JS_POST_MESSAGE_TO_PROVIDER } from './scripts/Utils';
import LinkHub from '../../viewmodels/hubs/LinkHub';
import MetamaskMobileProvider from './scripts/Metamask-mobile-provider';
import { Modalize } from 'react-native-modalize';
import Networks from '../../viewmodels/Networks';
import { NetworksMenu } from '../../modals';
import { Portal } from 'react-native-portalize';
import Theme from '../../viewmodels/settings/Theme';
import WalletConnectLogo from '../../assets/3rd/walletconnect.svg';
import WalletConnectV1ClientHub from '../../viewmodels/walletconnect/WalletConnectV1ClientHub';
import { generateNetworkIcon } from '../../assets/icons/networks/color';
import hub from '../../viewmodels/hubs/InpageMetamaskDAppHub';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import { useModalize } from 'react-native-modalize/lib/utils/use-modalize';

export interface PageMetadata {
  icon: string;
  title: string;
  origin: string;
  hostname: string;
  desc?: string;
  themeColor: string | null;
}

interface ConnectedBrowserDApp {
  origin: string;
  lastUsedChainId: string;
  lastUsedAccount: string;
  isWalletConnect?: boolean;
}

interface Web3ViewProps extends WebViewProps {
  onMetadataChange?: (metadata: PageMetadata) => void;
  onGoHome?: () => void;
  expanded?: boolean;
  onShrinkRequest?: (webUrl: string) => void;
  onExpandRequest?: (webUrl: string) => void;
  onBookmarksPress?: () => void;

  webViewRef: React.Ref<WebView>;
}

export default observer((props: Web3ViewProps) => {
  const { t } = i18n;
  const { webViewRef } = props;
  const [appName] = useState(`Wallet3/${DeviceInfo.getVersion() || '0.0.0'}`);
  const [ua] = useState(
    DeviceInfo.isTablet()
      ? `Mozilla/5.0 (iPad; CPU OS 15_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/98.0.4758.85 Mobile/15E148 Safari/604.1 ${appName}`
      : `Mozilla/5.0 (iPhone; CPU iPhone OS 15_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/98.0.4758.85 Mobile/15E148 Safari/604.1 ${appName}`
  );

  const { bottom: safeAreaBottom } = useSafeAreaInsets();
  const { onMetadataChange, onGoHome, expanded, onShrinkRequest, onExpandRequest, onBookmarksPress } = props;

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const [pageMetadata, setPageMetadata] = useState<PageMetadata>();
  const [appNetwork, setAppNetwork] = useState<INetwork>();
  const [appAccount, setAppAccount] = useState<Account>();
  const [dapp, setDApp] = useState<ConnectedBrowserDApp | undefined>();
  const [webUrl, setWebUrl] = useState('');
  const { mode, foregroundColor, isLightMode, backgroundColor, borderColor, systemBorderColor } = Theme;

  const updateDAppState = (dapp?: ConnectedBrowserDApp) => {
    setDApp(dapp);

    setAppNetwork(Networks.find(dapp?.lastUsedChainId ?? -1));
    setAppAccount(App.findAccount(dapp?.lastUsedAccount ?? ''));
  };

  const updateGlobalState = () => {
    const hostname = (Linking.parse(webUrl || 'http://').hostname ?? dapp?.origin) || '';
    if (dapp?.origin === hostname) return;

    const wcApp = WalletConnectV1ClientHub.find(hostname);

    if (wcApp && wcApp.isMobileApp) {
      updateDAppState({
        lastUsedChainId: wcApp.lastUsedChainId,
        lastUsedAccount: wcApp.lastUsedAccount,
        origin: wcApp.origin,
        isWalletConnect: true,
      });

      wcApp.once('disconnect', () => {
        // console.log(dapp?.origin, wcApp.origin);
        // if (!dapp?.isWalletConnect) return;
        // if (dapp.origin !== origin) return;

        updateDAppState(undefined);
      });

      return;
    }

    hub.getDApp(hostname).then((app) => updateDAppState(app));
  };

  useEffect(() => {
    const notifyWebView = async (appState) => {
      const webview = (webViewRef as any).current as WebView;
      webview?.injectJavaScript(JS_POST_MESSAGE_TO_PROVIDER(appState));
      updateDAppState(await hub.getDApp(appState.origin));
    };

    hub.on('appChainUpdated_metamask', notifyWebView);
    hub.on('appAccountUpdated_metamask', notifyWebView);

    hub.on('dappConnected', (app) => updateDAppState(app));

    WalletConnectV1ClientHub.on('mobileAppConnected', () => {
      updateGlobalState();
    });

    if (pageMetadata) ((webViewRef as any)?.current as WebView)?.injectJavaScript(`${GetPageMetadata}\ntrue;`);

    return () => {
      hub.removeAllListeners();
      WalletConnectV1ClientHub.removeAllListeners();
    };
  }, [webUrl]);

  useEffect(() => updateGlobalState(), [webUrl]);

  const onMessage = async (e: WebViewMessageEvent) => {
    let data: { type: string; payload: any; origin?: string; pageMetadata?: PageMetadata; name?: string; data: any };

    try {
      data = JSON.parse(e.nativeEvent.data);
    } catch (error) {
      return;
    }

    switch (data.type ?? data.name) {
      case 'metadata':
        onMetadataChange?.(data.payload);
        setPageMetadata(data.payload);
        break;
      case 'wcuri':
        LinkHub.handleURL(data.payload.uri, {
          fromMobile: true,
          hostname: Linking.parse(pageMetadata?.origin ?? 'https://').hostname ?? '',
        });
        break;
      case 'metamask-provider':
        const resp = await hub.handle(data.origin!, { ...data.data, pageMetadata });

        const webview = (webViewRef as any).current as WebView;
        webview?.injectJavaScript(JS_POST_MESSAGE_TO_PROVIDER(resp));
        break;
    }
  };

  const onNavigationStateChange = (event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
    setCanGoForward(event.canGoForward);
    setWebUrl(event.url);

    props?.onNavigationStateChange?.(event);
  };

  const updateDAppNetworkConfig = (network: INetwork) => {
    if (dapp?.isWalletConnect) {
      WalletConnectV1ClientHub.find(dapp.origin)?.setLastUsedChain(network.chainId, true);
      updateDAppState({ ...dapp!, lastUsedChainId: `${network.chainId}` });
    } else {
      hub.setDAppChainId(dapp?.origin!, network.chainId);
    }

    closeNetworksModal();
  };

  const updateDAppAccountConfig = (account: string) => {
    if (dapp?.isWalletConnect) {
      WalletConnectV1ClientHub.find(dapp.origin)?.setLastUsedAccount(account, true);
      updateDAppState({ ...dapp!, lastUsedAccount: account });
    } else {
      hub.setDAppAccount(dapp?.origin!, account);
    }

    closeAccountsModal();
  };

  const tintColor = isLightMode ? '#000000c0' : foregroundColor;
  const { ref: networksRef, open: openNetworksModal, close: closeNetworksModal } = useModalize();
  const { ref: accountsRef, open: openAccountsModal, close: closeAccountsModal } = useModalize();

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <WebView
        {...props}
        ref={webViewRef}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior={'never'}
        contentInset={{ bottom: expanded ? 37 + (safeAreaBottom === 0 ? 8 : 0) : 0 }}
        onNavigationStateChange={onNavigationStateChange}
        userAgent={ua}
        allowsFullscreenVideo={false}
        forceDarkOn={mode === 'dark'}
        injectedJavaScript={`${GetPageMetadata}\ntrue;\n${HookWalletConnect}\ntrue;`}
        onMessage={onMessage}
        mediaPlaybackRequiresUserAction
        pullToRefreshEnabled
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures
        injectedJavaScriptBeforeContentLoaded={`${MetamaskMobileProvider}\ntrue;`}
        style={{ backgroundColor }}
      />

      <Animatable.View
        animation="fadeInUp"
        style={{ bottom: 0, left: 0, right: 0, position: expanded ? 'absolute' : 'relative' }}
      >
        <BlurView
          intensity={isLightMode ? 25 : 75}
          tint={mode}
          style={{
            ...styles.blurView,
            paddingVertical: safeAreaBottom === 0 ? 4 : undefined,
            borderTopWidth: expanded ? 0 : 0.33,
            shadowOpacity: expanded ? 0.25 : 0,
            borderTopColor: systemBorderColor,
          }}
        >
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            {expanded ? (
              <TouchableOpacity style={styles.navTouchableItem} onPress={() => onShrinkRequest?.(webUrl)}>
                <MaterialCommunityIcons name="arrow-collapse-vertical" size={20} color={tintColor} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{ ...styles.navTouchableItem, paddingTop: 10, paddingBottom: 9 }}
                onPress={() => onExpandRequest?.(webUrl)}
              >
                <MaterialCommunityIcons name="arrow-expand" size={19} color={tintColor} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.navTouchableItem} onPress={onBookmarksPress}>
              <Feather name="book-open" size={20} color={tintColor} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' }}>
            <TouchableOpacity
              style={styles.navTouchableItem}
              onPress={() => ((webViewRef as any)?.current as WebView)?.goBack()}
              disabled={!canGoBack}
            >
              <Ionicons name="chevron-back-outline" size={22} color={canGoBack ? tintColor : '#dddddd50'} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navTouchableItem} onPress={onGoHome}>
              <MaterialIcons name="radio-button-off" size={22} color={tintColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTouchableItem}
              onPress={() => ((webViewRef as any)?.current as WebView)?.goForward()}
              disabled={!canGoForward}
            >
              <Ionicons name="chevron-forward-outline" size={22} color={canGoForward ? tintColor : '#dddddd50'} />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
            {appAccount && (
              <Animatable.View animation={'fadeInUp'}>
                <TouchableOpacity style={{ paddingHorizontal: 8, marginBottom: -0.5 }} onPress={() => openAccountsModal()}>
                  <Avatar
                    size={25}
                    uri={appAccount?.avatar}
                    emoji={appAccount?.emojiAvatar}
                    emojiSize={11}
                    backgroundColor={appAccount?.emojiColor}
                  />
                </TouchableOpacity>
              </Animatable.View>
            )}

            {dapp && appNetwork ? (
              <Animatable.View animation={'fadeInUp'} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => openNetworksModal()}
                  style={{ paddingStart: 16, paddingEnd: 10, position: 'relative' }}
                >
                  {generateNetworkIcon({
                    chainId: appNetwork.chainId,
                    color: `${appNetwork.color}`,
                    width: 23,
                    style: {},
                    hideEVMTitle: true,
                  })}

                  {dapp?.isWalletConnect ? (
                    <WalletConnectLogo width={9} height={9} style={{ position: 'absolute', right: 5, bottom: -4 }} />
                  ) : undefined}
                </TouchableOpacity>
              </Animatable.View>
            ) : undefined}
          </View>
        </BlurView>
      </Animatable.View>

      <Portal>
        <Modalize
          ref={networksRef}
          adjustToContentHeight
          disableScrollIfPossible
          modalStyle={{ borderTopStartRadius: 7, borderTopEndRadius: 7 }}
          scrollViewProps={{ showsVerticalScrollIndicator: false, scrollEnabled: false }}
        >
          <NetworksMenu
            title={t('modal-dapp-switch-network', { app: pageMetadata?.title?.split(' ')?.[0] ?? '' })}
            networks={Networks.all}
            selectedNetwork={appNetwork}
            onNetworkPress={(network) => updateDAppNetworkConfig(network)}
          />
        </Modalize>

        <Modalize
          ref={accountsRef}
          adjustToContentHeight
          disableScrollIfPossible
          modalStyle={{ borderTopStartRadius: 7, borderTopEndRadius: 7 }}
          scrollViewProps={{ showsVerticalScrollIndicator: false, scrollEnabled: false }}
        >
          <SafeAreaProvider style={{ backgroundColor, borderTopStartRadius: 6, borderTopEndRadius: 6 }}>
            <AccountSelector
              single
              accounts={App.allAccounts}
              selectedAccounts={appAccount ? [appAccount.address] : []}
              style={{ padding: 16, height: 430 }}
              expanded
              themeColor={appNetwork?.color}
              onDone={([account]) => updateDAppAccountConfig(account)}
            />
          </SafeAreaProvider>
        </Modalize>
      </Portal>
    </View>
  );
});

const styles = StyleSheet.create({
  blurView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,

    shadowColor: `#00000060`,
    shadowOffset: {
      width: 0,
      height: -2,
    },

    shadowRadius: 3.14,

    elevation: 5,
    borderTopColor: 'rgb(216, 216, 216)',
  },

  navTouchableItem: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
});
