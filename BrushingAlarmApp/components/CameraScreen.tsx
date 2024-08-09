import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface CameraScreenProps {
  onPictureTaken: (photoUri: string) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ onPictureTaken }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      onPictureTaken(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Take Picture" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CameraScreen;
