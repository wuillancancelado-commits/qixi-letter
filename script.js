const stages = {
  intro: document.querySelector("#intro"),
  letter: document.querySelector("#letter"),
  film: document.querySelector("#film"),
  ending: document.querySelector("#ending"),
};

const startButton = document.querySelector("#start-button");
const skipButton = document.querySelector("#skip-button");
const playButton = document.querySelector("#play-button");
const replayVideoButton = document.querySelector("#replay-video");
const restartLetterButton = document.querySelector("#restart-letter");
const sceneText = document.querySelector("#scene-text");
const announcer = document.querySelector("#announcer");
const progressFill = document.querySelector("#progress-fill");
const storyVideo = document.querySelector("#story-video");
const filmPrompt = document.querySelector("#film-prompt");
const videoStatus = document.querySelector("#video-status");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const scenes = [
  {
    text: "章老师，七夕快乐。",
    mode: "type",
    tone: "opening",
    charDelay: 170,
    hold: 1900,
  },
  {
    text: "在一起\n636 天",
    mode: "count",
    tone: "count",
    hold: 2600,
  },
  {
    text: "我们的故事，\n从一次意外的活动开始。",
    hold: 2700,
  },
  {
    text: "后来，你陪我上了两节\n原本与你无关的课。",
    hold: 2900,
  },
  {
    text: "给我多带了一份提拉米苏，\n又悄悄装好了一小瓶洗发水。",
    hold: 3100,
  },
  {
    text: "你记得我忘掉的地址，\n也总能一眼挑出更适合我的衣服。",
    hold: 3100,
  },
  {
    text: "我们一起等过下课，\n等过晚饭，\n也在电话里陪着彼此慢慢睡着。",
    hold: 3500,
  },
  {
    text: "原来爱并不总在很远的未来。",
    mode: "type",
    tone: "key",
    charDelay: 145,
    hold: 2200,
  },
  {
    text: "它藏在一句“注意安全”里，\n藏在“等你结束再一起吃”里，\n也藏在无数已经习以为常的小事里。",
    hold: 3800,
  },
  {
    text: "我以前总想一次讲完很远的以后。",
    hold: 2500,
  },
  {
    text: "现在，我更想认真陪你\n过好每一个具体的今天。",
    mode: "type",
    tone: "key",
    charDelay: 135,
    hold: 2400,
  },
  {
    text: "谢谢你一次次重新接纳我。\n也谢谢我们，\n还愿意继续学习怎样爱彼此。",
    hold: 3700,
  },
  {
    text: "这是我们一起度过的第二个七夕。",
    hold: 2700,
  },
  {
    text: "我不许下一个过于宏大的愿望。",
    hold: 2700,
  },
  {
    text: "只希望以后想你时可以告诉你，\n惹你不开心时能够听懂你，\n被你爱着时，也永远不要觉得理所当然。",
    hold: 4100,
  },
  {
    text: "章老师，\n接下来，一起看一段属于我们的故事吧。",
    mode: "type",
    tone: "key",
    charDelay: 135,
    hold: 2200,
  },
];

let sequenceId = 0;

function showStage(name) {
  Object.entries(stages).forEach(([key, stage]) => {
    stage.classList.toggle("stage--active", key === name);
    stage.setAttribute("aria-hidden", key === name ? "false" : "true");
  });
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function waitWhileVisible(ms, activeSequence) {
  let remaining = reducedMotion.matches ? Math.min(ms, 900) : ms;
  let previous = performance.now();

  while (remaining > 0 && activeSequence === sequenceId) {
    await wait(80);
    const current = performance.now();

    if (!document.hidden) {
      remaining -= Math.min(current - previous, 120);
    }

    previous = current;
  }
}

function appendTypedCharacter(character, delay) {
  if (character === "\n") {
    sceneText.append(document.createElement("br"));
    return;
  }

  const span = document.createElement("span");
  span.className = "typed-character";
  span.textContent = character;
  span.style.animationDelay = `${delay}ms`;
  sceneText.append(span);
}

async function revealScene(scene, activeSequence) {
  sceneText.className = "scene-text";
  sceneText.dataset.tone = scene.tone || "normal";
  sceneText.replaceChildren();
  announcer.textContent = scene.text.replaceAll("\n", "，");

  if (scene.mode === "count") {
    const label = document.createTextNode("在一起");
    const value = document.createElement("strong");
    value.textContent = "636 天";
    sceneText.append(label, value);
    requestAnimationFrame(() => sceneText.classList.add("is-visible"));
    return;
  }

  if (scene.mode === "type" && !reducedMotion.matches) {
    const characters = Array.from(scene.text);
    characters.forEach((character, index) => {
      appendTypedCharacter(character, index * scene.charDelay);
    });
    requestAnimationFrame(() => sceneText.classList.add("is-visible"));
    await waitWhileVisible(characters.length * scene.charDelay, activeSequence);
    return;
  }

  sceneText.textContent = scene.text;
  requestAnimationFrame(() => sceneText.classList.add("is-visible"));
}

async function hideScene(activeSequence) {
  if (activeSequence !== sequenceId) return;
  sceneText.classList.remove("is-visible");
  sceneText.classList.add("is-leaving");
  await waitWhileVisible(680, activeSequence);
}

async function playLetter() {
  const activeSequence = ++sequenceId;
  showStage("letter");
  progressFill.style.width = "0%";

  storyVideo.preload = "auto";
  storyVideo.load();

  for (let index = 0; index < scenes.length; index += 1) {
    if (activeSequence !== sequenceId) return;

    await revealScene(scenes[index], activeSequence);
    await waitWhileVisible(scenes[index].hold, activeSequence);

    progressFill.style.width = `${((index + 1) / scenes.length) * 100}%`;
    await hideScene(activeSequence);
  }

  if (activeSequence === sequenceId) {
    showFilmPrompt();
  }
}

function showFilmPrompt() {
  sequenceId += 1;
  showStage("film");
  storyVideo.pause();
  storyVideo.currentTime = 0;
  storyVideo.controls = false;
  filmPrompt.hidden = false;
  videoStatus.textContent = "";
  window.setTimeout(() => playButton.focus(), 950);
}

async function playStoryVideo() {
  videoStatus.textContent = "正在准备视频…";

  try {
    await storyVideo.play();
    filmPrompt.hidden = true;
    storyVideo.controls = true;
    videoStatus.textContent = "";
  } catch (error) {
    videoStatus.textContent = "视频暂时无法播放，请再次点击。";
    filmPrompt.hidden = false;
  }
}

function showEnding() {
  showStage("ending");
  videoStatus.textContent = "";
  window.setTimeout(() => replayVideoButton.focus(), 1400);
}

startButton.addEventListener("click", playLetter);

skipButton.addEventListener("click", showFilmPrompt);

playButton.addEventListener("click", playStoryVideo);

storyVideo.addEventListener("playing", () => {
  videoStatus.textContent = "";
});

storyVideo.addEventListener("waiting", () => {
  videoStatus.textContent = "网络较慢，视频正在缓冲…";
});

storyVideo.addEventListener("error", () => {
  videoStatus.textContent = "视频文件尚未就绪，请稍后再试。";
  filmPrompt.hidden = false;
});

storyVideo.addEventListener("ended", showEnding);

replayVideoButton.addEventListener("click", async () => {
  showStage("film");
  filmPrompt.hidden = true;
  storyVideo.controls = true;
  storyVideo.currentTime = 0;
  await playStoryVideo();
});

restartLetterButton.addEventListener("click", () => {
  storyVideo.pause();
  storyVideo.currentTime = 0;
  playLetter();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && !storyVideo.paused) {
    storyVideo.pause();
  }
});

showStage("intro");
