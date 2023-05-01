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

    if (count === 0) {
      clearInterval(countdown); // 카운트가 0이 되면 interval을 멈춥니다.
      console.log("게임이 시작됩니다!");
      // 게임을 실행하는 코드를 여기에 작성합니다.

      //캔버스와 채팅 초기화
      onCanvasInit();
      onChatInit();

      chatSocket.emit("game-start");
      canvasSocket.emit("game-start");

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
}
