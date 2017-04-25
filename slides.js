import Pink from "pink";
import "pink/css/themes/simon.less";
import "pink/node_modules/highlight.js/styles/github-gist.css";
import "./screen.less";
import background from "pink/modules/background";
import image from "pink/modules/image";
import highlight from "pink/modules/highlight";
import repl from "pink-repl";
import js from "pink-repl/javascript";
import typescript from "pink-repl-typescript";
import purescript from "pink-repl-purescript";
import rust from "./client/rust";
import haskell from "./client/haskell";
import idris from "./client/idris";

new Pink("#slides", {
  background,
  image,
  highlight,
  repl: repl({js, typescript, purescript, rust, haskell, idris})
});
