const timerSocket = io("/timer");

timerSocket.emit("joinRoom", roomId);

var startButton = document.getElementById("start-button");
startButton.onclick = function () {
  timerSocket.emit("elapsedTime"); // 서버에 요청을 보냄
  timerSocket.emit("remainingTime"); // 서버에 요청을 보냄
};

timerSocket.on("elapsedTime", function (data) {
  // 서버로부터 실시간 카운트를 받음
  var elapsedTime = data.elapsedTime;

  // HTML 요소를 업데이트
  var elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = elapsedTime;
});

timerSocket.on("remainingTime", function (data) {
  // 서버로부터 실시간 카운트를 받음
  var remainingTime = data.remainingTime;

  // HTML 요소를 업데이트
  var remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = remainingTime;
});
