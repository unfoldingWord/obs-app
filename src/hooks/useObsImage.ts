import { useEffect, useState } from 'react';
import { ImageSourcePropType } from 'react-native';

import placeholderImage from '../../assets/placeholder.png';

import { Reference } from '@/types/index';

// Import the placeholder image statically

function pad(num: number): string {
  return String(num).padStart(2, '0');
}

// This mimics the JS implementation using require.context
// TypeScript doesn't understand require.context well, so we use a cast
// @ts-ignore - Tell TypeScript to ignore the next line
const images = (require as any).context('../../assets/obs-images', true, /\.jpg$/);

// Create an object to store all image sources
const imageSources: Record<string, any> = {};

// Populate the imageSources map
try {
  // @ts-ignore - TypeScript doesn't understand the keys() method
  images.keys().forEach((key: string) => {
    // @ts-ignore - TypeScript doesn't understand how to call images
    imageSources[key] = images(key);
  });
} catch (error) {
  console.warn('Error loading image sources:', error);
}

export function getImage({ reference }: { reference: Reference }): ImageSourcePropType {
  try {
    const key = `./obs-en-${pad(reference.story)}-${pad(reference.frame)}.jpg`;
    return imageSources[key] || placeholderImage;
  } catch (error) {
    console.warn(
      `Failed to load image for story ${reference.story}, frame ${reference.frame}:`,
      error
    );
    return placeholderImage;
  }
}

interface UseObsImageProps {
  reference: Reference;
}

export function useObsImage({ reference }: UseObsImageProps): ImageSourcePropType {
  const [image, setImage] = useState<ImageSourcePropType>(getImage({ reference }));

  useEffect(() => {
    // Update image when reference changes
    setImage(getImage({ reference }));
  }, [reference.story, reference.frame]);

  return image;
}
