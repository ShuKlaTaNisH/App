import React from 'react';
import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof FontAwesome.glyphMap = 'question-circle';
          if (route.name === 'index') {
            iconName = 'home';
          } else if (route.name === 'two') {
            iconName = 'clock-o'; // Changed 'alarm' to 'clock-o'
          }

          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Welcome' }} />
      <Tabs.Screen name="two" options={{ title: 'Alarm' }} />
    </Tabs>
  );
}
