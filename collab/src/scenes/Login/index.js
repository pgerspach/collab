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
import {
  Header,
  Card,
  ListItem,
  Button,
  Icon,
  Input
} from "react-native-elements";
import RNFS from "react-native-fs";
import * as session from "../../services/session";

const base_path = "http://127.0.0.1:8000";
const styles = StyleSheet.create({
  input: {
    paddingLeft: 20,
  },
  inputContainer: {
    marginTop: 50,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#d6d7da",
    flex: 0,
    width: 300
  },
  logInButton:{
    width:200
  }
});
export default class Login extends Component {
  constructor(props) {
    super(props);
    this.initialState = {
      username: "",
      password: ""
    };
    this.state = this.initialState;
    this.logIn = this.logIn.bind(this);
  }
  componentDidMount() {
  }
  logIn() {
    session
      .authenticate(this.state.username, this.state.password)
      .then(() => {
        this.setState(this.initialState);
        this.props.navigation.navigate("Home");
      })
      .catch(err => {
        console.log(err);
      });
  }
  render() {
    return (
      <View style={{ flex: 1, flexDirection: "column", alignItems: "center" }}>
        <Input
          containerStyle={styles.inputContainer}
          inputStyle={{...styles.input}}
          placeholder="Email address"
          leftIcon={<Icon name="email" />}
          textContentType="emailAddress"
          autoCapitalize="none"
          value={this.state.username}
          onChangeText={text=>this.setState({username:text})}
        />
        <Input
          containerStyle={styles.inputContainer}
          inputStyle={{...styles.input,marginTop:0}}
          placeholder="password"
          textContentType="newPassword"
          leftIcon={<Icon name="lock" />}
          autoCapitalize="none"
          value={this.state.password}
          onChangeText={text=>this.setState({password:text})}
        />
        <Button
          icon={<Icon type="material" name="home" />}
          onPress={this.logIn}
          style={styles.logInButton}
        />
      </View>
    );
  }
}
