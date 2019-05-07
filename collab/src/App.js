import React, { Component } from "react";
import { Provider } from "react-redux";
import Home from "./scenes/Home";
import Login from "./scenes/Login";
import { View, Navigator } from "react-native";
import * as session from "./services/session";
import * as api from "./services/api";
import store from "./store.js";

const routeStack = [
  { name: "Login", component: Login },
  { name: "Home", component: Home }
];

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
    console.log("Trying to auto-login");
    session
      .accessToken()
      .then(() => {
        this.setState({ initialRoute: routeStack[1] });
      })
      .catch(() => {
        this.setState({ initialRoute: routeStack[0] });
      });
  }
  renderContent(initialRoute) {
    if (!initialRoute) {
      return <View>Waiting</View>;
    }
    return (
      <Navigator
        initialRoute={initialRoute}
        initialRouteStack={routeStack}
        renderScene={(route, navigator) => (
          <route.component
            route={route}
            navigator={navigator}
            {...route.passProps}
          />
        )}
      />
    );
  }
  render() {
    return (
      <Provider store={store}>
        {this.renderContent(this.state.initialRoute)}
      </Provider>
    );
  }
}
