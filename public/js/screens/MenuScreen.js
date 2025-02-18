export class MenuScreen {
  constructor(socket) {
    this.socket = socket;
    this.element = document.getElementById('menuScreen');
    this.createRoomBtn = document.getElementById('createRoomBtn');
    this.joinRoomBtn = document.getElementById('joinRoomBtn');
    this.roomCodeInput = document.getElementById('roomCodeInput');
  }

  initialize() {
    this.createRoomBtn.addEventListener('click', () => {
      this.socket.createRoom((response) => {
        if (response.roomCode) {
          this.hide();
          document.dispatchEvent(new CustomEvent('showWaitingScreen', {
            detail: { roomCode: response.roomCode }
          }));
        }
      });
    });

    this.joinRoomBtn.addEventListener('click', () => {
      const roomCode = this.roomCodeInput.value.toUpperCase();
      if (roomCode.length === 4) {
        this.socket.joinRoom(roomCode, (response) => {
          if (response.error) {
            alert(response.error);
          } else {
            this.hide();
            document.dispatchEvent(new CustomEvent('showWaitingScreen', {
              detail: { roomCode }
            }));
          }
        });
      }
    });
  }

  hide() {
    this.element.style.display = 'none';
  }

  show() {
    this.element.style.display = 'block';
  }
}
