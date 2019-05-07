import React, { Component } from "react";
import { Provider } from "react-redux";
import Home from "./scenes/main/Home";
import View from "react-native";
import * as session from "./services/session";
import * as api from "./services/api";
import store from "./store.js";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      initialRoute: null
    };
  }
  componentDidMount() {
    // Waits for the redux store to be populated with the previously saved state,
    // then it will try to auto-login the user.
    console.log(store.getState());
    const unsubscribe = store.subscribe(() => {
      if (store.getState().services.persist.isHydrated) {
        unsubscribe();
        this.autoLogin();
      }
    });
  }
  autoLogin() {
    // session.refreshToken().then(() => {
    // 	this.setState({ initialRoute: routeStack[3] });
    // }).catch(() => {
    // 	this.setState({ initialRoute: routeStack[0] });
    // });
    console.log("Trying to auto-login");
    let email = "pgerspac@nd.edu";
    let pwd = "lalala";
    session.authenticate(email, pwd).then(res => {
      console.log(JSON.parse(res));
    }).catch(err=>{
      console.log(err);
    });
  }
  render() {
    return <Home />;
  }
}
