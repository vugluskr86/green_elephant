import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Constants, Permissions, Location } from 'expo';
import GameMap from './components/GameMap';
import Chat from './components/Chat';
import Login from './components/Login';
import { Card } from 'react-native-paper';
import { Button, ThemeProvider } from 'nachos-ui';

const { width, height } = Dimensions.get('window');

import geolib from 'geolib';

export const ASPECT_RATIO = width / height;
export const LATITUDE = 56.8095608;
export const LONGITUDE = 60.4941661;
export const SPACE = 0.01;
export const LATITUDE_DELTA = 0.0922;
export const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

class ScreenSelector extends React.Component {
  render() {
    switch (this.props.page) {
      case 'map': {
        return <GameMap {...this.props} />;
      }
      case 'chat': {
        return <Chat {...this.props} />;
      }
      case 'login': {
        return <Login {...this.props} />;
      }
    }
    return <Login {...this.props} />;
  }
}

export default class App extends React.Component {
  ws = null;
  token = null;
  state = {
    page: null,
    showScreen: page => {
      this.showScreen(page);
    },
    sendChatMessage: message => {
      this.sendChatMessage(message);
    },
    login: token => {
      this.token = token;
      this._connect(token);
    },
    createGame: () => {
      this.createGame();
    },
    joinGame: () => {
      this.joinGame();
    },
    isConnected: false,
    data: null,
    messages: [],
    team: [],
    points: [],
    games: [],
    game: null,
    user: null,
    errorMessage: null,
    location: {
      latitude: LATITUDE + SPACE,
      longitude: LONGITUDE + SPACE,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    },
    intersectGame: null,
  };

  _reconnect() {
    setTimeout(() => {
      if (!this.state.isConnected) {
        this._connect(this.token);
      }
    }, 1000);
  }

  _connect(token) {
    this.ws = new WebSocket(`ws://46.48.34.172:3000?token=${token}`);
    this.ws.onopen = () => {
      this.setState({ isConnected: true, user: token });
      this.showScreen('map');
      this._startWatch();
    };

    this.ws.onmessage = e => {
      try {
        const packet = JSON.parse(e.data);
  
        switch (packet.type) {
          case 'chat': {
            this.setState({
              messages: [
                ...this.state.messages,
                { ...packet.message, type: 'in' },
              ],
            });
            break;
          }
          case 'team': {
            const teamState = this.state.team;
            const existing = teamState.find(
              i => i.token === packet.message.token
            );
            if (existing) {
              existing.point = packet.message.point;
            } else {
              teamState.push(packet.message);
            }
            this.setState({
              team: [...teamState],
            });
            break;
          }
          case 'set_my_game': {
            console.log(`set_my_game`, packet)
            this.setState({
              game: packet.message,
            });
            this._forceUpdatePos();
            break;
          }
          case 'set_games': {
            this.setState({
              games: packet.message,
            });
            this._forceUpdatePos();
            break;
          }
          case 'add_game': {
            this.setState({
              games: [...this.state.games, packet.message],
            });
            this._forceUpdatePos();
            break;
          }
          case 'error': {
            Alert.alert('Ошибка', packet.message, [], { cancelable: true });
            break;
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    this.ws.onerror = e => {
      this._stopWatch();
      if (this.state.isConnected) {
        this._reconnect();
      }
      this.setState({ isConnected: false });
    };

    this.ws.onclose = e => {
      this._stopWatch();
      if (this.state.isConnected) {
        this._reconnect();
      }
      this.setState({ isConnected: false });
    };
  }

  componentWillMount() {
 
    if (Platform.OS === 'android' && !Constants.isDevice) {
      this.setState({
        errorMessage:
          'Oops, this will not work on Sketch in an Android emulator. Try it on your device!',
      });
    } else {
      // this._getLocationAsync();
    }
  }

  componentWillUnmount() {
    /*
 
    clearInterval(this.updInterval)
    this.updInterval = null
    this.ws = null
    navigator.geolocation.clearWatch(this.watchId);
    */
  }

  async _forceUpdatePos() {
    const p = await this._getLocationAsync();
    this._checkInGamesPos(p);
    this._updateGeoPoint(p);
  }

  _startWatch() {
    this.updInterval = setInterval(async () => {
      // const p = await this._getLocationAsync();
      //  this._checkInGamesPos(p)
    }, 3000);
    this.watchId = navigator.geolocation.watchPosition(
      position => {

        this._checkInGamesPos(position.coords);
        this._updateGeoPoint(position.coords);
      },
      error => this.setState({ errorMessage: error.message }),
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        distanceFilter: 1,
      }
    );
  }

  _stopWatch() {
    clearInterval(this.updInterval);
    this.updInterval = null;
    navigator.geolocation.clearWatch(this.watchId);
  }

  _checkInGamesPos(userPos) {
    if (userPos && userPos.latitude) {
      for (let i = 0; i < this.state.games.length; i++) {
        const game = this.state.games[i];
        if (geolib.isPointInCircle(userPos, game.data.point, game.radius)) {
          game.inRadius = true;
          this.setState({
            intersectGame: game,
          });
        } else {
          game.inRadius = false;
          this.setState({
            intersectGame: null,
          });
        }
      }
      this.setState({
        games: [...this.state.games],
      });
    }
  }

  sendChatMessage(message) {
    this.setState({
      messages: [
        ...this.state.messages,
        {
          token: this.state.user,
          message: message,
          dt: Date.now(),
          type: 'out',
        },
      ],
    });
    this.ws.send(
      JSON.stringify({
        type: 'chat',
        message: {
          token: this.state.user,
          message,
          dt: Date.now(),
        },
      })
    );
  }

  async createGame() {
    const point = await this._getLocationAsync();
    this.ws.send(
      JSON.stringify({
        type: 'create',
        message: {
          token: this.state.user,
          point,
          dt: Date.now(),
        },
      })
    );
  }

  joinGame() {
    this.ws.send(
      JSON.stringify({
        type: 'join',
        message: this.state.intersectGame.id,
      })
    );    
  }

  action() {}

  _updateGeoPoint(p) {
    this.setState({
      location: {
        latitude: p.latitude,
        longitude: p.longitude,
        latitudeDelta: this.state.location.latitudeDelta,
        longitudeDelta: this.state.location.longitudeDelta,
      },
    });

    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          type: 'geo',
          message: {
            token: this.state.user,
            point: {
              latitude: p.latitude,
              longitude: p.longitude,
            },
            dt: Date.now(),
          },
        })
      );
    }
  }

  _getLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  render() {
    return (
      <ThemeProvider>
        <ScreenSelector {...this.state} />
      </ThemeProvider>
    );
  }

  showScreen(page) {
    console.log(page)
    this.setState({
      page,
    });
  }
}

const styles = StyleSheet.create({});
