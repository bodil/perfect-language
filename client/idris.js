import "brace/mode/elm";

import EventEmitter from "eventemitter3";

const serverUrl = "ws://localhost:1338";

class Connection extends EventEmitter {
  constructor() {
    super();
    console.log("CONSTRUCTED!");
    this.queue = [];
    this.open = false;
    this.nextId = 0;
    this.connect();
    this.rpc("idris");
  }

  cleanup() {
    this.removeAllListeners();
  }

  connect() {
    this.socket = new WebSocket(serverUrl);
    this.socket.onerror = this.onError.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onopen = this.onOpen.bind(this);
    this.rpc("rpc.on", ["complete", "failed", "error", "output"]);
  }

  onOpen() {
    this.open = true;
    this.flushQueue();
  }

  onClose() {
    this.open = false;
    this.socket = null;
    console.error("Remote socket closed!");
  }

  onError(err) {
    console.error("WebSocket error:", err);
    this.open = false;
    this.socket = null;
  }

  onMessage(event) {
    const msg = JSON.parse(event.data);
    console.log("RECEIVED:", msg);
    if (msg.notification) {
      const args = msg.params[0];
      switch (msg.notification) {
        case "output":
          this.emit(args.error ? "error" : "log", args.data);
          break;
        case "error":
          this.emit("error", `ERROR: ${args}`);
          break;
        case "complete":
          break;
        case "failed":
          this.emit("error", `Process failed with error code ${args.code}.`);
          break;
      }
    }
  }

  send(msg) {
    if (this.open) {
      this.socket.send(JSON.stringify(msg));
    } else {
      this.queue.push(msg);
    }
  }

  flushQueue() {
    const queue = this.queue;
    this.queue = [];
    queue.forEach((msg) => this.send(msg));
  }

  rpc(method, params) {
    this.send({
      jsonrpc: "2.0",
      id: ++this.nextId,
      method,
      params
    });
  }

  eval(input) {
    console.log("evaling", input);
    this.rpc("idris.eval", {data: input});
  }

  load(input) {
    console.log("loading", input);
    this.rpc("idris.load", {src: input});
  }
}

export default {
  aceMode: "ace/mode/elm",
  getContext: () => new Connection()
};
