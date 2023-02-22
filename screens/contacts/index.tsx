import Contacts, { IContact } from '../../viewmodels/customs/Contacts';
import { EvilIcons, FontAwesome } from '@expo/vector-icons';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import React, { useState } from 'react';

import Avatar from '../../components/Avatar';
import { Confirm } from '../../modals/views/Confirm';
import ContactDetails from './ContactDetails';
import IllustrationNoData from '../../assets/illustrations/misc/nodata.svg';
import { Modalize } from 'react-native-modalize';
import ModalizeContainer from '../../modals/core/ModalizeContainer';
import { Portal } from 'react-native-portalize';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SquircleViewContainer from '../../components/SquircleViewContainer';
import Theme from '../../viewmodels/settings/Theme';
import { formatAddress } from '../../utils/formatter';
import i18n from '../../i18n';
import modalStyle from '../../modals/styles';
import { observer } from 'mobx-react-lite';
import { startLayoutAnimation } from '../../utils/animations';
import { useModalize } from 'react-native-modalize/lib/utils/use-modalize';

export default observer(() => {
  const { textColor, secondaryTextColor, backgroundColor } = Theme;
  const { t } = i18n;
  const [selectedContact, setSelectedContact] = useState<IContact>();
  const { ref: accountModal, open: openAccountModal, close: closeAccountModal } = useModalize();
  const { ref: confirmModal, open: openConfirmModal, close: closeConfirmModal } = useModalize();
  const [editing, setEditing] = useState(false);

  const renderItem = ({ item }: { item: IContact }) => {
    return (
      <View
        key={`${item.address}-${item.name}`}
        style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', flex: 1, alignItems: 'center' }}
          onPress={() => {
            setSelectedContact(item);
            setTimeout(() => openAccountModal(), 5);
          }}
        >
          <View style={{ marginEnd: 12, alignItems: 'center', justifyContent: 'center' }}>
            <EvilIcons
              name="user"
              size={43}
              color={secondaryTextColor}
              style={{ opacity: 0.5, position: 'absolute', marginStart: -11 }}
            />
            <Avatar size={32} emoji={item.emoji?.icon} backgroundColor={item.emoji?.color} uri={item.avatar} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontSize: 17 }} numberOfLines={1}>
              {item.name || item.ens || formatAddress(item.address)}
            </Text>

            <Text style={{ color: secondaryTextColor, fontSize: 12 }} numberOfLines={1}>
              {item.name || item.ens ? formatAddress(item.address) : t('contacts-no-more-info')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ padding: 12, marginEnd: -12 }}
          onPress={() => {
            setSelectedContact(item);
            setTimeout(() => openConfirmModal(), 5);
          }}
        >
          <FontAwesome name="trash-o" size={19} color={textColor} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {Contacts.sorted.length === 0 ? (
        <View style={{ alignSelf: 'center', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <IllustrationNoData width={150} height={150} />
        </View>
      ) : (
        <FlatList
          data={Contacts.sorted}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 4 }}
          keyExtractor={(i) => `${i.address}-${i.name}`}
        />
      )}

      <Portal>
        <ModalizeContainer ref={accountModal} closeOnOverlayTap={!editing} safeAreaStyle={{ height: 430 }}>
          <SquircleViewContainer cornerRadius={18}>
            <ContactDetails
              contact={selectedContact}
              onEditing={setEditing}
              onSave={() => {
                closeAccountModal();
                startLayoutAnimation();
                Contacts.saveContact(selectedContact!);
              }}
            />
          </SquircleViewContainer>
        </ModalizeContainer>

        <ModalizeContainer ref={confirmModal} safeAreaStyle={{ height: 270 }}>
          <SquircleViewContainer cornerRadius={18}>
            <Confirm
              confirmButtonTitle={t('button-confirm')}
              desc={t('contacts-remote-confirm-desc')}
              themeColor="crimson"
              style={{ flex: 1 }}
              onConfirm={() => {
                closeConfirmModal();
                startLayoutAnimation();
                Contacts.remove(selectedContact!);
              }}
            />
          </SquircleViewContainer>
        </ModalizeContainer>
      </Portal>
    </View>
  );
});
