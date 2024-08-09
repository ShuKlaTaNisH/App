import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CameraCapturedPicture } from 'expo-camera';
import CameraScreen from '@/components/CameraScreen';
import * as Notifications from 'expo-notifications';

const AlarmScreen = () => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [alarmActive, setAlarmActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    // Load sound when component mounts
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/alarm.mp3')
        );
        setSound(sound);
        console.log('Sound loaded successfully');
      } catch (error) {
        console.error('Failed to load sound', error);
        Alert.alert('Error', 'Failed to load sound');
      }
    })();

    // Unload sound when component unmounts
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    // Add a listener for when the notification is received
    const subscription = Notifications.addNotificationReceivedListener(async () => {
      if (sound) {
        console.log('Attempting to play sound');
        try {
          await sound.playAsync();
          setAlarmActive(true);
          console.log('Sound playback succeeded');
        } catch (error) {
          console.log('Sound playback failed', error);
          Alert.alert('Error', 'Sound playback failed');
        }
      }
    });

    // Remove the listener when the component unmounts
    return () => subscription.remove();
  }, [sound]);

  const setAlarm = async () => {
    const trigger = new Date(date.getTime());
    const now = new Date().getTime();
    const delay = trigger.getTime() - now;

    if (delay <= 0) {
      Alert.alert("Invalid Time", "Please select a future time for the alarm.");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Alarm",
        body: "Wake up!",
        sound: true,
      },
      trigger: {
        seconds: delay / 1000,
      },
    });

    Alert.alert('Alarm set', `Alarm set for ${date.toLocaleTimeString()}`);
  };

  const stopAlarm = async (photoUri: string) => {
    const isToothbrushPresent = await detectToothbrush(photoUri);
    if (isToothbrushPresent) {
      sound?.stopAsync().then(() => {
        setAlarmActive(false);
        Alert.alert('Alarm Stopped', 'Good job! You can stop brushing now.');
      });
    } else {
      Alert.alert('Try Again', 'No toothbrush detected. Please try again.');
    }
    setShowCamera(false);
  };

  const detectToothbrush = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'photo.jpg');

      const result = await fetch('https://llama-api-url/verify-toothbrush', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer YOUR_LLAMA_API_TOKEN_HERE`
        },
        body: formData,
      }).then((res) => res.json());

      return result.isToothbrushPresent;
    } catch (error) {
      console.error('Error verifying toothbrush presence:', error);
      return false;
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
      <Text style={styles.title}>Set Alarm</Text>
      <Button title="Pick a Time" onPress={() => setShow(true)} />
      {show && (
        <DateTimePicker
          value={date}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onChange}
        />
      )}
      <Button title="Set Alarm" onPress={setAlarm} />
      {alarmActive && <Button title="Stop Alarm" onPress={() => setShowCamera(true)} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default AlarmScreen;
