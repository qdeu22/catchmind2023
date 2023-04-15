var groupChatButton = document.querySelector(".groupChat");
var chatContainer = document.querySelector(".box-contents");

groupChatButton.addEventListener("click", function () {
  window.location.hash = "groupChat"; //북마크
  fetch("channel/group")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      // 소켓 연결 생성
      const socket = io("/groupChat");
      // 이벤트 리스너 등록하기
      const sendButton = document.querySelector(".send-button");
      sendButton.addEventListener("click", function () {
        // 메시지를 보내는 코드
        const input = document.querySelector(".chatting-input");
        const message = input.value;
        socket.emit("chat message", message); //서버에게 전달
        input.value = "";
      });
      const name = document.getElementById("name");
      // 서버로부터 메시지를 받는 이벤트 리스너 등록하기
      const messagesList = document.querySelector(".chatting-list");
      socket.on("chat message", function (data) {
        const li = document.createElement("li");
        li.classList.add(name.innerHTML === data.name ? "sent" : "received"); //
        console.log(name.innerHTML === data.name);
        console.log(name.innerHTML);
        console.log(data.name);
        li.innerText = data.msg;
        messagesList.appendChild(li);
      });
    })
    .catch((error) => console.log(error));
});

var gameRoomButton = document.querySelector(".gameRoom");
gameRoomButton.addEventListener("click", function () {
  window.location.hash = "gameRoom";
  fetch("channel/room.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;
    })
    .catch((error) => console.log(error));
});
