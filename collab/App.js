import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
  Image,
  FlatList
} from "react-native";
import { Header, Card, ListItem, Button, Icon } from "react-native-elements";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import Sound from "react-native-sound";
Sound.setCategory("Playback");
console.log(Sound.LIBRARY);
// import RNFS from "react-native-fs";
import RNFetchBlob from "react-native-fetch-blob";
const base_path = "http://127.0.0.1:8000";

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
  },
  text: {
    fontSize: 15,
    color: "#000000"
  }
});

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      fetchResponse: ["Default header!"],
      recordSecs: null,
      recordTime: "0:00",
      currentPositionSec: null,
      currentDurationSec: null,
      playTime: 0,
      duration: null,
      recordingFileLocation: "",
      mySongs: [],
      uploadPath: ""
    };
    this.currentSound = null;
    this.audioRecorderPlayer = new AudioRecorderPlayer();
  }
  componentDidMount() {
    RNFetchBlob.session("temp-session").dispose();
  }
  onStartRecord = async () => {
    const result = await this.audioRecorderPlayer.startRecorder();
    this.audioRecorderPlayer.addRecordBackListener(e => {
      this.setState({
        recordSecs: e.current_position,
        recordTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.current_position)
        )
      });
      return;
    });
    this.setState({
      recordingFileLocation: "../tmp/" + result.split("/").pop(),
      uploadPath: result
    });

    console.log(this.state);
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
    this.currentSound = new Sound(
      this.state.recordingFileLocation,
      Sound.LIBRARY,
      error => {
        if (error) {
          console.log("failed to load the sound", error);
          return;
        }
        // loaded successfully
        console.log(
          "duration in seconds: " +
            this.currentSound.getDuration() +
            "number of channels: " +
            this.currentSound.getNumberOfChannels()
        );

        // Play the sound with an onEnd callback
        this.currentPlayTimeInterval = setInterval(() => {
          this.currentSound.getCurrentTime(seconds => {
            this.setState({ playTime: seconds });
            return;
          });
        }, 100);
        this.currentSound.play(success => {
          if (success) {
            console.log("successfully finished playing");
            this.setState({playTime:0});
            this.currentSound.release();
            clearInterval(this.currentPlayTimeInterval);
          } else {
            console.log("playback failed due to audio decoding errors");
          }
        });
      }
    );
  };
  onFileSave = async () => {
    const song = {
      uri: this.state.uploadPath,
      type: "audio/m4a",
      name: "audio.m4a"
    };

    const body = new FormData();
    body.append("authToken", "secret");
    body.append("song", song);
    body.append("title", "Song1");

    var xhr = new XMLHttpRequest();
    xhr.open("POST", base_path + "/song/save/");
    xhr.setRequestHeader("enctype", "multipart/form-data");
    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var json_obj = JSON.parse(xhr.responseText);
          status = true;
          console.log(xhr.responseText);
        } else {
          console.error(xhr.statusText);
        }
      }
    }.bind(this);
    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };
    xhr.send(body);
  };

  onPausePlay = async () => {
    await this.audioRecorderPlayer.pausePlayer();
    // this.currentSound.pause();
  };

  onStopPlay = async () => {
    console.log("onStopPlay");
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
  };
  getCollabApiResponse = async function() {
    try {
      let response = await fetch(base_path + "/song/anything");
      let responseJson = await response.json();
      this.setState({
        fetchResponse: this.state.fetchResponse.concat([responseJson.song])
      });
      return;
    } catch (error) {
      console.error(error);
    }
  };
  onGetSongs = async () => {
    try {
      response = await fetch(base_path + "/song/get/");
      response = await response.json();
      console.log(response);
      this.setState({ mySongs: response });
    } catch (error) {
      console.log(error);
    }
  };
  onSelectSong = async (id, e) => {
    response = await fetch(base_path + "/song/load/" + id.toString());
    response = await response.json();
    if (response.status === 404) {
      console.log("Something went wrong");
      return;
    }
    let download = await RNFetchBlob.config({
      // add this option that makes response data to be stored as a file,
      // this is much more performant.
      fileCache: true,
      appendExt: "wav",
      session: "temp-session"
    }).fetch("GET", response.url);
    // the temp file path
    console.log(response.url);
    console.log(
      "The file saved to ",
      "../Documents/RNFetchBlob_tmp/" +
        download
          .path()
          .split("/")
          .pop()
    );
    this.setState({
      recordingFileLocation:
        "../Documents/RNFetchBlob_tmp/" +
        download
          .path()
          .split("/")
          .pop()
    });
  };
  onDeleteSong = async (id, e) => {
    response = await fetch(base_path + "/song/delete/" + id.toString());
    response = await response.json();
    console.log(response.msg);
  };
  onAnalyzeSong = async (id, e) => {
    response = await fetch(base_path + "/song/analyze/" + id.toString());
    response = await response.json();
    console.log(response);
  };
  getAudioTimeString(seconds){
    const h = parseInt(seconds/(60*60));
    const m = parseInt(seconds%(60*60)/60);
    const s = parseInt(seconds%60);
    const ms = parseInt(Math.floor(seconds*100%100));

    return ((h<10?'0'+h:h) + ':' + (m<10?'0'+m:m) + ':' + (s<10?'0'+s:s)+ ':' + (ms<10?'0'+ms:ms));
}
  componentWillUnmount() {
    RNFetchBlob.session("temp-session").dispose();
    console.log("Removing all files");
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
          centerComponent={{ text: "Collab", style: { color: "#fff" } }}
          rightComponent={{ icon: "home", color: "#fff" }}
        />
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
        <Card title={this.getAudioTimeString(this.state.playTime)}>
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
        <Card title={this.getAudioTimeString(this.state.playTime)}>
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="arrow-up" />}
              onPress={this.onFileSave}
            />
          </View>
        </Card>
        <Card title="Get songs">
          <View style={styles.buttonContainer}>
            <Button
              style={styles.button}
              icon={<Icon type="evilicon" name="arrow-down" />}
              onPress={this.onGetSongs}
            />
          </View>
          <FlatList
            data={this.state.mySongs}
            renderItem={({ item }) => (
              <View style={styles.buttonContainer}>
                <Text
                  onPress={this.onSelectSong.bind(this, item.id)}
                  style={styles.text}
                >
                  Load: {item.id}
                </Text>
                <Text
                  onPress={this.onDeleteSong.bind(this, item.id)}
                  style={styles.text}
                >
                  Delete: {item.id}
                </Text>
                <Text
                  onPress={this.onAnalyzeSong.bind(this, item.id)}
                  style={styles.text}
                >
                  Analyze: {item.id}
                </Text>
              </View>
            )}
          />
        </Card>
      </View>
    );
  }
}
