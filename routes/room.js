const express = require("express");
const path = require("path");
const router = express.Router();

const rooms = require("../rooms");

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "room.html"));
});

router.post("/create", (req, res) => {
  const roomName = req.body.roomName;

  if (roomName === null || roomName === "") {
    res.json({
      success: false,
    });
    return;
  }

  // 방 생성 작업 수행
  const newRoom = {
    id: rooms.getRooms().length + 1,
    name: roomName,
    users: new Map(),
    userScore: new Map(),
  };

  rooms.addItem(newRoom);
  console.log("생성된 방 목록 배열 =>", rooms.getRooms());

  // 생성된 방 정보를 클라이언트에게 응답
  res.json({
    success: true,
    roomId: newRoom.id,
  });
});

// /room/:id 라우팅 경로에서 roomId를 매개변수로 사용합니다.
router.get("/:id", (req, res) => {
  const roomId = req.params.id;

  const room = rooms.find(parseInt(roomId));

  console.log(`/room/${roomId}를 통해 찾은 방 객체 =>`, room);

  if (room) {
    // roomId가 배열의 요소로 포함되어 있을 경우
    res.sendFile(path.join(__dirname, "..", "views", "channel.html"));
  } else {
    // roomId가 배열의 요소로 포함되어 있지 않을 경우
    res.status(404).json({ error: `방 ${roomId}은 존재하지 않습니다.` });
  }
});

module.exports = router;
