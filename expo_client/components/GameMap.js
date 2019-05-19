import * as React from 'react';
import {
  Text,
  View,
  Button,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

import { Constants, MapView, Permissions } from 'expo';

const { width, height } = Dimensions.get('window');

import { Ionicons } from '@expo/vector-icons';

export default class GameMap extends React.Component {
  id = 0;
  state = {};

  onPress(e) {
    if (this._isAllowedToAction()) {
      console.log(e.nativeEvent.coordinate); 
    }
  }

  _renderActionButton() {
    if(this.props.game) {
      return null;
    }
    if(this.props.intersectGame) {
      if(this.props.intersectGame.state !== 'started' && this.props.intersectGame.state !== 'play') {
        return (
          <TouchableOpacity
            style={[styles.button, styles.right]}
            onPress={() => {
              this.props.joinGame()
            }}>
            <Ionicons name="md-person-add" size={32} color="green" />
          </TouchableOpacity>       
        )
      }
    } else {
      return (
        <TouchableOpacity
          style={[styles.button, styles.right]}
          onPress={() => {
            this.props.createGame()
          }}>
          <Ionicons name="md-add-circle" size={32} color="green" />
        </TouchableOpacity>       
      )
    }

    return null;
  }

  _renderChat() {
    if(this.props.game) {
      return <TouchableOpacity
        style={[styles.button, styles.left]}
        onPress={() => {
          this.props.showScreen('chat');
        }}>
        <Ionicons name="md-chatboxes" size={32} color="green" />
      </TouchableOpacity>
    } else {
      return null;
    }
  }

  _findMyRole(game, token) {
    if (game.set.indexOf(token) !== -1) {
      return "set";
    }
    if (game.brake.indexOf(token) !== -1) {
      return "brake";
    }
  }

  _isAllowedToAction() {
    return this.props.game && 
      this.props.intersectGame && 
      this.props.game.id === this.props.intersectGame.id && this.props.game.state === "started";
  }

  _renderGameState() {

    if(!this.props.game && !this.props.intersectGame) {
      return <Text>Вы можете создать новую игру</Text>
    }

    if(this.props.game && !this.props.intersectGame) {
      return <Text>Вернитесь в игровую зону</Text>
    }

    if(this.props.game && 
      this.props.intersectGame && 
      this.props.game.id !== this.props.intersectGame.id) {
      return <Text>Вы находитесь в чужой игровой зоне</Text>
    }

    const messages = [<Text>Создатель: {this.props.intersectGame.owner}</Text>];

    // находится в своей области
    if(this.props.game && 
      this.props.intersectGame && 
      this.props.game.id === this.props.intersectGame.id) {
      
      const state = this.props.game.state;
      const role = this._findMyRole(this.props.game, this.props.user);

      if(state === "not_started") {
        messages.push(<Text>Ожидаем игроков. Всего: ${this.props.game.players.length}</Text>)
      } else {
        messages.push(<Text>Игра уже началась</Text>)
      }

      if(role) {
        messages.push(
          <Text>Вы играете на стороне: {role} {role === 'set' ? 'Для установки точки нажмите на карте в игровой зоне' : 'Для уничтожения точки нажмите на нее'}</Text>
        );
      }   

      return messages;  
    }

    if(!this.props.game && 
      this.props.intersectGame && 
      this.props.intersectGame.state === "not_started") {
        return <Text>Вы можете присоединиться к существующей игре</Text>
    }

    return <Text>Вы потерялись</Text>
  }

  render() {
    const mapOptions = {
      scrollEnabled: true,
      showsUserLocation: true,
    };

    return (
      <View style={[styles.flex]}>
        <MapView
          //  onRegionChange={this._handleMapRegionChange.bind(this)}
          style={styles.map}
          initialRegion={this.props.location}
          {...mapOptions}
          onPress={e => this.onPress(e)}>
          {this.props.team.map(i => {
            return (
              <MapView.Marker
                onPress={() => {}}
                coordinate={{
                  latitude: i.point.latitude,
                  longitude: i.point.longitude,
                }}
                centerOffset={{ x: 0, y: 0 }}
                anchor={{ x: 0, y: 0 }}>
                <Ionicons name="md-checkmark-circle" size={32} color="green" />
              </MapView.Marker>
            );
          })}
          {this.props.games.map(g => {
            return (
              <MapView.Circle
                center={g.data.point}
                radius={g.radius}
                fillColor={g.inRadius ? "rgba(255, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)" }
                strokeColor="rgba(0,0,0,0.5)"
                zIndex={2}
                strokeWidth={2}
              />              
            )
          })} 
        </MapView>
        <View style={styles.containerUp}>
          <Text>Привет: {this.props.user}</Text>
          {this._renderGameState()}
        </View>
        <View style={styles.buttonContainerLeftRight}>
          {this._renderChat()}
          {this._renderActionButton()}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    width: '100%',
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  button: {
    backgroundColor: 'rgba(255,255,255,1.0)',
    color: '#fff',
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#d6d7da',
    height: 50,
    width: 50,
  },

  containerUp: {
   // ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,

    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Constants.statusBarHeight,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 20,
  },

  left: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  right: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  buttonContainerLeftRight: {
    flex: 0,
    flexDirection: 'column',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width,
  },
});
