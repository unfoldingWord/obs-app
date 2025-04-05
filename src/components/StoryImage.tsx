import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  StyleProp,
  ImageStyle,
  ActivityIndicator,
  View,
  Text
} from 'react-native';
import { BundledImageKey } from '../core/bundledImageManager';
import * as FileSystem from 'expo-file-system';

interface StoryImageProps {
  /**
   * The image name from the bundled image keys
   */
  imageName: BundledImageKey;

  /**
   * Fallback URL to use if the image is not available locally
   */
  fallbackUrl: string;

  /**
   * Optional style to apply to the image
   */
  style?: StyleProp<ImageStyle>;

  /**
   * Alt text for accessibility
   */
  alt?: string;
}

/**
 * Renders a story image with fallback and loading states
 *
 * This component will:
 * 1. Try to load from local files first
 * 2. Fall back to the fallback URL if local file isn't available
 * 3. Handle loading states and errors
 * 4. Apply proper styling and accessibility
 */
export const StoryImage: React.FC<StoryImageProps> = ({
  imageName,
  fallbackUrl,
  style,
  alt = 'Story illustration'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSource, setImageSource] = useState<ImageSourcePropType>({ uri: fallbackUrl });

  // Check if image exists in local storage
  React.useEffect(() => {
    const checkLocalImage = async () => {
      try {
        // Check if the image is stored in the local file system
        const localPath = `${FileSystem.documentDirectory}stories/${imageName}.jpg`;
        const fileInfo = await FileSystem.getInfoAsync(localPath);

        if (fileInfo.exists) {
          // If the local file exists, use it
          setImageSource({ uri: `file://${localPath}` });
        } else {
          // Otherwise use the fallback URL
          setImageSource({ uri: fallbackUrl });
        }
      } catch (e) {
        console.error('Error checking for local image:', e);
        setImageSource({ uri: fallbackUrl });
      }
    };

    checkLocalImage();
  }, [imageName, fallbackUrl]);

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text>Unable to load image</Text>
        </View>
      )}

      <Image
        source={imageSource}
        style={[styles.image, style, (isLoading || hasError) && styles.hidden]}
        resizeMode="contain"
        accessible={true}
        accessibilityLabel={alt}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 5,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hidden: {
    opacity: 0,
  },
});
