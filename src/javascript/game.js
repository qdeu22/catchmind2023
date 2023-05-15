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
let start_button = document.getElementById("start-button");

let isStart = false;

let boss = false; // 방장

start_button.addEventListener("click", function () {
  if (!isStart) {
    fetch(`/getPlayer?id=${roomId}`)
      .then((response) => response.json())
      .then((data) => {
        if (data) {
          getReader().then((result) => {
            if (result) {
              boss = true;
              timerSocket.emit("start");
            } else {
              alert("방장만 게임시작 가능합니다.");
            }
          });
        } else {
          alert("2명이상이어야 게임시작 가능합니다.");
        }
      })
      .catch((error) => console.error(error));
  } else {
    gameSocket.emit("gameEnd");
    gameSocket.emit("clearUserScore");
    isStart = false;
    boss = false;

    timerSocket.emit("stop");
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

// 서버에서 'startTurn' 메시지를 받으면, 해당 사용자의 턴이 시작되었다는 것을 처리합니다.
gameSocket.on("gameStart", gameStart);
function gameStart() {
  drawingTool = true;
  onCanvasInit();
  onChatInit();

  isPainterChat();
  isPainterPaint();
}

gameSocket.on("gameEnd", gameEnd);

function gameEnd() {
  drawingTool = false;
  onCanvasInit();

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";

  isPainter = true;
  start_button.innerHTML = "게임 시작"; // 버튼의 텍스트를 초기화합니다.

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;
}

gameSocket.on("roundOfGameSet", onRoundOfGameSet);

function onRoundOfGameSet() {
  drawingTool = false;
  isPainter = true;

  onCanvasInit();

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";
  start_button.innerHTML = "게임 시작"; // 버튼의 텍스트를 초기화합니다.

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;

  while (ul.firstChild) {
    // ul의 자식 노드가 존재하는 동안
    ul.removeChild(ul.firstChild); // ul의 첫 번째 자식 노드를 삭제
  }

  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = "게임이 종료되었습니다."; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가

  if (boss) {
    gameSocket.emit("clearUserScore");
    timerSocket.emit("stop");
    isStart = false;
    boss = false;
  }
}

gameSocket.on("currentPlayer", currentPlayer);

function currentPlayer() {
  isPainter = true;
  drawingTool = false;

  // 서버에서 단어 가지고 옴
  getWord();
}

function getWord() {
  let suggested_word = document.getElementById("suggested-word");
  fetch(`/getRandomWord?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      suggested_word.innerText = data.message;
    })
    .catch((error) => console.error(error));
}

gameSocket.on("members", onMembers);

function onMembers(data) {
  const chat_members = document.querySelector(".chat-members");
  chat_members.textContent = `현재 접속자 ${data}명`;
}

gameSocket.on("exchange", onExchange);

function onExchange() {
  isPainterChat();
  isPainterPaint();
  onCanvasInit();

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";
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
  ul.scrollTop = ul.scrollHeight; // 스크롤을 최하단으로 내림
}

gameSocket.on("escape", onEscape);

function onEscape() {
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  gameSocket.emit("clearUserScore");

  drawingTool = false;
  onCanvasInit();

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";

  isPainter = true;
  start_button.innerHTML = "게임 시작"; // 버튼의 텍스트를 초기화합니다.

  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = "탈주자 발생으로 게임이 강제 종료되었습니다."; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가

  boss = false;
  isStart = false;

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;
}

gameSocket.on("random-escape", onRandomEscape);

function onRandomEscape() {
  timerSocket.emit("stop");
}
