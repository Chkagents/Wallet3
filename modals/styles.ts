import { borderColor, secondaryFontColor } from '../constants/styles';

import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    padding: 16,
    height: 420,
  },

  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },

  navTitle: {
    fontSize: 22,
    fontWeight: '500',
    paddingEnd: 4,
    color: borderColor,
  },
});
