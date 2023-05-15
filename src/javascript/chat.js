const chatSocket = io("/chat");

const form = document.querySelector("form");
const input = document.querySelector('input[type="text"]');
const ul = document.querySelector("ul");

const chat_username = document.querySelector(".chat-username");
const room_number = document.getElementById("room-number");

const h1 = document.createElement("h1");
h1.textContent = `${roomId}번 방입니다.`;

room_number.appendChild(h1);

chat_username.textContent = `${username}님 반갑습니다!!`;

chatSocket.emit("joinRoom", roomId);

let isPainter = true;

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
    ul.scrollTop = ul.scrollHeight; // 스크롤을 최하단으로 내림

    if (!isPainter) {
      fetch("/checkChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, roomId }),
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.result) {
            gameSocket.emit("correct-player", { username });
            timerSocket.emit("clear-remainingTime"); //남은 시간 초기화! 여기서는 멈추게만 함!
            timerSocket.emit("remainingTime");
            gameSocket.emit("change-player"); //임시!
          }
        })
        .catch((error) => console.error(error));
    }
  }
});

function isPainterChat() {
  isPainter = false;
}

chatSocket.on("message", onChat);

function onChat(data) {
  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = `${data.name}: ${data.message}`; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
  ul.scrollTop = ul.scrollHeight; // 스크롤을 최하단으로 내림
}

function onChatInit() {
  while (ul.firstChild) {
    // ul의 자식 노드가 존재하는 동안
    ul.removeChild(ul.firstChild); // ul의 첫 번째 자식 노드를 삭제
  }

  const li = document.createElement("li"); // 새로운 리스트 아이템 생성
  li.textContent = "게임이 시작되었습니다."; // 리스트 아이템에 메시지 추가
  li.classList.add("message"); // message 클래스 추가
  ul.appendChild(li); // 리스트에 아이템 추가
}
