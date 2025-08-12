/* eslint-disable prettier/prettier */
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import Logo from '../../assets/logoloffee.png';
import { database } from '../../config/Fire'; // Import database dari config v9
import { ref, get } from 'firebase/database'; // Import functions untuk v9
import AsyncStorage from '@react-native-async-storage/async-storage';
// import Logo from '../../assets/logoloffee.png';


const Login = ({navigation}) => {
  const [inputan, setInput] = useState({
    email: "",
    password: "",
    
  })
  const [loading, setLoading]= useState(false)
  const [hidePassword, setHidePassword] = useState(true);

  console.log('inputan', inputan);

  const handleLogin = async () => {
    setLoading(true);

    if (inputan.email === "") {
      setLoading(false);
      alert('Silahkan input username');
      return;
    }

    if (inputan.password === "") {
      setLoading(false);
      alert('Silahkan input password');
      return;
    }

    try {
      // Firebase v9 syntax
      const dbRef = ref(database, 'userlogin/');
      const snapshot = await get(dbRef);
      const value = snapshot.val();
      
      console.log('Data leads:', value);

      if (value) {
        const datled = Object.values(value);
        console.log('datt', datled);

        const allFilterData = datled.filter((user) => 
          (user.handphone === inputan.email || user.handphone === inputan.email) && 
          user.password === inputan.password
        );

        console.log('Filtered data exists:', allFilterData.length > 0);
        setLoading(false);

        const prefix = 'TKN';
        const uniquenumber = Math.floor(Math.random() * 1000000);
        const tkn = prefix + uniquenumber;
        const tostrings = JSON.stringify(allFilterData);

        if (allFilterData.length > 0) {
          await AsyncStorage.setItem('@token', tkn);
          await AsyncStorage.setItem('@dataSelf', tostrings);
          navigation.replace('Home');
        } else {
          alert('Data Tidak Ada');
        }
      }
    } catch (err) {
      setLoading(false);
      console.log('Error:', err);
    }
  };

  
  
  
   


   
   
 
    
      

    

     


  // if(inputan.email == "admin@gmail.com" && inputan.password == "admin") {
  //     navigation.navigate('Home')
  
  //     console.log('token', token);
  // } else {
  //     alert('Email dan Password Salah!')
  // }
  
  const togglePasswordVisibility = () => {
    setHidePassword(!hidePassword);
  };
  const handleRegister = async () => {
    
       navigation.navigate('Register')
      
   }
  
  return (
    <View style={styles.container}>
      <View
        style={styles.wrapper}>
        <>
         
      
      
      <View style={styles.wrapHeader}>
      <Image source={Logo} style={{width: 200, height: 100}} />
      </View>
      <Text style={styles.txtHead}>Hello Welcome Back Loffer's :)</Text>
     
        
        <View style={{marginTop: 20, marginHorizontal: 16}}>
          
        <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Nomor Handphone"
            onChangeText={(e) => setInput({ ...inputan, email: e })}  
          />
            <TextInput
            // eslint-disable-next-line react-native/no-inline-styles
            style={styles.txtInput}
            placeholderTextColor="grey" 
            placeholder="Password"
            secureTextEntry
            onChangeText={(e) => setInput({ ...inputan, password: e })}  
          />
         
       
        </View>
        
       

        <Text style={{color: '#7F6000',  fontSize: 12,  fontFamily: 'Poppins-Medium',  marginHorizontal: 32, marginTop: 10, textAlign: 'right'}}>{'Forgot your password?'}</Text>

       {loading ? 
       <ActivityIndicator size="large" color="black" />
       :
       <>

<TouchableOpacity style={styles.btn} 
             onPress={handleLogin}
              >
        <Text style={styles.txtBtn} >Login</Text>
    </TouchableOpacity>

       </>
      }
         
         <View style={{alignSelf: 'center'}}>
         <Text style={styles.descHead}>{'Not in Loffee App yet?'}</Text>
         <Text 
        onPress={() => navigation.push('Register')}
         style={[styles.txtHead, {
          fontSize: 14,
          marginTop: -20,
          marginLeft: 5,
          color: '#7F6000',
          
         }]}>Sign Up</Text>
          <Text 
        onPress={() => navigation.push('LoginGuest')}
         style={[styles.txtHead, {
          fontSize: 14,
          marginTop: 5,
          marginLeft: 5,
          color: '#7F6000',
          
         }]}>Login as Guest</Text>
         </View>
       
   

   
     

        </>
      </View>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F7F0', },
  wrapper: {
    // alignItems: 'center',

   
    marginTop: 30,
  },
wrapHeader: {alignSelf: 'center'},
txtHead: {color: '#7F6000',  fontSize: 16,  marginTop: 30, textAlign: 'center'},
descHead: {color: '#7F6000',  fontSize: 14,  marginBottom: 30, marginTop: 10, textAlign: 'center'},
txtInput: {
  backgroundColor: 'white',
  borderRadius: 12,
  marginBottom: 8,
  borderWidth: 1,
  padding: 10,
  borderColor: '#E0E2EA',
  marginHorizontal: 20,
  width: '90%',
  color: 'black'
},
toggleButton: {
  position: 'absolute',
  right: 10,
  top: 40,
},
toggleText: {
  color: '#2FBED4',
  fontSize: 14,
  fontWeight: '600',
  marginRight: 20,
  marginTop: -27
},
formInput: {
  marginVertical: 5
},
// txtInput: {
//   height: 50,
//   borderColor: '#020202',
//   borderWidth: 1,
//   borderRadius: 10,
//   paddingLeft: 10
// },
btn: {backgroundColor: '#7F6000', width: '80%', height: 40, alignSelf: 'center',  marginBottom: 10, borderRadius: 8, marginTop: 10, marginHorizontal: 20},
txtBtn: {textAlign: 'center', marginTop:3, fontSize: 14,  paddingVertical: 5, color: 'white', fontWeight: 'bold'}
});
