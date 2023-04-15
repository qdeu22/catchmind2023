var groupChatButton = document.querySelector(".groupChat");
var chatContainer = document.querySelector(".box-contents");

groupChatButton.addEventListener("click", function () {
  window.location.hash = "groupChat"; //북마크
  fetch("channel/group.html")
    .then((response) => response.text())
    .then((html) => {
      document.getElementById("content").innerHTML = html;

      // 이벤트 리스너 등록하기
      const showAlert = document.querySelector(".showAlert");
      showAlert.addEventListener("click", function () {
        alert("hello");
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
