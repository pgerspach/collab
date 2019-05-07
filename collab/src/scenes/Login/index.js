import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  FlatList,
  ScrollView
} from "react-native";
import { Header, Card, ListItem, Button, Icon } from "react-native-elements";
import RNFS from "react-native-fs";
import * as session from "../../services/session";

const base_path = "http://127.0.0.1:8000";

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.initialState = {
      username: "pat.gerspach@gmail.com",
      password: "password"
    };
    this.state = this.initialState;
  }
  componentDidMount() {
    this.logIn();
  }
  logIn() {
    session
      .authenticate(this.state.username, this.state.password)
      .then()
      .catch(err => {
        console.log(err);
      });
  }
}
