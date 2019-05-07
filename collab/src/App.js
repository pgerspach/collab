import React, { Component } from "react";
import { Provider } from "react-redux";
import Home from "./scenes/main/Home";
import View from "react-native";
import * as session from "./services/session";
import store from "./store.js";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialRoute: null
    };
  }

  render() {
    return <Home />;
  }
}
