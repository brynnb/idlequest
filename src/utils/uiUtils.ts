interface VideoOption {
  videoCode: string;
  start: number;
  end: number;
}

const videoOptions: VideoOption[] = [
  { videoCode: "awN7hdTfivE", start: 0, end: 21291 },
  { videoCode: "egErjaxXK-c", start: 0, end: 1587 },
  { videoCode: "eudivHLEg-4", start: 0, end: 600 },
  { videoCode: "1dZ9XQTwmXA", start: 0, end: 600 },
  { videoCode: "lfQpJRqNEho", start: 0, end: 500 },
  { videoCode: "ImdkeY1pz_k", start: 0, end: 500 },
  { videoCode: "ac68dDjQZGc", start: 0, end: 500 },
  { videoCode: "2__FZLzOLpw", start: 0, end: 500 },
  { videoCode: "Gap_QOG5MLI", start: 0, end: 500 },
  { videoCode: "Gw2N-pUlvv8", start: 0, end: 500 },
  { videoCode: "NzAUeS24Kwc", start: 0, end: 500 },
  { videoCode: "NZ4c6jO0qNs", start: 0, end: 500 },
  { videoCode: "ekLYIiWiWDc", start: 0, end: 500 },
  { videoCode: "L3FYvLQL_zM", start: 0, end: 500 },
  { videoCode: "GvIfsfZfstk", start: 0, end: 500 },
  { videoCode: "sWPAYwQltJk", start: 0, end: 500 },
  { videoCode: "5rwybDHusTg", start: 0, end: 500 },
  { videoCode: "zjt1Oo7oZts", start: 0, end: 500 },
  { videoCode: "_x-B1hHtqeE", start: 0, end: 500 },
  { videoCode: "KL_bAUH2-b4", start: 0, end: 500 },
  { videoCode: "mzysKHdgrI4", start: 0, end: 500 },
  { videoCode: "ZPikCYEKFSM", start: 0, end: 500 },
  { videoCode: "4qSq49a38wE", start: 0, end: 500 },
  { videoCode: "5Fw7FKvU4L0", start: 0, end: 500 },
  { videoCode: "wghCyEQQlLo", start: 0, end: 500 },
  { videoCode: "Sh20g9lxXKg", start: 0, end: 500 },
  { videoCode: "lQyn9moWEFM", start: 0, end: 500 },
  { videoCode: "wioYS1RvvbU", start: 0, end: 500 },
  { videoCode: "mu4f6dxsGSw", start: 0, end: 500 },
  { videoCode: "GIvnzQxO9MY", start: 0, end: 500 },
  { videoCode: "KHXgjHtG0aE", start: 0, end: 500 },
  { videoCode: "2uA3aXQbLuE", start: 0, end: 500 },
  { videoCode: "_Vo90Ld9BVQ", start: 0, end: 500 },
  { videoCode: "5S4joYtfzGQ", start: 0, end: 500 },
  { videoCode: "5ONH2utKeFg", start: 0, end: 500 },
  { videoCode: "OLdxeNm9umQ", start: 0, end: 500 },
  { videoCode: "qK9ie3pjp6w", start: 0, end: 500 },
];

export function getVideoEmbedOption(): string {
  const baseStr =
    "https://www.youtube.com/embed/?autoplay=1&mute=1&loop=1&playlist=";
  const endStr = "&start=";

  const videoChoice = videoOptions[0];
  const startTime =
    Math.floor(Math.random() * (videoChoice.end - videoChoice.start + 1)) +
    videoChoice.start;

  return `${baseStr}${videoChoice.videoCode}${endStr}${startTime}`;
}

export function getVideoByIndex(index: number): VideoOption {
  return videoOptions[index % videoOptions.length];
}

export function getRandomVideoIndex(): number {
  return Math.floor(Math.random() * videoOptions.length);
}

export interface SpellGem {
  spritesheet: string;
  x: number;
  y: number;
}

export function getSpellGems(): SpellGem[] {
  return [
    { spritesheet: "gemicons01.png", x: 1, y: 0 },
    { spritesheet: "gemicons01.png", x: -37, y: 0 },
    { spritesheet: "gemicons01.png", x: -74, y: 0 },
    { spritesheet: "gemicons01.png", x: -111, y: 0 },
    { spritesheet: "gemicons01.png", x: -148, y: 0 },
    { spritesheet: "gemicons01.png", x: -185, y: 0 },
    { spritesheet: "gemicons01.png", x: -222, y: 0 },
    { spritesheet: "gemicons01.png", x: -222, y: -28 },
  ];
}
