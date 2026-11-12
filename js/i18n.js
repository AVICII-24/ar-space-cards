// Interface text. Card and mission text lives in /content.
// English only for now. To add a language: give each entry a second string, make t() in
// content/cards.js keep it, and have lang() return the chosen language code.

const UI = {
  brand: ['AR Space Cards'],
  hero: ['Hold space in your hands'],
  heroSub: ['Point a tablet at a card, or explore without one.'],
  pickLevel: ['Choose your level'],
  scan: ['Scan a card'], scanSub: ['Use the camera'],
  explore: ['Explore in 3D'], exploreSub: ['No card needed'],
  missions: ['Missions'], missionsSub: ['Predict, test, explain'],
  teacher: ['Teacher'], teacherSub: ['Sessions and results'],
  privacy: ['No login. No names. Camera pictures never leave this device.'],
  badges: ['Mission badges'],
  cards: ['The cards'], cardsSub: ['Tap a card to explore it in 3D'],
  labs: ['Labs'], labsSub: ['For Navigators and Scientists'],
  back: ['Back'], home: ['Home'],
  modeAr: ['Camera'], mode3d: ['3D', '3D'], modeDemo: ['Demo'],
  hintScan: ['Point the camera at a card'],
  hintNeed: ['Show this card to the camera:'],
  hintDemo: ['Demo: drag a card to move it'],
  fact: ['Did you know?'], next: ['Next'],
  readAloud: ['Read aloud'], stop: ['Stop'],
  tapHint: ['Tap the glowing dots'],
  predict: ['What do you think?'],
  predictSub: ['There is no wrong guess. We will test it together.'],
  yourTask: ['Try it'],
  seeWhy: ['See why'], skip: ['Skip to the answer'],
  youSaid: ['You predicted:'],
  right: ['Your prediction matches what you just saw. Well reasoned!'],
  common: ['Lots of people think that, grown-ups too. Here is what you just saw:'],
  other: ['Good try. Here is what you just saw:'],
  talk: ['Talk about it'],
  again: ['Explore again'], nextMission: ['Next mission'], done: ['Done'],
  badgeEarned: ['Badge earned'],
  camTitle: ['The camera is not available'],
  camBody: ['Allow camera access in the browser, or carry on without it. Everything also works without a camera.'],
  useDemo: ['Show a demo'], use3d: ['Explore in 3D'],
  level: ['Level'], pairs: ['Works with card'],
  openMission: ['Start the mission'], openLab: ['Open the lab'],
  // teacher
  tSession: ['Session'], tDash: ['Results'], tCheck: ['Concept check'], tGuide: ['Bedside guide'], tSetup: ['Set-up'],
  ward: ['Ward or unit'], learner: ['Learner code (never a name)'], group: ['Children in this session'],
  start: ['Start session'], end: ['End session'],
  running: ['Session running'], min: ['min'],
  mood: ['Ask the child: how was today’s session?'],
  noSession: ['No session is running.'],
  before: ['Before the first session'], after: ['After the last session'],
  checkIntro: ['Five questions. Read each one aloud and tap the child’s answer. Do not correct answers during the check.'],
  beginCheck: ['Begin'], saved: ['Saved. Thank you!'],
  export: ['Export CSV'], clear: ['Erase all results'], clearAsk: ['Erase every saved session and check on this device?'],
  print: ['Print the cards'],
  calm: ['Calm mode (less motion)'], labels: ['Show labels'], language: ['Language'],
  sessions: ['Sessions'], minutes: ['Minutes of learning'], learners: ['Learner codes'], avg: ['Average session'],
  moods: ['How sessions felt'], byLevel: ['Sessions by level'],
  preds: ['First predictions that were already correct'],
  prepost: ['Concept check: before and after'], noData: ['Nothing recorded yet.'],
  offline: ['Ready to use offline'],
};

export const lang = () => 'en';
/** Pick the current language from a text object such as { en: '...' }. */
export const tr = o => (o == null ? '' : typeof o === 'string' ? o : o[lang()] ?? o.en);
/** Look up an interface string by key. */
export const ui = k => { const v = UI[k]; return v ? v[0] : k; };
/** Inline text used by the 3D scenes: L('English'). */
export const L = en => en;

let speaking = false;
export function speak(text, onEnd) {
  const synth = window.speechSynthesis; if (!synth) return false;
  synth.cancel();
  if (speaking) { speaking = false; onEnd && onEnd(); return false; }
  const u = new SpeechSynthesisUtterance(text); u.lang = 'en-IN'; u.rate = 0.9;
  u.onend = u.onerror = () => { speaking = false; onEnd && onEnd(); };
  speaking = true; synth.speak(u); return true;
}
export const hush = () => { speaking = false; window.speechSynthesis && window.speechSynthesis.cancel(); };
