import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  TouchableHighlight,
  Image,
  Alert,
} from 'react-native';
import { Constants, MapView, Permissions } from 'expo';

import { Ionicons } from '@expo/vector-icons';

export default class Login extends React.Component {
  state = {
    value: null,
    user: null,
  };

  render() {
    return (
      <View style={styles.container}>
        <Image
          style={styles.logo}
          source={{
            uri:
              'https://cdn4.iconfinder.com/data/icons/pictype-free-vector-icons/16/location-alt-512.png',
          }}
        />
        <View style={styles.inputContainer}>
          <Image
            style={styles.inputIcon}
            source={{
              uri: 'https://png.icons8.com/user/ultraviolet/50/3498db',
            }}
          />
          <TextInput
            style={styles.inputs}
            placeholder="Name"
            underlineColorAndroid="transparent"
            value={this.state.value}
            onChangeText={value =>
              this.setState({
                value,
              })
            }
          />
        </View>
        <TouchableHighlight
          style={[styles.buttonContainer, styles.sendButton]}
          onPress={() => this.props.login(this.state.value)}>
          <Text style={styles.buttonText}>Вход</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
  },
  logo: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderBottomWidth: 1,
    width: 250,
    height: 45,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputs: {
    height: 45,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  inputIcon: {
    width: 30,
    height: 30,
    marginLeft: 15,
    justifyContent: 'center',
  },
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 100,
    borderRadius: 30,
  },
  sendButton: {
    backgroundColor: '#FF4500',
  },
  buttonText: {
    color: 'white',
  },
});
