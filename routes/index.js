const express = require("express");
const path = require("path");
const router = express.Router();

const rooms = require("../rooms");
const roomOfInfo = require("../roomOfInfo");

const wordGenerator = require("../lib/file");

/**
 * @param roomOfWord { 방번호 => 단어 }
 */
const roomOfWord = new Map();

/**
 * 메인 페이지 함수
 * 루트 경로("/")(http://localhost:3000/)에 대한 GET 요청을 처리하는 핸들러 함수
 * @param __dirname 현재 파일이 위치한 디렉토리
 */
router.get("/", (req, res) => {
  // express.js에서 클라이언트에게 파일을 응답으로 전송하는 역할
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

/**
 * 생성된 방을 표시하도록 하는 함수
 * (http://localhost:3000/rooms)에 대한 GET 요청을 처리하는 핸들러 함수
 */
router.get("/rooms", (req, res) => {
  // express.js에서 JSON 형식의 응답을 클라이언트에게 전송하는 역할
  res.json(rooms.getRooms());
});

/**
 * 게임중이나 시작할때 랜덤 단어를 가져오고 서버에 그 단어를 저장해주는 함수
 * (http://localhost:3000/getRandomWord)에 대한 GET 요청을 처리하는 핸들러 함수
 */
router.get("/getRandomWord", (req, res) => {
  // 방 번호
  const id = req.query.id;

  // roomOfWord에 {방번호 => 단어} 설정!
  roomOfWord.set(id, wordGenerator.getRandomWord().trim());

  console.log("roomOfWord", roomOfWord);

  const data = { message: roomOfWord.get(id) };

  // JSON 형식의 단어를 클라이언트에게 전송하는 역할
  res.json(data);
});

/**
 * 방의 방장이 누구인지 가져오는 함수
 * (http://localhost:3000/getReader)에 대한 GET 요청을 처리하는 핸들러 함수
 */
router.get("/getReader", (req, res) => {
  // 방 번호
  const id = req.query.id;

  // 모든 방에서 해당 id를 가진 방 정보를 가져옴
  const targetRoom = rooms.find(parseInt(id));

  // 해당 방에서 최상단(첫번째) 플레이어를 방장으로 저장
  const [reader] = targetRoom.users.entries().next().value;
  const data = { reader };
  console.log(`${id}번 방의 방장은 ${reader}님 입니다.`);

  // JSON 형식의 방장 정보를 클라이언트에게 전송하는 역할
  res.json(data);
});

/**
 * 방의 인원수를 가져주는 함수
 * (http://localhost:3000/getPlayer)에 대한 GET 요청을 처리하는 핸들러 함수
 */
router.get("/getPlayer", (req, res) => {
  // 방 번호
  const id = req.query.id;

  // 모든 방에서 해당 id를 가진 방 정보를 가져옴
  const targetRoom = rooms.find(parseInt(id));

  // 해당 방의 사람수가 2명이상 충족되는지 아닌지
  let data = true;

  // 해당 방의 사람 수
  const number = targetRoom.users.size;

  // 2명 미만이라면
  if (number < 2) {
    data = false;
  }
  console.log(`${id}번 방의 인원은 ${number}명 입니다.`);

  // JSON 형식의 충족 여부를 클라이언트에게 전송하는 역할
  res.json(data);
});

/**
 * 클라이언트의 단어와 서버의 단어를 비교하는 함수
 * (http://localhost:3000/checkChat)에 대한 POST 요청을 처리하는 핸들러 함수
 */
router.post("/checkChat", (req, res) => {
  // 클라이언트로 부터 가져온 단어 저장
  let clientVal = req.body.message;

  // 해당 방 번호
  let id = req.body.roomId;

  // 서버에 저장된 해당 방의 단어
  let serverVal = roomOfWord.get(id);

  // 클라이언트의 값과 서버의 값이 같다면
  if (clientVal === serverVal) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

/**
 * 해당 방이 지금 게임중인지 아닌지 확인해주는 함수
 * (http://localhost:3000/checkRoom)에 대한 POST 요청을 처리하는 핸들러 함수
 */
router.post("/checkRoom", (req, res) => {
  // 방 번호
  const roomId = req.body.roomId;

  // 게임이 시작되면 roomOfInfo에 해당 방 정보 데이터가 저장되는데 이게 존재하면 게임중임
  let myRoom = roomOfInfo.find(roomId); // 와 이거때문에 싱글톤으로 해결...

  // 게임중이 아니라면 => false, 게임중이라면 => true
  let data = false;

  // 게임중이면
  if (myRoom) {
    data = true;
  }
  res.json(data);
});

/**
 * 클라이언트의 사용자 이름과 서버에 저장된 사용자이름을 중복 비교하는 함수
 * (http://localhost:3000/checkDuplicate)에 대한 POST 요청을 처리하는 핸들러 함수
 */
router.post("/checkDuplicate", (req, res) => {
  // 클라이언트로 부터 가져온 사용자 이름
  let username = req.body.username;

  // 클라이언트에서 아무 값도 입력안하면 그냥 이 함수 종료
  if (!username) {
    return;
  }

  // 해당 방 번호
  let id = req.body.roomId;

  // 서버에 중복된 이름이 존재하면 true, 아니면 false
  let isDuplicate = rooms.find(id).users.has(username.trim());

  // 중복된 값이 있다면
  if (isDuplicate) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

module.exports = router;
