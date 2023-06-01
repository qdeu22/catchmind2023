const express = require("express");
const path = require("path");
const router = express.Router();

const rooms = require("../rooms");

const roomOfInfo = require("../roomOfInfo");

/**
 * 방 생성 페이지 함수
 * (http://localhost:3000/room)에 대한 GET 요청을 처리하는 핸들러 함수
 * @param __dirname 현재 파일이 위치한 디렉토리
 */
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "room.html"));
});

/**
 * 클라이언트로부터 방이름을 가져와 방 생성하는 함수
 * (http://localhost:3000/room/create)에 대한 post 요청을 처리하는 핸들러 함수
 */
router.post("/create", (req, res) => {
  // 방 이름
  const roomName = req.body.roomName;

  // 방이름이 없거나 빈 값이면 오류 처리
  if (roomName === null || roomName.trim() === "") {
    res.json({
      success: false,
    });
    return;
  }

  // 똑같은 방이 존재하면
  if (rooms.findByName(roomName)) {
    res.json({
      success: false,
    });
    return;
  }

  let ID;

  if (rooms.getRooms().length === 0) {
    ID = 1;
  } else {
    ID = rooms.getRooms()[rooms.getRooms().length - 1].id + 1;
  }

  /**
   * 새로운 방 생성 작업
   * @param id 방 번호
   * @param name 방 이름
   * @param users { 사용자 이름 => socket.id }
   * @param userScore { 사용자 이름 => 점수 }
   */
  const newRoom = {
    id: ID,
    name: roomName,
    users: new Map(),
    userScore: new Map(),
  };

  // 모든 방(rooms) 배열에 새로운 방을 저장
  rooms.addItem(newRoom);

  console.log(
    "모든 방(rooms)에 새로운 방을 저장후 rooms 정보 =>",
    rooms.getRooms()
  );

  /**
   * 생성된 방 정보를 클라이언트에게 응답
   * @param success 성공여부
   * @param roomId 새로운 방의 방 번호
   */
  res.json({
    success: true,
    roomId: newRoom.id,
  });
});

/**
 *  방생성되고 난후 링크를 통해서 해당 방에 접근하는 함수
 * (http://localhost:3000/room/:id)에 대한 get 요청을 처리하는 핸들러 함수
 */
router.get("/:id", (req, res) => {
  // :id의 값을 가져온 방 번호
  const roomId = req.params.id;

  // 해당 방을 rooms에서 찾음
  const room = rooms.find(parseInt(roomId));

  console.log(`/room/${roomId}를 통해 찾은 방 객체 =>`, room);

  // 방이 존재한다면
  if (room) {
    //url로 접속할경우의 결합 제거
    if (roomOfInfo.find(roomId)) {
      res.status(404).json({ error: `방 ${roomId}은 게임중입니다.` });
    } else {
      res.sendFile(path.join(__dirname, "..", "views", "channel.html"));
    }
  } else {
    res.status(404).json({ error: `방 ${roomId}은 존재하지 않습니다.` });
  }
});

module.exports = router;
