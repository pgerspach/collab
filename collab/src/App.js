import React, { Component } from "react";
import { Provider } from "react-redux";
import Home from "./scenes/Home";
import Login from "./scenes/Login";
import { View, Text } from "react-native";
import * as session from "./services/session";
import * as api from "./services/api";
import store from "./store.js";
import { createStackNavigator, createAppContainer } from "react-navigation";
import * as sessionActions from "./services/session/actions";

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
    const unsubscribe = store.subscribe(() => {
      console.log(store.getState());
      if (store.getState().services.persist.isHydrated) {
        console.log("store", store);
        unsubscribe();
        store.dispatch(
          sessionActions.update(
            store.getState().services.persist.services.session
          )
        );
        this.autoLogin();
      }
    });
  }
  autoLogin() {
    console.log("Trying to auto-login");
    session
      .accessToken()
      .then(() => {
        this.setState({ initialRoute: "Home" });
      })
      .catch(err => {
        console.log(err);
        this.setState({ initialRoute: "Login" });
      });
  }
  renderContent(initialRoute) {
    if (!initialRoute) {
      return (
        <View>
          <Text>Waiting</Text>
        </View>
      );
    }
    const mainNavigator = createStackNavigator(
      {
        Login: Login,
        Home: Home
      },
      {
        initialRouteName: initialRoute
      }
    );
    const MainApp = createAppContainer(mainNavigator);
    console.log(MainApp);
    return <MainApp />;
  }
  render() {
    return (
      <Provider store={store}>
        {this.renderContent(this.state.initialRoute)}
      </Provider>
    );
  }
}
