const gameSocket = io("/game");

gameSocket.emit("joinRoom", roomId);

gameSocket.emit("register", { username });

gameSocket.on("player-disconnect", initConnect);

function initConnect() {
  setTimeout(() => {
    fetch(`/getReader?id=${roomId}`)
      .then((response) => response.json())
      .then((data) => {
        if (username === data.reader) {
          start_button.disabled = false;
        } else {
          start_button.disabled = true;
        }
      })
      .catch((error) => console.error(error));
  }, 3000);
}

initConnect();

// 게임 시작 버튼을 클릭하면 startGame 함수를 실행합니다.
var start_button = document.getElementById("start-button");

var countdown = null;

start_button.addEventListener("click", function () {
  if (countdown === null) {
    // countdown이 null이면, 즉 게임이 시작되지 않은 상태이면 startGame 함수를 실행합니다.

    getReader().then((result) => {
      if (result) {
        startGame();
      } else {
        alert("방장만 게임시작 가능합니다.");
      }
    });
  } else {
    // countdown이 null이 아니면, 즉 이미 게임이 시작된 상태이면 취소합니다.
    cancelGame();
  }
});

function getReader() {
  return fetch(`/getReader?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      if (username === data.reader) {
        return true;
      } else {
        return false;
      }
    })
    .catch((error) => console.error(error));
}

// 버튼의 텍스트를 변경하는 함수
function updateButtonText(count) {
  start_button.innerHTML = `게임시작 카운트 :${count}`;
}

// 게임 시작 버튼을 클릭할 때 실행되는 함수
function startGame() {
  let count = 5; // 초기 카운트는 5입니다.
  gameSocket.emit("onCount", { count });

  // 1초마다 실행되는 함수
  countdown = setInterval(function () {
    count -= 1; // 카운트를 1씩 감소시킵니다.

    gameSocket.emit("onCount", { count });

    if (count === 0) {
      clearInterval(countdown); // 카운트가 0이 되면 interval을 멈춥니다.

      // 게임을 실행하는 코드를 여기에 작성합니다.
      gameSocket.emit("gameStart");
      gameSocket.emit("change-player"); // !
    }
  }, 1000);
}
// 게임 취소 버튼을 클릭할 때 실행되는 함수
function cancelGame() {
  clearInterval(countdown); // interval을 멈춥니다.
  countdown = null; // countdown 변수를 null로 초기화합니다.
  gameSocket.emit("gameEnd");

  gameSocket.emit("clearUserScore");
}

// 서버에서 'startTurn' 메시지를 받으면, 해당 사용자의 턴이 시작되었다는 것을 처리합니다.
gameSocket.on("gameStart", gameStart);
function gameStart() {
  drawingTool = true;
  onCanvasInit();
  onChatInit();
  onTimer();

  isPainterChat();
  isPainterPaint();
}

gameSocket.on("gameEnd", gameEnd);

function gameEnd() {
  drawingTool = false;
  onCanvasInit();
  stopTimer();

  clearInterval(turnTimer);
  turnTimer = null;

  var suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";

  isPainter = true;
  start_button.innerHTML = "게임 시작"; // 버튼의 텍스트를 초기화합니다.
}

gameSocket.on("currentPlayer", currentPlayer);

var turnTimer;

function currentPlayer() {
  // 30초 뒤 턴 자동 바뀜
  var count = 30;

  turnTimer = setInterval(function () {
    count -= 1; // 카운트를 1씩 감소시킵니다.

    if (count === 0) {
      clearInterval(turnTimer); // 카운트가 0이 되면 interval을 멈춥니다.
      gameSocket.emit("change-player");
    }
  }, 1000);

  isPainter = true;
  drawingTool = false;

  // 서버에서 단어 가지고 옴
  getWord();
}

function getWord() {
  var suggested_word = document.getElementById("suggested-word");
  fetch("/getRandomWord")
    .then((response) => response.json())
    .then((data) => {
      suggested_word.innerText = data.message;
    })
    .catch((error) => console.error(error));
}

gameSocket.on("exchange", onExchange);

function onExchange() {
  isPainterChat();
  isPainterPaint();
  onCanvasInit();

  clearInterval(turnTimer);
  turnTimer = null;

  var suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";
}

gameSocket.on("onCount", onCount);

function onCount(data) {
  updateButtonText(data.count); // 버튼의 텍스트를 갱신합니다.
}

gameSocket.on("userlist", onUserList);

function onUserList(data) {
  const chat_members = document.querySelector(".user-list");

  // chat_members의 자식 노드들을 모두 제거
  while (chat_members.firstChild) {
    chat_members.removeChild(chat_members.firstChild);
  }

  // data 배열에 있는 [key, value] 쌍을 반복하여 li 태그에 추가
  data.forEach(([key, value]) => {
    const li = document.createElement("li");
    li.textContent = `${key}님 점수: ${value}`;
    chat_members.appendChild(li);
  });
}

gameSocket.on("correct-player", onCorrectPlayer);

function onCorrectPlayer(data) {
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = `${data.username}님이 정답을 맞쳤습니다.`; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
  scrollToBottom(); // 스크롤을 최하단으로 내림
}
