const roomModal = document.getElementById("room-modal");
const roomModalClose = document.getElementById("room-modal-close");
const inputRoomName = document.getElementById("room-name");
const roomList = document.getElementById("room-list");

const createBtn = document.getElementById("create-room");
const deleteBtn = document.getElementById("delete-room");

const roomCreateButton = document.getElementById("room-create-button");

// 방 생성 버튼
createBtn.addEventListener("click", createRoomModal);

// 방 삭제 버튼
deleteBtn.addEventListener("click", deleteRoom);

// 생성 버튼
roomCreateButton.addEventListener("click", createRoom);

// 모달창 띄우기
function createRoomModal() {
  roomModal.style.display = "block";
}

// 모달창 닫기
roomModalClose.onclick = function () {
  roomModal.style.display = "none";

  // 방 이름 입력값 초기화
  inputRoomName.value = "";
};

function createRoom() {
  // 방 이름
  const roomName = document.getElementById("room-name").value;

  /**
   * 서버로 POST형식 방 생성 요청 보내기
   * @param roomName 방 이름
   */
  fetch("/room/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roomName: roomName,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      // 성공적으로 방이 생성된 경우
      if (data.success) {
        alert(`새로운 ${roomName} 방을 생성합니다.`);

        const roomList = document.getElementById("room-list");

        const roomListItem = document.createElement("li");
        const roomLink = document.createElement("a");
        roomLink.href = `/room/${data.roomId}`;
        roomLink.textContent = roomName;
        roomLink.setAttribute("data-room-id", `${data.roomId}`);
        roomListItem.appendChild(roomLink);
        roomList.appendChild(roomListItem);

        // 새 탭으로 열기
        window.open(`/room/${data.roomId}`, "_blank");
      } else {
        alert("방 생성에 실패했습니다.");
      }
    })
    .catch((err) => console.error(err));

  // 모달창 닫기
  roomModal.style.display = "none";
  inputRoomName.value = "";
}

/**
 * 서버로 부터 생성된 모든 방 목록을 가져와 반복문을 통해 생성되어있는 방을 표시하도록함
 * @param rooms 생성된 모든 방 정보
 */
fetch("/rooms")
  .then((res) => res.json())
  .then((rooms) => {
    const roomList = document.getElementById("room-list");

    rooms.forEach((room) => {
      const roomListItem = document.createElement("li");
      const roomLink = document.createElement("a");
      roomLink.href = `/room/${room.id}`;
      roomLink.textContent = room.name;
      roomLink.setAttribute("data-room-id", `${room.id}`);
      roomListItem.appendChild(roomLink);
      roomList.appendChild(roomListItem);
    });
  })
  .catch((err) => console.error(err));

// 방 삭제 기능
function deleteRoom() {
  alert("선택한 방을 삭제합니다.");
}

// 표시된 방을 누를때
roomList.addEventListener("click", function (event) {
  // 클릭한 요소가 a 요소인 경우에 대해 처리
  if (event.target && event.target.nodeName === "A") {
    event.preventDefault(); // 기본 동작 방지

    // 방 번호
    const roomId = event.target.dataset.roomId;

    /**
     * 현재 클릭한 방이 게임중인지 아닌지를 서버에게 요청하는 Fetch API
     * @param roomId 방 번호
     * @param data 게임중 => true , 게임중 X => false
     */
    fetch("/checkRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomId }),
    })
      .then((response) => response.json())
      .then((data) => {
        // 게임중이지 않다면
        if (!data) {
          window.open(`/room/${roomId}`, "_blank");
        } else {
          alert("현재 게임중인 방입니다");
        }
      })
      .catch((err) => console.error(err));
  }
});
