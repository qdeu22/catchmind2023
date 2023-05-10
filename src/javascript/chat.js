const chatSocket = io("/chat");

const form = document.querySelector("form");
const input = document.querySelector('input[type="text"]');
const ul = document.querySelector("ul");

const username = prompt("닉네임을 입력하세요.");

chatSocket.emit("joinRoom", roomId);

if (username === null || username === "") {
  window.location.href = "/";
}

function scrollToBottom() {
  ul.scrollTop = ul.scrollHeight;
}

const chat_username = document.querySelector(".chat-username");
chat_username.textContent = `${username}님 반갑습니다!!`;

//chatSocket.emit("members");

var isPainter = true;

form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작 방지

  const name = username;
  const message = input.value.trim(); // 입력된 메시지 가져오기
  if (message) {
    const li = document.createElement("li"); // 새로운 리스트 아이템 생성
    li.textContent = `${name}: ${message}`; // 리스트 아이템에 메시지 추가
    li.classList.add("message"); // message 클래스 추가
    ul.appendChild(li); // 리스트에 아이템 추가
    input.value = "";
    chatSocket.emit("message", { name, message });
    scrollToBottom(); // 스크롤을 최하단으로 내림

    if (!isPainter) {
      fetch("/checkChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.result) {
            chatSocket.emit("correct-player", { username });
            gameSocket.emit("change-player"); //임시!
          }
        })
        .catch((error) => console.error(error));
    }
  }
});

chatSocket.on("correct-player", onCorrectPlayer);

function onCorrectPlayer(data) {
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = `${data.username}님이 정답을 맞쳤습니다.`; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
  scrollToBottom(); // 스크롤을 최하단으로 내림
}

function isPainterChat() {
  isPainter = false; // 전부 초기화 , 그림그리는 사람은 채팅을 검사안한다는거지
}

chatSocket.on("message", onChat);

// chatSocket.on("members", onMembers);

function onChat(data) {
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = `${data.name}: ${data.message}`; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
  scrollToBottom(); // 스크롤을 최하단으로 내림
}

// function onMembers(data) {
//   const chat_members = document.querySelector(".chat-members");
//   chat_members.textContent = `현재 접속자 ${data}명`;
// }

chatSocket.emit("userlist", { username });

chatSocket.on("userlist", onUserList);

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

function onChatInit() {
  /**
   * 채팅 모든 글자 클리어
   */
  while (ul.firstChild) {
    // ul의 자식 노드가 존재하는 동안
    ul.removeChild(ul.firstChild); // ul의 첫 번째 자식 노드를 삭제
  }

  /**
   * 게임시작 문구 출력
   */
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = "게임이 시작되었습니다."; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
}
