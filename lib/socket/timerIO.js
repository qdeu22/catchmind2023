const roomOfInfo = require("../../roomOfInfo");
const rooms = require("../../rooms");

let timerInfo = [];
module.exports = function (io) {
  const timerIO = io.of("/timer");

  timerIO.on("connection", function (socket) {
    let roomID;

    /**
     * 소켓 룸 가입
     * @param roomId 방 번호
     */
    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
    });

    /**
     * 게임시작 버튼을 누르면 실행되는 콜백함수
     */
    socket.on("start", function () {
      // 자신이 속한 방의 타이머 찾기
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      // 게임시작 대기 중 다시 눌렀을 경우
      if (myTimer) {
        clearInterval(myTimer.countInterval);
        timerInfo = timerInfo.filter((info) => info.id !== roomID); // 타이머 필터링

        //자신포함 같은 방의 클라이언트들에게 게임시작 대기 취소 전송
        timerIO.to(roomID).emit("waitstop");
        return;
      }

      //////////////////////////////////////////////////////////

      /**
       * @param id 방번호
       * @param elapsedTime 경과시간
       * @param remainingTime 남은시간
       * @param elapsedTimeInterval 경과시간 Interval
       * @param remainingTimeInterval 남은시간 Interval
       * @param countInterval 게임시작 대기 카운트 Interval
       */
      const timer = {
        id: roomID,
        elapsedTime: 0,
        remainingTime: 60,
        elapsedTimeInterval: null,
        remainingTimeInterval: null,
        countInterval: null,
      };

      timerInfo.push(timer); // 타이머 정보를 timerInfo에 저장

      console.log("저장된 모든 방의 타이머 =>", timerInfo);

      // 자신의 방의 타이머를 찾음
      myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      let count = 5; // 게임시작 대기 카운트

      // 같은 방에 속한 클라이언트에게 게임시작 대기 카운트 전송
      timerIO.to(roomID).emit("count", count);

      myTimer.countInterval = setInterval(function () {
        count--; //카운트 감소

        // 같은 방에 속한 클라이언트에게 게임시작 대기 카운트 전송
        timerIO.to(roomID).emit("count", count);

        // 게임실행!!
        if (count === 0) {
          clearInterval(myTimer.countInterval);

          // 같은 방에 속한 클라이언트에게 게임시작 알림!
          timerIO.to(roomID).emit("start");
        }
      }, 1000);
    });

    // 경과시간
    socket.on("elapsedTime", function () {
      // 자신의 방의 타이머를 찾음
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      myTimer.elapsedTime = 0; // 처음에 경과시간을 0 으로 셋팅

      myTimer.elapsedTimeInterval = setInterval(function () {
        myTimer.elapsedTime++; // 1씩 증가

        /**
         * 같은 방에 속한 클라이언트에게 경과시간을 전송
         * @param myTimer.elapsedTime 현재 경과시간
         */
        timerIO.to(roomID).emit("elapsedTime", {
          elapsedTime: myTimer.elapsedTime,
        });
      }, 1000);
    });

    // 남은 시간
    socket.on("remainingTime", function () {
      // 자신의 방의 타이머를 찾음
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      myTimer.remainingTime = 60; // 처음에 남은 시간을 60초로 셋팅

      myTimer.remainingTimeInterval = setInterval(function () {
        myTimer.remainingTime--; // 1씩 감소

        /**
         * 같은 방에 속한 클라이언트에게 남은 시간을 전송
         * @param myTimer.remainingTime 현재 남은시간
         */
        timerIO.to(roomID).emit("remainingTime", {
          remainingTime: myTimer.remainingTime,
        });

        // 플레이어 턴을 바꾸기 위해 ??
        if (myTimer.remainingTime === 0) {
          clearInterval(myTimer.remainingTimeInterval);

          //자기자신의 클라이언트에게 남은 시간이 초과됬다고 알림
          socket.emit("timeout-change");
        }
      }, 1000);
    });

    // 클라이언트에서 채팅을 쳐서 맞을경우 현재 턴의 남은 시간을 멈추게 하는 콜백함수
    socket.on("clear-remainingTime", function () {
      // 자신의 방의 타이머를 찾음
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      clearInterval(myTimer.remainingTimeInterval);
    });

    // 게임시작 버튼을 눌러 게임정지하거나 탈주자 발생으로 게임정지 될때 실행되는 콜백함수
    socket.on("stop", function () {
      // 자신의 방의 타이머를 찾음
      let myTimer = timerInfo.find((info) => {
        return info.id === roomID;
      });

      clearInterval(myTimer.elapsedTimeInterval);
      clearInterval(myTimer.remainingTimeInterval);

      // 자신의 방 타이머 필터링
      timerInfo = timerInfo.filter((info) => info.id !== roomID);

      console.log("게임정지에 대한 타이머 삭제후 모든 방 정보 =>", timerInfo);
    });

    socket.on("disconnect", () => {});
  });
  return timerIO;
};
