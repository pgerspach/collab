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
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import Sound from "react-native-sound";
Sound.setCategory("Playback");
console.log(Sound.LIBRARY);
import RNFS from "react-native-fs";
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
    justifyContent: "space-around",
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
      recordSecs: null,
      recordTime: "0:00",
      currentPositionSec: null,
      currentDurationSec: null,
      playTime: 0,
      duration: null,
      recordingFileLocation: "",
      mySongs: [],
      uploadPath: "",
      playing: false,
      song_analysis: null
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
    this.loadSound();
  };
  loadSound = async () => {
    try {
      this.currentSound = new Sound(
        this.state.recordingFileLocation,
        Sound.LIBRARY,
        null
      );
    } catch (error) {
      if (error) {
        console.log("failed to load the sound", error);
        return;
      }
    }
  };
  playSound = async () => {
    this.setState({ playing: true });
    console.log(
      "duration in seconds: " +
        this.currentSound.getDuration() +
        " number of channels: " +
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
        this.setState({ playTime: 0, playing: false });
        clearInterval(this.currentPlayTimeInterval);
      } else {
        console.log("playback failed due to audio decoding errors");
      }
    });
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

  pauseSound = async () => {
    this.setState({ playing: false });
    clearInterval(this.currentPlayTimeInterval);
    this.currentSound.pause();
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
    if (this.state.recordingFileLocation.length > 0) {
      const path =
        RNFS.DocumentDirectoryPath + "/" + this.state.recordingFileLocation;
      RNFS.unlink(path).then(() => {
        console.log("previously loaded file deleted");
      });
    }
    this.setState(
      {
        recordingFileLocation:
          "../Documents/RNFetchBlob_tmp/" +
          download
            .path()
            .split("/")
            .pop()
      },
      () => {
        this.loadSound();
      }
    );
  };
  onDeleteSong = async (id, e) => {
    response = await fetch(base_path + "/song/delete/" + id.toString());
    response = await response.json();
    console.log(response.msg);
  };
  onAnalyzeSong = async (id, e) => {
    response = await fetch(base_path + "/song/analyze/" + id.toString());
    response = await response.json();
    this.setState({
      song_analysis: {
        tempo: response.tempo,
        frequencies: response.common_frequencies
      }
    });
    console.log(response);
  };
  getAudioTimeString(seconds) {
    // const h = parseInt(seconds / (60 * 60));
    const m = parseInt((seconds % (60 * 60)) / 60);
    const s = parseInt(seconds % 60);
    const ms = parseInt(Math.floor((seconds * 100) % 100));

    return (
      // (h < 10 ? "0" + h : h) +
      // ":" +
      (m < 10 ? "0" + m : m) +
      ":" +
      (s < 10 ? "0" + s : s) +
      ":" +
      (ms < 10 ? "0" + ms : ms)
    );
  }
  componentWillUnmount() {
    if (this.state.recordingFileLocation.length > 0) {
      const path =
        RNFS.DocumentDirectoryPath + "/" + this.state.recordingFileLocation;
      RNFS.unlink(path).then(() => {
        console.log("previously loaded file deleted");
      });
    }
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
        <ScrollView>
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
                icon={<Icon type="material" name="replay-10" />}
              />
              <Button
                style={styles.button}
                icon={
                  <Icon
                    type="material"
                    name={this.state.playing ? "pause" : "play-arrow"}
                  />
                }
                onPress={this.state.playing ? this.pauseSound : this.playSound}
              />
              <Button
                style={styles.button}
                icon={<Icon type="material" name="forward-10" />}
              />
            </View>
          </Card>
          <Card title="Save clip to cloud">
            <View style={styles.buttonContainer}>
              <Button
                style={styles.button}
                icon={<Icon type="material" name="cloud-upload" />}
                onPress={this.onFileSave}
              />
            </View>
          </Card>
          <Card title="Get saved songs">
            <View style={styles.buttonContainer}>
              <Button
                style={styles.button}
                icon={<Icon type="material" name="cloud-download" />}
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
          <Card title="Song Analysis">
            <Text style={styles.text}>
              Tempo:{" "}
              {this.state.song_analysis ? this.state.song_analysis.tempo : null}
            </Text>
            <Text style={styles.text}>Frequencies:</Text>
            <FlatList
              data={
                this.state.song_analysis
                  ? this.state.song_analysis.frequencies
                  : []
              }
              renderItem={({item})=> {
                console.log(item);
                return <Text style={styles.text}>{item}</Text>;
              }}
            />
          </Card>
        </ScrollView>
      </View>
    );
  }
}
