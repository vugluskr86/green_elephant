import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  FlatList,
  Button,
} from 'react-native';
import { Constants, MapView, Permissions } from 'expo';

import { Ionicons } from '@expo/vector-icons';

export default class Chat extends React.Component {
  state = {
    value: null,
  };

  sendInput() {
    this.setState({
      value: null,
    });
    this.props.sendChatMessage(this.state.value);
  }

  renderDate = date => {
    return (
      <Text style={styles.time}>{new Date(date).toLocaleTimeString()}</Text>
    );
  };

  render() {
    console.log(this.props.showScreen)
    return (
      <View style={styles.container}>
        <FlatList
          style={styles.list}
          data={this.props.messages}
          keyExtractor={item => {
            return item.id;
          }}
          renderItem={message => {
            const item = message.item;
            let inMessage = item.type === 'in';
            let itemStyle = inMessage ? styles.itemIn : styles.itemOut;
            return (
              <View style={[styles.item, itemStyle]}>
                {!inMessage && this.renderDate(item.dt)}
                <View style={[styles.balloon]}>
                  <Text>
                    {item.token}: {item.message}
                  </Text>
                </View>
                {inMessage && this.renderDate(item.dt)}
              </View>
            );
          }}
        />
        <View style={styles.footer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputs}
              placeholder="Write a message..."
              underlineColorAndroid="transparent"
              value={this.state.value}
              onChangeText={value =>
                this.setState({
                  value,
                })
              }
              onSubmitEditing={e => {
                this.sendInput();
              }}
            />
          </View>

          <TouchableOpacity style={styles.btnSend}>
            <Image
              source={{
                uri: 'https://png.icons8.com/small/75/ffffff/filled-sent.png',
              }}
              style={styles.iconSend}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnClose} onPress={() => {
          console.log('fuck')
          this.props.showScreen('map')
        }}>
          <Ionicons name="md-close-circle" size={32} color="green"  />
        </TouchableOpacity>

      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 17,
  },
  footer: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#eeeeee',
    paddingHorizontal: 10,
    padding: 5,
  },
  btnSend: {
    backgroundColor: '#00BFFF',
    width: 40,
    height: 40,
    borderRadius: 360,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSend: {
    width: 30,
    height: 30,
    alignSelf: 'center',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    borderBottomWidth: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  inputs: {
    height: 40,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  balloon: {
    maxWidth: 250,
    padding: 15,
    borderRadius: 20,
  },
  itemIn: {
    alignSelf: 'flex-start',
  },
  itemOut: {
    alignSelf: 'flex-end',
  },
  time: {
    alignSelf: 'flex-end',
    margin: 15,
    fontSize: 12,
    color: '#808080',
  },
  item: {
    marginVertical: 14,
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderRadius: 300,
    padding: 5,
  },
  btnClose: {
    position: 'absolute',
    top: Constants.statusBarHeight + 5,
    left: 10,
  }
});
