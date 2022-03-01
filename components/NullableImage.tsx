import React, { useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';

import Image from 'react-native-expo-cached-image';
import { genColor } from '../utils/emoji';

interface Props {
  uri?: string;
  size?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  imageRadius?: number;
  imageBackgroundColor: string;
  containerStyle?: StyleProp<ViewStyle>;
  fontStyle?: StyleProp<ViewStyle>;
}

export default ({
  uri,
  text,
  size,
  width,
  height,
  containerStyle,
  fontSize,
  fontStyle,
  imageRadius,
  imageBackgroundColor,
}: Props) => {
  const [iconFailed, setIconFailed] = useState(uri ? false : true);
  const [defaultColor] = useState(genColor());

  width = width ?? size;
  height = height ?? size;

  return (
    <View style={{ position: 'relative', minWidth: width, minHeight: height, ...(containerStyle || ({} as any)) }}>
      {iconFailed && (
        <View
          style={{
            width,
            height,
            position: 'absolute',
            borderRadius: (width || size || 0) / 2,
            backgroundColor: defaultColor,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize, fontWeight: '600', ...(fontStyle || ({} as any)) }}>{text?.[0]}</Text>
        </View>
      )}

      {iconFailed ? undefined : (
        <Image
          source={{ uri }}
          onError={() => setIconFailed(true)}
          style={{
            width,
            height,
            borderRadius: imageRadius,
            backgroundColor: iconFailed ? undefined : imageBackgroundColor,
          }}
        />
      )}
    </View>
  );
};
