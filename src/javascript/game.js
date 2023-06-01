const gameSocket = io("/game");

const start_button = document.getElementById("start-button");

gameSocket.emit("joinRoom", roomId);

// 방에 입장하면 자동으로 게임 소켓 서버에게 사용자이름을 등록!
gameSocket.emit("register", { username });

// 탈주자나 방을 이탈하면 게임 소켓에서 방장이 누군지 전달 받음!
gameSocket.on("player-disconnect", initConnect);

// 해당 방의 첫번째 유저가 누군지(방장) 서버에게 요청
function initConnect() {
  setTimeout(() => {
    fetch(`/getReader?id=${roomId}`)
      .then((response) => response.json())
      .then((data) => {
        // 방장이라면 게임시작 버튼을 활성화
        if (username === data.reader) {
          start_button.disabled = false;
        } else {
          start_button.disabled = true;
        }
      })
      .catch((error) => console.error(error));
  }, 3000);
}

// 처음 접속하면 방장을 가져옴
initConnect();

// 처음 클라이언트는 방장 포함 모두 실행안됬으니깐 설정
let isStart = false;

// 방장인가요?
let boss = false;

start_button.addEventListener("click", function () {
  //게임 시작이 안됬으면
  if (!isStart) {
    /**
     * 서버에게 게임시작을 위해 같은 방에 현재 유저가 몇명인지 요청하기
     * @param data 2명이상을 충족 => true, 2명 미만 => false
     */
    fetch(`/getPlayer?id=${roomId}`)
      .then((response) => response.json())
      .then((data) => {
        // 2명이상이라면
        if (data) {
          /**
           * 방장만 게임시작버튼을 누르면 작동
           * @param result 첫번째 유저라면 true
           */
          getReader().then((result) => {
            // 방장이라면
            if (result) {
              boss = true;

              // 타이머 소켓에게 5초 카운트 해달라고 요청
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
    // 방장이 서버에게 게임시작때 생성된 자기 방정보를 필터링 요청
    gameSocket.emit("gameEnd");

    // 방장이 서버에게 유저 목록을 0으로 초기화하도록 요청
    gameSocket.emit("clearUserScore");

    // 게임중이 아니라고 설정
    isStart = false;

    // 보스 권한 종료
    boss = false;

    // 방장이 서버에게 경과시간, 남은시간을 모두 종료해달라고 요청
    timerSocket.emit("stop");
  }
});

// 서버에서 첫번째 유저와 이 클라이언트 유저가 같다면 방장이라는 함수
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

// 서버에서 게임 시작 명령을 받아 해야할 init을 설정
gameSocket.on("gameStart", gameStart);
function gameStart() {
  //캔버스와 채팅 초기화
  onCanvasInit();
  onChatInit();

  // 채팅 입력하면 검증되도록 설정
  isPainterChat();

  // 모든 사람 그림그리기 X
  isPainterPaint();
}

//서버에서 게임 종료를 받으면 모든 클라이언트에서 실행되는 함수
gameSocket.on("gameEnd", gameEnd);

function gameEnd() {
  // 모든 사람이 그림그리기 가능
  drawingTool = false;

  // 채팅을 입력하면 검증 X
  isPainter = true;

  // 캔버스 초기화
  onCanvasInit();

  // 모든 사람 그림 지우기 버튼 o
  isClearAuthority = true;

  const painter_name = document.getElementById("painter-name");
  painter_name.innerText = "게임 중이 아닙니다.";

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";

  start_button.innerHTML = "게임 시작";

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;
}

// 서버로 부터 라운드가 종료되어 게임이 종료되면 받는 함수
gameSocket.on("roundOfGameSet", onRoundOfGameSet);

function onRoundOfGameSet() {
  drawingTool = false;
  isPainter = true;

  onCanvasInit();

  // 모든 사람 그림 지우기 버튼  o
  isClearAuthority = true;

  const painter_name = document.getElementById("painter-name");
  painter_name.innerText = "게임 중이 아닙니다.";

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";
  start_button.innerHTML = "게임 시작";

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;

  // 모든 채팅 초기화
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  const li = document.createElement("li");
  li.textContent = "게임이 종료되었습니다.";
  li.classList.add("notice");
  li.classList.add("message");
  ul.appendChild(li);

  // 이 데이터를 받은 클라이언트가 방장이라면
  if (boss) {
    // 서버에게 게임결과를 요청
    gameSocket.emit("gameResult");

    // 서버에게 경과시간, 남은시간을 멈춰달라고 요청
    timerSocket.emit("stop");

    //모든 권한 해제
    isStart = false;
    boss = false;
  }
}

// 현재 제시어를 받고 그림을 그리는 사람인 클라이언트만 받음
gameSocket.on("currentPlayer", currentPlayer);

function currentPlayer() {
  //그림을 그리는 사람은 채팅 검증 X
  isPainter = true;

  // 그림을 그릴 수 있음
  drawingTool = false;

  // 모든 사람 그림 지우기 버튼  o
  isClearAuthority = true;

  // 서버에서 단어 가지고 옴
  getWord();
}

function getWord() {
  let suggested_word = document.getElementById("suggested-word");

  /**
   * 서버로 부터 랜덤단어를 가지고 옴
   * @param data.message 제시어
   */
  fetch(`/getRandomWord?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      suggested_word.innerText = data.message;
    })
    .catch((error) => console.error(error));
}

// 모든 클라이언트는 실시간으로 현재 방에 접속한 수를 알 수 있음
gameSocket.on("members", onMembers);

function onMembers(data) {
  const chat_members = document.querySelector(".chat-members");
  chat_members.textContent = `현재 접속자 ${data}명`;
}

// 플레이언의 턴이 바뀔때 모든 클라이언트는 이것을 받음
gameSocket.on("exchange", onExchange);

function onExchange() {
  // 모두 그림을 그릴수 없게 함
  isPainterPaint();

  // 모두 채팅값 검증하도록 함
  isPainterChat();

  //캔버스 초기화
  onCanvasInit();

  // 모든 사람 그림 지우기 버튼  x
  isClearAuthority = false;

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";
}

// 모든 클라이언트는 방에 참가하면 현재 어떤 사람이 있는지 알수 있게 함
gameSocket.on("userlist", onUserList);

function onUserList(data) {
  const chat_members = document.querySelector(".user-list");

  while (chat_members.firstChild) {
    chat_members.removeChild(chat_members.firstChild);
  }

  // data 배열에 있는 [key, value] 쌍을 반복하여 li 태그에 사용자를 추가
  data.forEach(([key, value]) => {
    const li = document.createElement("li");
    li.textContent = `${key}님 점수: ${value}`;
    chat_members.appendChild(li);
  });
}

// 서버로부터 라운드가 끝나 게임이 종료되면 결과를 받아 등수 표시
gameSocket.on("ranklist", onRanklist);

function onRanklist(data) {
  const chat_members = document.querySelector(".rank");

  while (chat_members.firstChild) {
    chat_members.removeChild(chat_members.firstChild);
  }

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `순위: ${item.rank}등!! ${item.name}님 점수: ${item.value}`;
    chat_members.appendChild(li);
  });
}

// 채팅을 입력하여 맞은 사람이 있는 경우 모든 클라이언트에게 이것을 받음
gameSocket.on("correct-player", onCorrectPlayer);

function onCorrectPlayer(data) {
  const li = document.createElement("li");
  li.textContent = `${data.username}님이 정답을 맞쳤습니다.`;
  li.classList.add("message");
  ul.appendChild(li);

  // 스크롤을 최하단으로 내림
  ul.scrollTop = ul.scrollHeight;
}

// 탈주자가 발생하면 모든 클라이언트는 이것을 받음
gameSocket.on("escape", onEscape);

function onEscape() {
  //모든 채팅 삭제
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  // 서버에게 모든 유저 점수 초기화 요청
  gameSocket.emit("clearUserScore");

  // 모든 유저 그림 그릴 수 있음
  drawingTool = false;

  //캔버스 초기화
  onCanvasInit();

  // 모든 사람 그림 지우기 버튼  o
  isClearAuthority = true;

  let suggested_word = document.getElementById("suggested-word");
  suggested_word.innerText = "-";

  const painter_name = document.getElementById("painter-name");
  painter_name.innerText = "게임 중이 아닙니다.";

  //모든 유저 채팅 검증 X
  isPainter = true;
  start_button.innerHTML = "게임 시작";

  const li = document.createElement("li");
  li.textContent = "탈주자 발생으로 게임이 강제 종료되었습니다.";
  li.classList.add("notice");
  li.classList.add("message");
  ul.appendChild(li);

  //모든 클라이언트에게 설정
  boss = false;
  isStart = false;

  let elapsedTimeElement = document.getElementById("elapsed-time");
  elapsedTimeElement.innerHTML = 0;

  let remainingTimeElement = document.getElementById("remaining-time");
  remainingTimeElement.innerHTML = 60;
}

// 탈주자가 발생했을때 방장이 나갈수가 있기때문에 같은 방 아무나 한명을 무작위로 받게함
gameSocket.on("random-escape", onRandomEscape);

function onRandomEscape() {
  //서버에게 경과시간, 남은시간 멈추게 요청
  timerSocket.emit("stop");
}

// 모든 클라이언트는 랭킹 목록을 삭제시킴
gameSocket.on("clear-ranklist", onClearRankList);

function onClearRankList() {
  const chat_members = document.querySelector(".rank");

  while (chat_members.firstChild) {
    chat_members.removeChild(chat_members.firstChild);
  }
}

// 모든 클라이언트는 게임이 시작되면 누구의 플레이어 턴(그림그리는 사람)인지 이름을 확인
gameSocket.on("next-player-name", onNextPlayerName);

function onNextPlayerName(username) {
  const painter_name = document.getElementById("painter-name");
  painter_name.innerText = username;
}
