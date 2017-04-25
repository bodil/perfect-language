/* eslint-disable no-console */

const fs = require("fs");
const path = require("path");
const proc = require("child_process");
const {Server} = require("rpc-websockets");

const server = new Server({
  port: 1338,
  host: "localhost"
});

let ghci = null;
let idris = null;

server.event("complete");
server.event("failed");
server.event("error");
server.event("output");

function writeBuf(oldbuf, data, callback) {
  let buf = oldbuf + data;
  let line;
  while ((line = buf.indexOf("\n")) >= 0) {
    const out = buf.slice(0, line);
    buf = buf.slice(line + 1);
    callback(out);
  }
  return buf;
}

function stripGhciPrompt(buf) {
  if (buf.match(/^[A-Za-z0-9.*]+> $/)) {
    return "";
  } else {
    return buf;
  }
}

function newGhci() {
  if (ghci) {
    ghci.removeAllListeners();
    ghci.kill();
  }
  ghci = proc.spawn("ghci", {
    cwd: path.resolve(__dirname, "haskell"),
    stdio: "pipe"
  });
  let outbuf = "", errbuf = "";
  ghci.on("exit", (code, signal) => {
    console.log(`EXIT ${code}: ghci`);
    if (code == 0) {
      server.emit("complete");
    } else {
      server.emit("failed", {code, signal});
    }
  });
  ghci.on("error", (err) => {
    console.error(`ERROR: ${err}`);
    server.emit("error", err.toString());
  });
  ghci.stdout.on("data", (data) => {
    outbuf = writeBuf(outbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: false}));
    outbuf = stripGhciPrompt(outbuf);
    process.stdout.write(data);
  });
  ghci.stderr.on("data", (data) => {
    errbuf = writeBuf(errbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: true}));
    errbuf = stripGhciPrompt(errbuf);
    process.stderr.write(data);
  });
}

server.register("ghci", () => {
  newGhci();
});

server.register("ghci.eval", (args) => {
  ghci.stdin.write(args.data + "\n");
});

server.register("ghci.load", (args) => {
  fs.writeFile(path.resolve(__dirname, "haskell", "Main.hs"), args.src, "utf8", (err) => {
    if (err) {
      server.emit("error", err.toString());
    } else {
      ghci.stdin.write(":load Main.hs\n");
    }
  });
});

function newIdris() {
  if (idris) {
    idris.removeAllListeners();
    idris.kill();
  }
  idris = proc.spawn("idris", {
    cwd: path.resolve(__dirname, "idris"),
    stdio: "pipe"
  });
  let outbuf = "", errbuf = "";
  idris.on("exit", (code, signal) => {
    console.log(`EXIT ${code}: idris`);
    if (code == 0) {
      server.emit("complete");
    } else {
      server.emit("failed", {code, signal});
    }
  });
  idris.on("error", (err) => {
    console.error(`ERROR: ${err}`);
    server.emit("error", err.toString());
  });
  idris.stdout.on("data", (data) => {
    outbuf = writeBuf(outbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: false}));
    outbuf = stripGhciPrompt(outbuf);
    process.stdout.write(data);
  });
  idris.stderr.on("data", (data) => {
    errbuf = writeBuf(errbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: true}));
    errbuf = stripGhciPrompt(errbuf);
    process.stderr.write(data);
  });
}

server.register("idris", () => {
  newIdris();
});

server.register("idris.eval", (args) => {
  idris.stdin.write(args.data + "\n");
});

server.register("idris.load", (args) => {
  fs.writeFile(path.resolve(__dirname, "idris", "main.idr"), args.src, "utf8", (err) => {
    if (err) {
      server.emit("error", err.toString());
    } else {
      idris.stdin.write(":load main.idr\n");
    }
  });
});

// Rust

server.register("rust", (args) => {
  let outbuf = "";
  let errbuf = "";
  fs.writeFile(path.resolve(__dirname, "rust", "src", "main.rs"), args.src, "utf8", (err) => {
    if (err) {
      server.emit("error", err.toString());
    } else {
      console.log(`COMMAND: cargo ${args.args}`);
      const cargo = proc.spawn("cargo", args.args, {
        cwd: path.resolve(__dirname, "rust"),
        stdio: "pipe"
      });
      cargo.on("exit", (code, signal) => {
        console.log(`EXIT ${code}: cargo ${args.args}`);
        if (code == 0) {
          server.emit("complete");
        } else {
          server.emit("failed", {code, signal});
        }
      });
      cargo.on("error", (err) => {
        console.error(`ERROR: ${err}`);
        server.emit("error", err.toString());
      });
      cargo.stdout.on("data", (data) => {
        outbuf = writeBuf(outbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: false}));
        process.stdout.write(data);
      });
      cargo.stderr.on("data", (data) => {
        errbuf = writeBuf(errbuf, data.toString("utf8"), (line) => server.emit("output", {data: line, error: true}));
        process.stderr.write(data);
      });
    }
  });
});
