import React, { useEffect } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { OneSignal } from 'react-native-onesignal';
import Router from './Router';

const App = () => {
  
  useEffect(() => {
    // OneSignal Initialization
    OneSignal.initialize("4c1e4816-27e1-4f65-acd7-2578f1d20203");
    
  



    OneSignal.Notifications.requestPermission(true);
    
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('OneSignal: notification clicked:', event);
      const { additionalData } = event.notification;
      if (additionalData) {
        console.log('Additional data:', additionalData);
      }
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('OneSignal: notification will show in foreground:', event);
      event.getNotification().display();
    });

    OneSignal.User.getOnesignalId().then((userId) => {
      console.log('OneSignal User ID:', userId);
    });

    return () => {
      OneSignal.Notifications.removeEventListener('click');
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay');
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Wrapper untuk StatusBar dengan margin top */}
      <View style={styles.statusBarWrapper}>
        <StatusBar
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
          backgroundColor={Platform.OS === 'android' ? 'transparent' : 'transparent'}
          translucent={Platform.OS === 'android'}
        />
      </View>
      
      <NavigationContainer>
        <Router />
      </NavigationContainer>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarWrapper: {
    marginTop: 8, // Hanya StatusBar yang dapat margin top 20
  },
});

export default App;