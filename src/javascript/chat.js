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

// 처음에는 사용자가 입력한 메세지를 검증하지 않도록 함
let isPainter = true;

//채팅 폼
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작 방지

  //해당 클라이언트 사용자 이름
  const name = username;

  // 입력된 메시지
  const message = input.value.trim();

  if (message) {
    const li = document.createElement("li");
    li.textContent = `${name}: ${message}`;

    // message 클래스 추가
    li.classList.add("message");
    ul.appendChild(li);

    // 입력창을 초기화
    input.value = "";

    // 채팅 소켓에게 사용자 이름, 입력한 메세지를 전송
    chatSocket.emit("message", { name, message });

    // 스크롤을 최하단으로 내림
    ul.scrollTop = ul.scrollHeight;

    // 내가 지금 그림을 그리는 클라이언트가 아니라면
    if (!isPainter) {
      // 클라이언트가 입력한 값을 POST전송 방식으로 서버에게 메시지와 클라이언트가 속한 방 번호를 전송
      fetch("/checkChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, roomId }),
      })
        .then((response) => response.json())
        .then((result) => {
          // 서버로 부터 서버의 값과 입력한 값이 같다면
          if (result.result) {
            //게임 소켓에 맞은 클라이언트의 사용자 이름을 전송!
            gameSocket.emit("correct-player", { username });

            //타이머 소켓에 남은 시간 멈추게만 하도록 전송!
            timerSocket.emit("clear-remainingTime");

            //타이머 소켓에 남은 시간 처음부터 다시하라고 전송!
            timerSocket.emit("remainingTime");

            // 그 다음 플레이어의 턴으로 변경하도록 전송!
            gameSocket.emit("change-player");
          }
        })
        .catch((error) => console.error(error));
    }
  }
});

// 서버로 부터 메시지를 입력한 자신을 제외하고 같은 방에 접속한 사람들에게 메세지를 공유하도록 함
chatSocket.on("message", onChat);

function onChat(data) {
  const li = document.createElement("li");
  li.textContent = `${data.name}: ${data.message}`;

  // message 클래스 추가
  li.classList.add("message");
  ul.appendChild(li);

  // 스크롤을 최하단으로 내림
  ul.scrollTop = ul.scrollHeight;
}

// 서버로부터 게임이 시작되면 채팅 메세지를 초기화하도록 함수화
function onChatInit() {
  // 이전에 입력된 채팅 메세지가 있다면 반복문을 이용해 모두 삭제
  while (ul.firstChild) {
    ul.removeChild(ul.firstChild);
  }

  const li = document.createElement("li");
  li.textContent = "게임이 시작되었습니다.";
  li.classList.add("notice");
  li.classList.add("message");
  ul.appendChild(li);
}

// 게임이 시작되거나 플레이어 턴이 바뀔때 서버에서 호출되어 실행되는 함수화
function isPainterChat() {
  // 사람들에게 채팅을 입력할때마다 검증하게 함
  isPainter = false;
}
