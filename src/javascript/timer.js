const timerSocket = io("/timer");

timerSocket.emit("joinRoom", roomId);

// 서버로부터 경과시간 실시간 카운트를 받음
timerSocket.on("elapsedTime", function (data) {
  let elapsedTime = data.elapsedTime;

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = elapsedTime;
});

// 서버로부터 남은시간 실시간 카운트를 받음
timerSocket.on("remainingTime", function (data) {
  let remainingTime = data.remainingTime;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = remainingTime;
});

// 게임시작버튼을 누르고 5초뒤 서버로 부터 시작 명령을 받아 해야할일을 처리하도록 명령받음
timerSocket.on("start", onStart);

function onStart() {
  // 방장 이라면
  if (boss) {
    // 게임 소켓 서버에게 자신의 방을 전체 방 목록에 추가시키게 전송!
    gameSocket.emit("gameStart");

    //서버에게 플레이어 턴을 변경해라고 전송!
    gameSocket.emit("change-player");

    // 게임시작 버튼을 누르면 이제 취소되도록 설정시킴
    isStart = true;

    // 타이머 소켓에게 경과시간을 시작해라고 전송!
    timerSocket.emit("elapsedTime");

    // 타이머 소켓에게 남은시간을 시작해라고 전송!
    timerSocket.emit("remainingTime");
  }
}

// 타이머 소켓으로 부터 받은 실시간 카운트 감소를 받아 클라이언트에게 표시하기 위한 역할
timerSocket.on("count", onCount);

function onCount(count) {
  start_button.innerHTML = `게임시작 카운트 :${count}`;
}

// 서버로 부터 게임시작 대기 카운트중 한버더 눌러서 취소하면 게임시작 버튼 태그를 초기화시키도록 함
timerSocket.on("waitstop", onWait);

function onWait() {
  start_button.innerHTML = "게임 시작";
}

//서버로 부터 남은시간이 끝나 변경될때 호출되어서 하나의 클라이언트만 받음, 게임시작(방장)만 부르네?
timerSocket.on("timeout-change", onTimeoutChange);

function onTimeoutChange() {
  // 남은 시간을 새롭게 시작하도록 전송!
  timerSocket.emit("remainingTime");

  //플레이어의 턴을 변경하도록 전송!
  gameSocket.emit("change-player");
}
