var gameSocket = io("/game");

gameSocket.emit("register", { username });

// 게임 시작 버튼을 클릭하면 startGame 함수를 실행합니다.
var start_button = document.getElementById("start-button");

var countdown = null;

start_button.addEventListener("click", function () {
  if (countdown === null) {
    // countdown이 null이면, 즉 게임이 시작되지 않은 상태이면 startGame 함수를 실행합니다.
    startGame();
  } else {
    // countdown이 null이 아니면, 즉 이미 게임이 시작된 상태이면 취소합니다.
    cancelGame();
  }
});

// 버튼의 텍스트를 변경하는 함수
function updateButtonText(count) {
  start_button.innerHTML = `게임시작 카운트 :${count}`;
}

// 게임 시작 버튼을 클릭할 때 실행되는 함수
function startGame() {
  let count = 5; // 초기 카운트는 5입니다.
  updateButtonText(count); // 버튼의 텍스트를 5로 변경합니다.

  // 1초마다 실행되는 함수
  countdown = setInterval(function () {
    count -= 1; // 카운트를 1씩 감소시킵니다.
    updateButtonText(count); // 버튼의 텍스트를 갱신합니다.

    gameSocket.emit("gameStartCount", { count });

    if (count === 0) {
      clearInterval(countdown); // 카운트가 0이 되면 interval을 멈춥니다.
      console.log("게임이 시작됩니다!");
      // 게임을 실행하는 코드를 여기에 작성합니다.

      isPlaying = true;

      gameSocket.emit("gameTimer");

      //캔버스와 채팅 초기화
      onCanvasInit();
      onChatInit();

      chatSocket.emit("game-start");

      gameSocket.emit("gameStart");

      var suggested_word = document.getElementById("suggested-word");
      fetch("/getWord")
        .then((response) => response.json())
        .then((data) => {
          suggested_word.innerText = data.message;
        })
        .catch((error) => console.error(error));
    }
  }, 1000);
}
// 게임 취소 버튼을 클릭할 때 실행되는 함수
function cancelGame() {
  clearInterval(countdown); // interval을 멈춥니다.
  countdown = null; // countdown 변수를 null로 초기화합니다.
  start_button.innerHTML = "게임 시작"; // 버튼의 텍스트를 초기화합니다.
  stopTimer();
  gameSocket.emit("gameEnd");
  isPlaying = false;
}

// 서버에서 'startTurn' 메시지를 받으면, 해당 사용자의 턴이 시작되었다는 것을 처리합니다.
gameSocket.on("gameStart", onTurn);
function onTurn() {
  drawingTool = true;
  onCanvasInit();

  gameSocket.emit("play");
}

gameSocket.on("gameEnd", gameEnd);

function gameEnd() {
  drawingTool = false;
  onCanvasInit();
}

gameSocket.on("startTurn", startTurn);

function startTurn() {
  drawingTool = false;
  onCanvasInit();
}

gameSocket.on("endTurn", endTurn);

function endTurn() {
  drawingTool = true;
  onCanvasInit();
}

gameSocket.on("gameStartCount", onCount);

function onCount(data) {
  updateButtonText(data.count);
}

gameSocket.on("gameTimer", onTimer);

function onTimer() {
  startTimer();
}
