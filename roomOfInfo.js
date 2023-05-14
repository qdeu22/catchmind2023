// data.js
class RoomOfInfo {
  constructor() {
    this.roomOfInfo = [];
  }
  addItem(item) {
    this.roomOfInfo.push(item);
  }
  filter(roomId) {
    this.roomOfInfo = this.roomOfInfo.filter((info) => info.id !== roomId);
  }
  find(roomId) {
    return this.roomOfInfo.find((info) => {
      return info.id === roomId;
    });
  }
  getRoomOfInfo() {
    return this.roomOfInfo;
  }
}
module.exports = new RoomOfInfo();
