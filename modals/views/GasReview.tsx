import { Button, SafeViewContainer } from '../../components';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import AnimateNumber from 'react-native-animate-number';
import BackButton from '../components/BackButton';
import { BaseTransaction } from '../../viewmodels/transferring/BaseTransaction';
import Fire from '../../assets/icons/app/fire.svg';
import React from 'react';
import Theme from '../../viewmodels/settings/Theme';
import TxException from '../components/TxException';
import i18n from '../../i18n';
import { observer } from 'mobx-react-lite';
import styles from '../styles';

interface GasProps {
  onBack?: () => void;
  vm: BaseTransaction;
  themeColor?: string;
}

export default observer(({ onBack, vm, themeColor }: GasProps) => {
  const { t } = i18n;
  const { borderColor, textColor } = Theme;

  const reviewItemStyle = { ...styles.reviewItem, borderColor };
  const reviewItemsContainer = { ...styles.reviewItemsContainer, borderColor };
  const reviewItemValueStyle = { ...styles.reviewItemValue, color: textColor };

  return (
    <SafeViewContainer style={styles.container}>
      <View style={styles.navBar}>
        <BackButton onPress={onBack} color={themeColor} disabled={!vm.isValidGas} />

        <Text style={styles.navTitle}>{t('modal-review-fee')}</Text>
      </View>

      <View style={reviewItemsContainer}>
        <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
          <Text style={styles.reviewItemTitle}>{t('modal-gas-review-limit')}</Text>

          <TextInput
            keyboardType="number-pad"
            placeholder="21000"
            textAlign="right"
            style={{ ...reviewItemValueStyle, fontSize: 20 }}
            maxLength={12}
            defaultValue={`${vm.gasLimit}`}
            onChangeText={(txt) => vm.setGasLimit(txt)}
          />
        </View>

        <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
          <Text style={styles.reviewItemTitle}>{t('modal-gas-review-max-price')}</Text>

          <View style={{ marginBottom: -8 }}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder="20.00"
              textAlign="right"
              maxLength={12}
              style={{ ...reviewItemValueStyle, fontSize: 20 }}
              defaultValue={`${Number(vm.maxGasPrice.toFixed(5))}`}
              onChangeText={(txt) => vm.setMaxGasPrice(txt)}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              {vm.network.eip1559 ? <Fire width={8} height={8} style={{ marginEnd: 3 }} /> : undefined}
              {vm.network.eip1559 ? (
                <AnimateNumber
                  style={styles.gasGweiLabel}
                  value={vm.nextBlockBaseFee}
                  formatter={(val) => `${val.toFixed(6)} Gwei`}
                />
              ) : (
                <Text style={styles.gasGweiLabel}>Gwei</Text>
              )}
            </View>
          </View>
        </View>

        {vm.network.eip1559 ? (
          <View style={{ ...reviewItemStyle, paddingBottom: 12 }}>
            <Text style={styles.reviewItemTitle}>{t('modal-gas-review-priority-price')}</Text>

            <View style={{ marginBottom: -8 }}>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="1.00"
                textAlign="right"
                maxLength={12}
                style={{ ...reviewItemValueStyle, fontSize: 20 }}
                defaultValue={`${Number(vm.maxPriorityPrice.toFixed(6))}`}
                onChangeText={(txt) => vm.setPriorityPrice(txt)}
              />
              <Text style={{ ...styles.gasGweiLabel, marginTop: -2 }}>Gwei</Text>
            </View>
          </View>
        ) : undefined}

        <View style={{ ...reviewItemStyle, borderBottomWidth: 0, paddingBottom: 12 }}>
          <Text style={styles.reviewItemTitle}>{t('modal-gas-review-nonce')}</Text>

          <TextInput
            keyboardType="number-pad"
            placeholder="0"
            textAlign="right"
            style={{ ...reviewItemValueStyle, fontSize: 20 }}
            maxLength={12}
            defaultValue={`${vm.nonce}`}
            onChangeText={(txt) => vm.setNonce(txt)}
          />
        </View>
      </View>

      <View style={{ ...reviewItemsContainer, flexDirection: 'row' }}>
        <TouchableOpacity style={styles.gasItem} onPress={() => vm.setGas('rapid')}>
          <Ionicons name="rocket" size={12} color="tomato" />
          <Text style={{ ...styles.gasItemText, color: 'tomato' }}>{t('modal-gas-review-rapid')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gasItem} onPress={() => vm.setGas('fast')}>
          <Ionicons name="car-sport" size={13} color="dodgerblue" />
          <Text style={{ ...styles.gasItemText, color: 'dodgerblue' }}>{t('modal-gas-review-fast')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gasItem} onPress={() => vm.setGas('standard')}>
          <FontAwesome5 name="walking" size={12} color="darkorchid" />
          <Text style={{ ...styles.gasItemText, color: 'darkorchid' }}>{t('modal-gas-review-standard')}</Text>
        </TouchableOpacity>
      </View>

      {!vm.isValidGas && <TxException exception={t('tip-invalid-gas-price')} />}

      <View style={{ flex: 1 }}></View>

      <Button
        title="OK"
        txtStyle={{ textTransform: 'uppercase' }}
        onPress={onBack}
        themeColor={themeColor}
        disabled={!vm.isValidGas}
      />
    </SafeViewContainer>
  );
});
