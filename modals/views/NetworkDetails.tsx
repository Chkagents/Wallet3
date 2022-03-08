import { Button, SafeViewContainer } from '../../components';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { INetwork } from '../../common/Networks';
import Theme from '../../viewmodels/settings/Theme';
import { generateNetworkIcon } from '../../assets/icons/networks/color';
import { getUrls } from '../../common/RPC';
import i18n from '../../i18n';
import styles from '../styles';

export default ({ network, onDone }: { network?: INetwork; onDone: (network: INetwork) => void }) => {
  if (!network) return null;

  const [symbol, setSymbol] = useState('');
  const [explorer, setExplorer] = useState('');
  const [rpc, setRpc] = useState('');
  const [color, setColor] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!network) return;

    setName(network.network);
    setSymbol(network.symbol);
    setExplorer(network.explorer);
    setColor(network.color);
    setRpc(
      network.rpcUrls?.join(', ') ||
        getUrls(network.chainId)
          .map((url) =>
            url.includes('infura.io') || url.includes('alchemyapi.io')
              ? url
                  .split('/')
                  .slice(0, url.split('/').length - 1)
                  .join('/')
              : url
          )
          .join(', ') ||
        ''
    );
  }, [network]);

  const { t } = i18n;
  const { textColor, borderColor } = Theme;

  const reviewItemsContainer = { ...styles.reviewItemsContainer, borderColor };
  const reviewItemStyle = { ...styles.reviewItem, borderColor };
  const reviewItemValueStyle = { ...styles.reviewItemValue, color: textColor };
  const editable = network.isUserAdded ? true : false;

  return (
    <SafeViewContainer style={styles.container}>
      <View style={reviewItemsContainer}>
        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>{t('modal-dapp-add-new-network-network')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {generateNetworkIcon({ ...network, width: 17, height: 17, hideEVMTitle: true, style: { marginEnd: 8 } })}
            <TextInput
              editable={editable}
              style={{ ...reviewItemValueStyle, maxWidth: 180, color: color || network.color }}
              numberOfLines={1}
              defaultValue={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>{t('modal-dapp-add-new-network-chainid')}</Text>
          <Text style={{ ...reviewItemValueStyle, maxWidth: 180 }} numberOfLines={1}>
            {Number(network.chainId)}
          </Text>
        </View>

        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>{t('modal-dapp-add-new-network-currency')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              selectTextOnFocus
              editable={editable}
              style={{ ...reviewItemValueStyle, maxWidth: 180 }}
              numberOfLines={1}
              defaultValue={symbol}
              onChangeText={setSymbol}
            />
          </View>
        </View>

        {network.isUserAdded && (
          <View style={reviewItemStyle}>
            <Text style={styles.reviewItemTitle}>{t('modal-dapp-add-new-network-color')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                editable={editable}
                style={{ ...reviewItemValueStyle, maxWidth: 180 }}
                numberOfLines={1}
                defaultValue={color}
                maxLength={7}
                onChangeText={(txt) => setColor(txt.substring(0, 7).toUpperCase())}
              />
            </View>
          </View>
        )}

        <View style={reviewItemStyle}>
          <Text style={styles.reviewItemTitle}>RPC URLs</Text>
          <TextInput
            editable={true}
            style={{ ...reviewItemValueStyle, maxWidth: '70%', minWidth: 180, textAlign: 'right' }}
            numberOfLines={1}
            onChangeText={setRpc}
            defaultValue={rpc}
          />
        </View>

        <View style={{ ...reviewItemStyle, borderBottomWidth: 0 }}>
          <Text style={styles.reviewItemTitle} numberOfLines={1}>
            {t('modal-dapp-add-new-network-explorer')}
          </Text>
          <TextInput
            selectTextOnFocus
            editable={editable}
            style={{ ...reviewItemValueStyle, maxWidth: '70%' }}
            numberOfLines={1}
            onChangeText={setExplorer}
          >
            {explorer}
          </TextInput>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Button
        themeColor={color || network.color}
        disabled={!rpc?.startsWith('http') || !symbol.length || !explorer.length || !name.length}
        title="OK"
        txtStyle={{ textTransform: 'uppercase' }}
        onPress={() =>
          onDone({
            ...network,
            network: name.trim(),
            symbol: symbol.toUpperCase().trim(),
            color,
            explorer: explorer.trim(),
            rpcUrls: rpc
              .split(',')
              .map((url) => url.trim().split(/\s/))
              .flat()
              .map((i) => i.toLowerCase().trim())
              .filter((i) => i.startsWith('http')),
          })
        }
      />
    </SafeViewContainer>
  );
};
