const groupChatButton = document.querySelector(".groupChat");
function groupChatButtons() {
  groupChatButton.disabled = true;
  window.location.hash = "groupChat"; //북마크
  fetch("channel/group")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;
      const script = document.createElement("script");
      script.src = "javascript/chat.js";
      document.head.appendChild(script); //동적 ???
      // groupChat 소켓 연결 생성
      const socket = io("/groupChat");
    })
    .catch((error) => console.log(error));
}

function roomButtons() {
  groupChatButton.disabled = false;
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
