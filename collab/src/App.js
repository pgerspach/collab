import React, { Component } from "react";
import { Provider } from 'react-redux';
import Home from "./scenes/main/Home";
import View from "react-native";


export default class App extends Component {
  render() {
    return (
        <Home />
    );
  }
}
