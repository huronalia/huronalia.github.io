const FPS = 15;

const images = [
  "resources/Screenshots_huronalia/7be06c456afc13a1.png",
  "resources/Screenshots_huronalia/a7b71af5e3aa39fc.png",
  "resources/Screenshots_huronalia/6a7e60ab657d2c45.png",
  "resources/Screenshots_huronalia/fbf093c47d3f788b.png",
  "resources/Screenshots_huronalia/9e1c17f8a0961fe6.png",
  "resources/Screenshots_huronalia/7788ece99b3361fa.png",
  "resources/Screenshots_huronalia/2c669fe47fb2f5a2.png",
  "resources/Screenshots_huronalia/1a5d47badacffd57.png",
  "resources/Screenshots_huronalia/3e81476774e42577.png",
  "resources/Screenshots_huronalia/9cc5e8e76418ee46.png",
  "resources/Screenshots_huronalia/370a3bc107319918.png",
  "resources/Screenshots_huronalia/23210b658ed9fcaf.png",
  "resources/Screenshots_huronalia/fd8643a06f50c63e.png",
  "resources/Screenshots_huronalia/2aeb11757cb0ba98.png",
  "resources/Screenshots_huronalia/c9ecc21083b85529.png",
  "resources/Screenshots_huronalia/ce3882fa87c6193f.png",
  "resources/Screenshots_huronalia/d7f63e62d166e906.png",
  "resources/Screenshots_huronalia/2e5d689f8e70a5c3.png",
  "resources/Screenshots_huronalia/3990964a41905776.png",
  "resources/Screenshots_huronalia/b811316a002f2e09.png",
  "resources/Screenshots_huronalia/f04307122cf7a09b.png",
  "resources/Screenshots_huronalia/7a967202b1c6cc33.png",
  "resources/Screenshots_huronalia/e20825cb8664ff9f.png",
  "resources/Screenshots_huronalia/04e650040dd42c4f.png",
  "resources/Screenshots_huronalia/69466de2837bab06.png",
  "resources/Screenshots_huronalia/e3ad86a0e864eb2b.png",
  "resources/Screenshots_huronalia/484d2061f869a81a.png",
  "resources/Screenshots_huronalia/8b0c8eb7436d5b49.png",
  "resources/Screenshots_huronalia/031d4a5322140a4e.png",
  "resources/Screenshots_huronalia/97536b12efef90bf.png",
  "resources/Screenshots_huronalia/7cbfbe751068adcb.png",
  "resources/Screenshots_huronalia/a3df986b9a658ba0.png",
  "resources/Screenshots_huronalia/6c9ba8e8bbe1c12d.png",
  "resources/Screenshots_huronalia/c92f43176187a4d8.png",
];

const img = document.getElementById("hero-img");
const interval = 1000 / FPS;

setInterval(() => {
  img.src = images[Math.floor(Math.random() * images.length)];
}, interval);
