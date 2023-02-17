import Animated, { FadeInUp } from 'react-native-reanimated';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, FlatList as SystemFlatList, Text, View } from 'react-native';
import { getScreenCornerRadius, useOptimizedCornerRadius } from '../../../utils/hardware';

import DeviceSelector from './DeviceSelector';
import ModalRootContainer from '../../core/ModalRootContainer';
import Preparations from './Preparations';
import { ReactiveScreen } from '../../../utils/device';
import { Service } from 'react-native-zeroconf';
import { ShardReceiver } from '../../../viewmodels/tss/ShardReceiver';
import ShardReceiving from './ShardReceiving';
import Theme from '../../../viewmodels/settings/Theme';
import i18n from '../../../i18n';
import { observer } from 'mobx-react-lite';

const { FlatList } = Animated;

export default observer(() => {
  const { t } = i18n;
  const { backgroundColor, foregroundColor, textColor, appColor } = Theme;

  const screenRadius = useOptimizedCornerRadius();
  const [vm, setVM] = useState<ShardReceiver>();
  const [step, setStep] = useState(0);

  const titleList = useRef<SystemFlatList>(null);
  const titles = [
    t('multi-sig-modal-title-welcome'),
    t('multi-sig-modal-title-devices-pairing'),
    t('multi-sig-modal-title-key-distribution'),
  ];

  const renderTitle = ({ item }: { item: string }) => {
    return (
      <Text
        style={{
          fontSize: 25,
          fontWeight: '700',
          color: textColor,
        }}
      >
        {item}
      </Text>
    );
  };

  const goToReceiving = (service: Service) => {
    setVM(new ShardReceiver(service));
    goTo(2);
  };

  const goTo = (step: number) => {
    setStep(step);
    titleList.current?.scrollToIndex({ animated: true, index: step });
  };

  useEffect(() => () => vm?.dispose(), [vm]);

  return (
    <ModalRootContainer>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={titleList as any}
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 0, justifyContent: 'center', alignItems: 'center' }}
          data={titles}
          renderItem={renderTitle}
          style={{ flexGrow: 0, height: 32, marginBottom: 12, marginTop: screenRadius ? 4 : 0 }}
          entering={FadeInUp.delay(300).springify()}
        />

        <View style={{ flex: 1, width: ReactiveScreen.width - 12, marginHorizontal: -16 }}>
          {step === 0 && <Preparations onNext={() => goTo(1)} />}
          {step === 1 && <DeviceSelector onNext={(s) => goToReceiving(s)} />}
          {step === 2 && vm && <ShardReceiving vm={vm} />}
        </View>
      </View>
    </ModalRootContainer>
  );
});
