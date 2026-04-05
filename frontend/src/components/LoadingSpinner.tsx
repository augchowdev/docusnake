import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface Props {
  color?: string;
  size?: 'small' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({
  color = '#1a73e8',
  size = 'large',
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreen}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }
  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  inline: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
