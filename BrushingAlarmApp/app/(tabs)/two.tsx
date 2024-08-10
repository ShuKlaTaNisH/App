import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import CameraScreen from '@/components/CameraScreen'; // Adjust the import according to your project structure
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as FileSystem from 'expo-file-system';

const AlarmScreen = () => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/alarm.mp3')
        );
        setSound(sound);
        console.log('Sound loaded successfully');
      } catch (error) {
        console.error('Failed to load sound', error);
        Alert.alert('Error', 'Failed to load alarm sound. Please restart the app.');
      }
    };

    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(async () => {
      if (sound) {
        console.log('Attempting to play sound');
        try {
          await sound.playAsync();
          setAlarmActive(true);
          console.log('Sound playback succeeded');
        } catch (error) {
          console.log('Sound playback failed', error);
          Alert.alert('Error', 'Failed to play alarm sound. Please check your device settings.');
        }
      }
    });

    return () => subscription.remove();
  }, [sound]);

  const setAlarm = async () => {
    const trigger = new Date(date.getTime());
    const now = Date.now();
    const delay = trigger.getTime() - now;

    if (delay <= 0) {
      Alert.alert("Invalid Time", "Please select a future time for the alarm.");
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Brushing Alarm",
          body: "Time to brush your teeth!",
          sound: true,
        },
        trigger: {
          seconds: Math.floor(delay / 1000),
        },
      });

      Alert.alert('Alarm Set', `Alarm set for ${date.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Failed to set alarm', error);
      Alert.alert('Error', 'Failed to set the alarm. Please try again.');
    }
  };

  const stopAlarm = async (photoUri: string) => {
    setIsLoading(true);
    try {
      const isToothbrushPresent = await checkToothbrushWithGeminiAI(photoUri);
      if (isToothbrushPresent) {
        await sound?.stopAsync();
        setAlarmActive(false);
        Alert.alert('Alarm Stopped', 'Good job! You can stop brushing now.');
      } else {
        Alert.alert('Try Again', 'No toothbrush detected. Please try again with a clear image of your toothbrush.');
      }
    } catch (error) {
      console.error('Error in stopAlarm:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again or stop the alarm manually.');
    } finally {
      setIsLoading(false);
      setShowCamera(false);
    }
  };

  const checkToothbrushWithGeminiAI = async (photoUri: string): Promise<boolean> => {
    try {
      const base64ImageData = await FileSystem.readAsStringAsync(photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const genAI = new GoogleGenerativeAI(''); // Replace with your actual API key
      
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = "Analyze this image and determine if there's a toothbrush present. Respond with only 'yes' or 'no'.";

      const parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64ImageData
          }
        }
      ];

      const result = await model.generateContent(parts);
      const aiResponse = await result.response;
      const text = aiResponse.text().toLowerCase().trim();

      console.log("Gemini AI response:", text);

      return text === 'yes';
    } catch (error) {
      console.error('Error verifying toothbrush presence with Gemini AI:', error);
      throw new Error(`Failed to verify toothbrush presence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  if (showCamera) {
    return <CameraScreen onPictureTaken={stopAlarm} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Brushing Alarm</Text>
      <Button title="Pick Alarm Time" onPress={() => setShow(true)} />
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
      <Button title="Set Alarm" onPress={setAlarm} />
      {alarmActive && <Button title="Stop Alarm" onPress={() => setShowCamera(true)} />}
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
});

export default AlarmScreen;