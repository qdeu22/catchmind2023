// data.js
class Rooms {
  constructor() {
    this.Rooms = [];
  }
  addItem(item) {
    this.Rooms.push(item);
  }
  filter(roomId) {
    this.Rooms = this.Rooms.filter((room) => room.id !== roomId);
  }
  find(roomId) {
    return this.Rooms.find((room) => {
      return room.id === roomId;
    });
  }
  getRooms() {
    return this.Rooms;
  }
}
module.exports = new Rooms();