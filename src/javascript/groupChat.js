function groupChatButtons() {
  window.location.hash = "groupChat"; //북마크
  fetch("channel/group")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      // groupChat 소켓 연결 생성
      const socket = io("/groupChat");
    })
    .catch((error) => console.log(error));
}

function roomButtons() {
  window.location.hash = "gameRoom";
  fetch("channel/room.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      // groupChat 소켓 연결 생성
      const socket = io("/room");
    })
    .catch((error) => console.log(error));
}
