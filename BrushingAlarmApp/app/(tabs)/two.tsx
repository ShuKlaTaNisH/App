import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform } from 'react-native';
import BackgroundTimer from 'react-native-background-timer';
import Sound from 'react-native-sound';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const defaultSoundUri = require('../../assets/sounds/alarm.mp3'); // Ensure this path is correct

const AlarmScreen = () => {
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [sound, setSound] = useState<Sound | null>(null);

  useEffect(() => {
    Sound.setCategory('Playback');
    const alarmSound = new Sound(defaultSoundUri, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.log('failed to load the sound', error);
        return;
      }
      setSound(alarmSound);
    });

    return () => {
      if (sound) {
        sound.release();
      }
    };
  }, []);

  const setAlarm = () => {
    const trigger = new Date(date.getTime());
    const now = new Date().getTime();
    const delay = trigger.getTime() - now;

    if (delay <= 0) {
      Alert.alert("Invalid Time", "Please select a future time for the alarm.");
      return;
    }

    BackgroundTimer.setTimeout(() => {
      if (sound) {
        sound.play((success) => {
          if (!success) {
            console.log('Sound playback failed');
          }
        });
      }
    }, delay);

    Alert.alert('Alarm set', `Alarm set for ${date.toLocaleTimeString()}`);
  };

  const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

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
