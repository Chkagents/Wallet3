import React, { useRef, useState } from 'react';

import AwaitablePasspad from '../views/AwaitablePasspad';
import { BioType } from '../../viewmodels/auth/Authentication';
import { Passpad } from '../views';
import { RawTransactionRequest } from '../../viewmodels/transferring/RawTransactionRequest';
import RequestReview from '../dapp/RequestReview';
import { SafeViewContainer } from '../../components';
import Swiper from 'react-native-swiper';

interface Props {
  themeColor?: string;
  vm: RawTransactionRequest;
  app: { icon: string; name: string; verified?: boolean };
  onApprove: (pin?: string) => Promise<boolean>;
  onReject: () => void;
  bioType?: BioType;
  networkBusy?: boolean;
}

export default ({ themeColor, vm, app, onApprove, onReject, bioType, networkBusy }: Props) => {
  const swiper = useRef<Swiper>(null);

  const approve = async () => {
    if (!bioType) {
      swiper.current?.scrollTo(1);
      return;
    }

    if (await onApprove()) return;

    swiper.current?.scrollTo(1);
  };

  return (
    <Swiper
      ref={swiper}
      showsPagination={false}
      showsButtons={false}
      scrollEnabled={false}
      loop={false}
      automaticallyAdjustContentInsets
    >
      <RequestReview vm={vm} app={app} onReject={onReject} onApprove={approve} account={vm.account} bioType={bioType} />

      <AwaitablePasspad
        themeColor={themeColor}
        onCodeEntered={(c) => onApprove(c)}
        onCancel={() => swiper.current?.scrollTo(0)}
      />
    </Swiper>
  );
};
