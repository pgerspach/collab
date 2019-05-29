import React, { Component } from "react";
import { connect } from "react-redux";
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
  Overlay
} from "react-native-elements";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import Sound from "react-native-sound";
import { bindActionCreators } from "redux";
import * as session from "collab/src/services/session";
import * as usersActionCreators from "collab/src/data/users/actions";
import * as usersSelectors from "collab/src/data/users/selectors";
Sound.setCategory("Playback");
console.log(Sound.LIBRARY);
import RNFS from "react-native-fs";
import RNFetchBlob from "react-native-fetch-blob";
import { fetchApi } from "../../services/api";
import * as sessionApi from "../../services/session";

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
    backgroundColor: "#000",
  },
  buttonContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around"
  },
  buttonContainerHalf: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around"
  },
  cardHalf: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around"
  },
  button: {
    width: 90,
    height: 50
  },
  smallButton: {
    width: 50,
    height: 50
  },
  text: {
    fontSize: 15,
    color: "#000000"
  },
  twoCardContainer: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "stretch"
  },
  overlay: {
    backgroundColor: "#000"
  },
  overlayText: {
    color: "#fff"
  }
});

class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      recordTime: "0:00",
      playTime: 0,
      duration: null,
      recordingFileLocation: "",
      mySongs: [],
      uploadPath: "",
      playing: false,
      song_analysis: null,
      recording: false,
      logOutVisible: false,
      playDisabled: false
    };
    this.currentSound = null;
    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.logOut = this.logOut.bind(this);
  }
  componentDidMount() {
    console.log(this.props);

    RNFetchBlob.session("temp-session").dispose();
  }
  onStartRecord = async () => {
    const result = await this.audioRecorderPlayer.startRecorder();
    this.audioRecorderPlayer.addRecordBackListener(e => {
      this.setState({
        recordTime: this.audioRecorderPlayer.mmssss(
          Math.floor(e.current_position)
        )
      });
      return;
    });
    this.setState({
      recordingFileLocation: "../tmp/" + result.split("/").pop(),
      uploadPath: result,
      recording: true
    });

    console.log(this.state);
  };
  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();
    this.setState({
      recording: false
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
    xhr.setRequestHeader(
      "Authorization",
      `Token ${this.props.services.session.tokens.access.value}`
    );
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
  pauseSound = async () => {
    this.setState({ playing: false });
    clearInterval(this.currentPlayTimeInterval);
    this.currentSound.pause();
  };
  setBack = async () => {
    let timeSet = this.state.playTime - 5;
    timeSet = timeSet < 0 ? 0 : timeSet;
    this.setState({playTime:timeSet});
    this.currentSound.setCurrentTime(timeSet);
    this.pauseSound();
  };
  setForward = async () => {
    let timeSet = this.state.playTime + 5;
    timeSet = timeSet >this.currentSound.getDuration() ? 0 : timeSet;
    this.setState({playTime:timeSet});
    this.currentSound.setCurrentTime(timeSet);
    this.pauseSound();
  };
  onGetSongs = () => {
    try {
      fetchApi("/song/get/").then(response => {
        this.setState({ mySongs: response.songs });
      });
    } catch (error) {
      console.log(error);
    }
  };
  onSelectSong = async (id, e) => {
    this.setState({ playDisabled: true });
    response = await fetchApi("/song/load/" + id.toString());
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
        this.setState({ playDisabled: false });
      }
    );
  };
  onDeleteSong = async (id, e) => {
    response = await fetchApi("/song/delete/" + id.toString());
    console.log(response.msg);
  };
  onAnalyzeSong = async (id, e) => {
    response = await fetchApi("/song/analyze/" + id.toString());
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
  logOut() {
    sessionApi.revoke().then(() => {
      console.log(this.props);
      this.props.navigation.replace("Login");
    });
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
          centerComponent={{ text: "Collab", style: { color: "#fff",fontSize:20 } }}
          rightComponent={
            <Button
              onPress={() => this.setState({ logOutVisible: true })}
              type="clear"
              // icon={<Icon name="home" color="#fff" />}
              title="Log out"
              titleStyle={{fontSize:15}}
            />
          }
        />
        <Overlay
          isVisible={this.state.logOutVisible}
          windowBackgroundColor="rgba(255, 255, 255, .5)"
          overlayBackgroundColor="rgb(0, 0, 0)"
          overlayStyle={styles.overlay}
          width="auto"
          height="auto"
          onBackdropPress={() => this.setState({ logOutVisible: false })}
        >
          <View style={{alignItems:"center"}}>
            <Text style={styles.overlayText}>
              Are you sure you want to log out?
            </Text>
            <Button title={"Yes"} style={{...styles.button,marginTop:8}} onPress={this.logOut} />
            <Button
              title={"No"}
              style={styles.button}
              onPress={() => this.setState({ logOutVisible: false })}
            />
          </View>
        </Overlay>
        <ScrollView>
          <View style={styles.twoCardContainer}>
            <Card
              containerStyle={styles.cardHalf}
              title={this.state.recordTime}
            >
              <View style={styles.buttonContainerHalf}>
                <Button
                  style={styles.button}
                  icon={
                    this.state.recording ? (
                      <Icon type="foundation" name="stop" />
                    ) : (
                      <Icon type="entypo" name="mic" />
                    )
                  }
                  onPress={
                    this.state.recording
                      ? this.onStopRecord
                      : this.onStartRecord
                  }
                />
              </View>
            </Card>
            <Card containerStyle={styles.cardHalf} title="Save clip">
              <View style={styles.buttonContainerHalf}>
                <Button
                  style={styles.button}
                  icon={<Icon type="material" name="cloud-upload" />}
                  onPress={this.onFileSave}
                />
              </View>
            </Card>
          </View>
          <Card title={this.getAudioTimeString(this.state.playTime)}>
            <View style={styles.buttonContainer}>
              <Button
                style={styles.button}
                icon={<Icon type="material" name="replay-5" />}
                onPress = {this.setBack}
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
                disabled={this.state.playDisabled}
              />
              <Button
                style={styles.button}
                icon={<Icon type="material" name="forward-5" />}
                onPress = {this.setForward}
              />
            </View>
          </Card>
          <View>
            <Card title={null}>
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
                    <Text>{item.id}:</Text>
                    <Text
                      onPress={this.onSelectSong.bind(this, item.id)}
                      style={styles.text}
                    >
                      Load
                    </Text>
                    <Text
                      onPress={this.onDeleteSong.bind(this, item.id)}
                      style={styles.text}
                    >
                      Delete
                    </Text>
                    <Text
                      onPress={this.onAnalyzeSong.bind(this, item.id)}
                      style={styles.text}
                    >
                      Analyze
                    </Text>
                  </View>
                )}
              />
            </Card>
          </View>

          <Card title="Song Analysis">
            <Text style={styles.text}>
              Tempo:{" "}
              {this.state.song_analysis
                ? this.state.song_analysis.tempo.join("  ")
                : null}
            </Text>
            <Text style={styles.text}>Frequencies:</Text>
            <FlatList
              data={
                this.state.song_analysis
                  ? this.state.song_analysis.frequencies
                  : []
              }
              renderItem={({ item }) => {
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
export default connect(
  state => ({
    data: {
      users: state.data.users
    },
    services: state.services
  }),
  dispatch => ({
    actions: {
      users: bindActionCreators(usersActionCreators, dispatch)
    }
  })
)(Home);
