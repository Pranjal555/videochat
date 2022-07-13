const socket = io("/");
const videoGrid = document.getElementById("video-grid");
var myPeer = new Peer();
const peers = {};
const myVideo = document.createElement("video");
var username = prompt("Enter your username");
var myStream = undefined;
myVideo.muted = true;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);
    myStream = stream;
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userid) => {
      connectToNewUser(userid, stream);
    });

    socket.on("user-disconnected", (userid) => {
      if (peers[userid]) {
        peers[userid].close();
      }
    });
  });
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, username);
});
function connectToNewUser(userid, stream) {
  const call = myPeer.call(userid, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", function () {
    video.remove();
  });
  peers[userid] = call;
}

//Logic for adding video streams
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", function () {
    video.play();
  });
  videoGrid.append(video);
}
////////////////////////////////

//Logic for sending message
var msg = document.getElementById("chat_message");
var send = document.getElementById("send");
var writtenmsgs = document.getElementById("messages");
send.addEventListener("click", (event) => {
  if (msg.value != "") {
    socket.emit("message", msg.value);
    msg.value = "";
  }
});
msg.addEventListener("keydown", (event) => {
  if (event.key == "Enter") {
    if (msg.value != "") {
      socket.emit("message", msg.value);
      msg.value = "";
    }
  }
});

socket.on("createmessage", (message, userid, username_) => {
  var newmessage = document.createElement("div");
  newmessage.innerHTML = `<span>${username_}</span>: ${message}`;
  messages.appendChild(newmessage);
});

//Options logic

const invite = document.getElementById("invite");
const mute = document.getElementById("mute");
const videostop = document.getElementById("videostop");

mute.addEventListener("click", (e) => {
  if (mute.className === "fa fa-microphone") {
    mute.className = "fa fa-microphone-slash";
    myStream.getAudioTracks()[0].enabled = false;
  } else {
    mute.className = "fa fa-microphone";
    myStream.getAudioTracks()[0].enabled = true;
  }
});

videostop.addEventListener("click", (e) => {
  if (videostop.className === "fa fa-video-camera") {
    videostop.className = "fa fa-microphone-slash";
    myStream.getVideoTracks()[0].enabled = false;
  } else {
    videostop.className = "fa fa-video-camera";
    myStream.getVideoTracks()[0].enabled = true;
  }
});

invite.addEventListener("click", (e) => {
  prompt(
    "copy and share this link to invite someone to your video call",
    window.location.href
  );
});
