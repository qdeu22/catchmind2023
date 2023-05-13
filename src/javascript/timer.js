const timerSocket = io("/timer");

timerSocket.emit("joinRoom", roomId);

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

timerSocket.on("start", onStart);

function onStart() {
  if (boss) {
    gameSocket.emit("gameStart");
    gameSocket.emit("change-player");
    isStart = true;

    timerSocket.emit("elapsedTime"); // !
    timerSocket.emit("remainingTime"); // !
  }
}

timerSocket.on("count", onCount);

function onCount(count) {
  start_button.innerHTML = `게임시작 카운트 :${count}`;
}
