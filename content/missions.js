// Concept missions: predict -> observe -> explain.
// Each one targets a misconception that is well documented in science-education
// research. options[].k: 'correct' | 'misconception' | 'other'.
import { t } from './cards.js';

export const MISSIONS = [
  {
    id: 'daynight', icon: '🌗', scene: 'earth', cards: ['earth'], color: '#3b82f6',
    title: t('Day and night'),
    question: t('Why does India have night?'),
    options: [
      { k: 'misconception', text: t('The Sun travels around the Earth') },
      { k: 'correct', text: t('Earth spins, and India turns away from the Sun') },
      { k: 'other', text: t('The Moon covers the Sun') },
    ],
    task: t('Slide the clock. Take India from day into night and back into day.'),
    explain: {
      explorer: t('The Sun stays where it is. Earth spins like a top, once every day. When India turns to face the Sun, it is day. When India turns away, it is night.'),
      navigator: t('Earth turns once in 24 hours, which is 15° every hour. Half the planet is always lit. India has night while it is on the half facing away from the Sun. The Sun only seems to cross the sky because we are the ones moving.'),
      scientist: t('Earth rotates eastward at 15° per hour, so local solar time = UTC + longitude/15. The terminator sweeps west across India at about 1,470 km/h at Delhi’s latitude. Foucault’s pendulum and the Coriolis effect are direct evidence that it is Earth that rotates.'),
    },
    follow: t('If it is noon in India, where on Earth is it midnight?'),
  },
  {
    id: 'seasons', icon: '🌦️', scene: 'seasons', cards: ['sun', 'earth'], color: '#f59e0b',
    title: t('Seasons'),
    question: t('Why is it hot in India in summer?'),
    options: [
      { k: 'misconception', text: t('Earth is closer to the Sun in summer') },
      { k: 'correct', text: t('Earth is tilted, so the Sun shines higher and longer on India') },
      { k: 'other', text: t('The Sun burns hotter in summer') },
    ],
    task: t('Move Earth around the Sun. Visit June and December. Watch the tilt: does it ever change?'),
    explain: {
      explorer: t('Earth leans to one side, and it always leans the same way. In June the top half leans towards the Sun, so India gets long, hot days. In December it leans away, so days are short and cool. Earth is actually closest to the Sun in January!'),
      navigator: t('Earth’s axis is tilted 23.4° and keeps pointing the same way all year. In June the Sun is overhead at 23.4°N, so in India it climbs high and stays up for about 14 hours in Delhi. In December Delhi gets only about 10 hours. Distance is not the cause: Earth is nearest the Sun around 3 January.'),
      scientist: t('Sunlight per square metre of ground scales with sin(altitude). At Delhi the noon Sun reaches 90° − 28.6° + 23.4° ≈ 85° in June but only about 38° in December, so each square metre receives roughly 60% more power at noon, for more hours. Earth’s distance varies by only 3.3% (147.1 to 152.1 million km) and is smallest in January, so it cannot explain the seasons.'),
    },
    follow: t('When it is summer in India, what season is it in Australia?'),
  },
  {
    id: 'phases', icon: '🌙', scene: 'phases', cards: ['moon'], color: '#cbd5e1',
    title: t('Moon phases'),
    question: t('Why does the Moon seem to change shape?'),
    options: [
      { k: 'misconception', text: t('Earth’s shadow covers part of the Moon') },
      { k: 'correct', text: t('We see different amounts of the Moon’s sunlit half') },
      { k: 'other', text: t('Clouds hide part of the Moon') },
    ],
    task: t('Move the Moon around the Earth. Find a full moon and a new moon. Is half of the Moon always lit?'),
    explain: {
      explorer: t('The Sun always lights up half of the Moon, like a torch shining on a ball. As the Moon goes around us, we see more or less of its bright half. Earth’s shadow only touches the Moon during an eclipse, and that is rare.'),
      navigator: t('Half the Moon is always sunlit. The phase depends on the angle between the Sun, Earth and Moon. At new moon the lit half faces away from us. At full moon it faces us. The cycle takes 29.5 days. Earth’s shadow causes lunar eclipses, not phases.'),
      scientist: t('The lit fraction we see is k = (1 − cos θ)/2, where θ is the Moon’s elongation from the Sun. Eclipses do not happen every month because the Moon’s orbit is tilted 5.1° to Earth’s orbit, so the Moon usually passes above or below Earth’s shadow.'),
    },
    follow: t('Look for the Moon tonight. Does it match the phase shown for today?'),
  },
  {
    id: 'scale', icon: '📏', scene: 'scale', cards: ['earth', 'moon'], color: '#34d399',
    title: t('How far is the Moon?'),
    question: t('How many Earths would fit in the gap between the Earth and the Moon?'),
    options: [
      { k: 'misconception', text: t('About 3') },
      { k: 'correct', text: t('About 30') },
      { k: 'other', text: t('About 300') },
    ],
    task: t('Switch to true scale. Then line up the planets in the gap.'),
    explain: {
      explorer: t('Pictures in books show the Moon close to the Earth so both fit on the page. Really, the Moon is far away: 30 Earths would fit in between. All the other planets could just about squeeze into that gap!'),
      navigator: t('The Moon is 384,400 km away on average and Earth is 12,742 km wide: 384,400 ÷ 12,742 ≈ 30. The other seven planets side by side measure about 380,000 km, so they only just fit, when the Moon is a little farther away than average. Light makes the trip in 1.3 seconds. Apollo astronauts took three days.'),
      scientist: t('The distance varies from 363,300 km (perigee) to 405,500 km (apogee), so the planets only fit when the Moon is on the far part of its orbit. We measure it to within centimetres by timing laser pulses bounced off reflectors left on the surface: d = c·t/2, with t ≈ 2.56 s.'),
    },
    follow: t('If Earth were a football, how far away would the Moon be?'),
  },
  {
    id: 'orbit', icon: '🛰️', scene: 'orbit', cards: ['iss'], color: '#22d3ee',
    title: t('Gravity in orbit'),
    question: t('Why do astronauts float inside the Space Station?'),
    options: [
      { k: 'misconception', text: t('There is no gravity in space') },
      { k: 'correct', text: t('They are falling around the Earth all the time') },
      { k: 'other', text: t('Their spacesuits make them light') },
    ],
    task: t('Choose a sideways speed and launch. Too slow and it falls back. Find the speed that keeps it going around.'),
    explain: {
      explorer: t('Gravity is still pulling on the Space Station. It is falling all the time! But it is also zooming sideways so fast that it keeps missing the Earth. The astronauts fall together with it, so they float.'),
      navigator: t('The station is only 400 km up, where gravity is still about 88% as strong as on the ground. It travels sideways at 27,600 km/h. At that speed the ground curves away as fast as the station falls, so it circles the Earth every 92 minutes. Floating means free fall, not zero gravity.'),
      scientist: t('At radius r = 6,771 km, g = GM/r² = 8.7 m/s². For a circular orbit gravity supplies the centripetal force: GMm/r² = mv²/r, so v = √(GM/r) = 7.66 km/s and T = 2πr/v ≈ 92 min. Crew and station share the same acceleration, so there is no contact force between them. That is apparent weightlessness.'),
    },
    follow: t('What would happen to the Space Station if it slowed down?'),
  },
];

export const missionById = Object.fromEntries(MISSIONS.map(m => [m.id, m]));

// Labs: open-ended tools for Navigators and Scientists.
export const LABS = [
  {
    id: 'kepler', icon: '🪐', color: '#f59e0b', card: 'solar-system',
    title: t('Kepler’s laws'),
    blurb: t('Real planet positions for today. Check T² = a³ on every orbit.'),
  },
  {
    id: 'marsplanner', icon: '🚀', color: '#ef4444', scene: 'marsplanner', cards: ['mars'],
    title: t('Plan a trip to Mars'),
    blurb: t('Choose when to launch so that Mars is there when you arrive.'),
    task: t('Set how far ahead Mars is, then launch. Can you arrive just as Mars does?'),
  },
  {
    id: 'gravity', icon: '🧲', color: '#fb7185', scene: 'gravity', cards: ['earth', 'moon'],
    title: t('Gravity between two cards'),
    blurb: t('Slide the Earth and Moon cards together. The app measures the real gap.'),
    task: t('Halve the gap from 24 cm to 12 cm. What happens to the pull?'),
  },
];
export const labById = Object.fromEntries(LABS.map(l => [l.id, l]));
/** Order in which answer choices are shown, so the right answer is not always in the same place. */
export const OPTION_ORDER = { daynight: [0, 1, 2], seasons: [2, 0, 1], phases: [1, 2, 0], scale: [0, 1, 2], orbit: [0, 2, 1] };
