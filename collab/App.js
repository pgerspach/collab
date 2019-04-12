import React, { Component } from "react";
import { Platform, StyleSheet, Text, View, Image } from "react-native";
import { Header, Card, ListItem, Button, Icon } from "react-native-elements";
import EmojiDict from "./src/components/EmojiDict";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import * as RNFS from "react-native-fs";

const users = [
  {
    name: "Patrick",
    avatar:
      "https://media.licdn.com/dms/image/C4E03AQEbbgDztIhSJw/profile-displayphoto-shrink_200_200/0?e=1560384000&v=beta&t=MaLXsBgtpjLaZXyDG03oO5OID0vtk3KouzynBSufGGo"
  }
];
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF"
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    marginBottom: 5
  },
  header: {
    flex: 1,
    backgroundColor: "#000"
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 20
  },
  buttonContainer: {
    flexDirection: "row",
    width: 300,
    justifyContent: "space-between",
    alignSelf: "center"
  },
  button: {
    width: 90,
    height: 50
  }
});
const path = Platform.select({
  ios: "hello.m4a"
});

export default class App extends Component {
  audioRecorderPlayer = new AudioRecorderPlayer();

  state = {
    fetchResponse: [],
    recordSecs: null,
    recordTime: "0:00",
    currentPositionSec: null,
    currentDurationSec: null,
    playTime: "0",
    duration: null,
    recordingFileLocation: ""
  };
  onStartRecord = async () => {
    const result = await this.audioRecorderPlayer.startRecorder(path);
    this.audioRecorderPlayer.addRecordBackListener(e => {
      this.setState({
        recordSecs: e.current_position,
        recordTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.current_position)
        )
      });
      return;
    });
    console.log("HI");
    console.log(result);
    this.state.recordingFileLocation = result;
  };
  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recordSecs: 0
    });
  };

  onStartPlay = async () => {
    console.log("onStartPlay");
    const msg = await this.audioRecorderPlayer.startPlayer(path);
    console.log(msg);
    this.audioRecorderPlayer.addPlayBackListener(e => {
      if (e.current_position === e.duration) {
        console.log("finished");
        this.audioRecorderPlayer.stopPlayer();
      }
      this.setState({
        currentPositionSec: e.current_position,
        currentDurationSec: e.duration,
        playTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.current_position)
        ),
        duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration))
      });
      return;
    });
  };
  onFileSave = async () => {
    const response = await fetch("http://127.0.0.1:8000/song/save/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        location: this.state.recordingFileLocation,
      })
    });
    console.log(response);
  };

  onPausePlay = async () => {
    await this.audioRecorderPlayer.pausePlayer();
  };

  onStopPlay = async () => {
    console.log("onStopPlay");
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  };
  getCollabApiResponse = async function() {
    try {
      let response = await fetch("http://127.0.0.1:8000/song/anything");
      let responseJson = await response.json();
      this.setState({
        fetchResponse: this.state.fetchResponse.concat([responseJson.song])
      });
      return;
    } catch (error) {
      console.error(error);
    }
  };
  componentDidMount() {
    this.getCollabApiResponse();
  }
  render() {
    return (
      <View>
        <Header
          containerStyle={{
            backgroundColor: "#000",
            justifyContent: "space-between"
          }}
          leftComponent={{ icon: "menu", color: "#fff" }}
          centerComponent={{ text: "MY TITLE", style: { color: "#fff" } }}
          rightComponent={{ icon: "home", color: "#fff" }}
        />

        <EmojiDict />
        <Card title={"CARD WITH DIVIDER"}>
          {users.map((u, i) => {
            return (
              <View key={i} style={styles.user}>
                <Image
                  style={styles.image}
                  resizeMode="cover"
                  source={{ uri: u.avatar }}
                />
                {this.state.fetchResponse.slice(0).map(x => (
                  <Text>{x}</Text>
                ))}
              </View>
            );
          })}
        </Card>
        <Card title={this.state.recordTime}>
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              icon={<Icon type="entypo" name="mic" />}
              onPress={this.onStartRecord}
            />
            <Button
              style={styles.button}
              icon={<Icon type="foundation" name="stop" />}
              onPress={this.onStopRecord}
            />
          </View>
        </Card>
        <Card title={this.state.playTime}>
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="arrow-left" />}
            />
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="play" />}
              onPress={this.onStartPlay}
            />
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="arrow-right" />}
            />
          </View>
        </Card>
        <Card title={this.state.playTime}>
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="save" />}
              onPress={this.onFileSave}
            />
          </View>
        </Card>
      </View>
    );
  }
}
