const roomModal = document.getElementById("room-modal");
const roomModalClose = document.getElementById("room-modal-close");

const inputRoomName = document.getElementById("room-name");

let createBtn = document.getElementById("create-room");

createBtn.addEventListener("click", createRoomModal);

function createRoomModal() {
  roomModal.style.display = "block"; // 모달창 띄우기
}

roomModalClose.onclick = function () {
  roomModal.style.display = "none"; // 모달창 닫기
  inputRoomName.value = "";
};

let deleteBtn = document.getElementById("delete-room");

deleteBtn.addEventListener("click", deleteRoom);

const roomCreateButton = document.getElementById("room-create-button");

roomCreateButton.addEventListener("click", createRoom);

function createRoom() {
  const roomName = document.getElementById("room-name").value;
  // 새로운 목록 요소 생성

  // 서버로 방 생성 요청 보내기
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
      if (data.success) {
        // 성공적으로 방이 생성된 경우
        alert(`새로운 ${roomName} 방을 생성합니다.`);

        const roomList = document.getElementById("room-list");

        const roomListItem = document.createElement("li");
        const roomLink = document.createElement("a");
        roomLink.href = `/room/${data.roomId}`;
        roomLink.target = "_blank";
        roomLink.textContent = roomName;
        roomListItem.appendChild(roomLink);
        roomList.appendChild(roomListItem);

        window.open(`/room/${data.roomId}`, "_blank");
      } else {
        // 방 생성에 실패한 경우
        alert("방 생성에 실패했습니다.");
      }
    })
    .catch((err) => console.error(err));

  // 모달창 닫기
  roomModal.style.display = "none";
  inputRoomName.value = "";
}

fetch("/rooms")
  .then((res) => res.json())
  .then((rooms) => {
    const roomList = document.getElementById("room-list");

    rooms.forEach((room) => {
      const roomListItem = document.createElement("li");
      const roomLink = document.createElement("a");
      roomLink.href = `/room/${room.id}`;
      roomLink.textContent = room.name;
      roomListItem.appendChild(roomLink);
      roomList.appendChild(roomListItem);
    });
  })
  .catch((err) => console.error(err));

function deleteRoom() {
  // 방 삭제 기능
  alert("선택한 방을 삭제합니다.");
}
