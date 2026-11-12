// Card deck content, in English. Text is wrapped in t() so translations can be added later.
// Facts are drafted from standard NASA and ISRO public figures and still need a
// line-by-line science review: see docs/CONTENT_SOURCES.md.
// Three levels: explorer (Grades 3-5), navigator (6-8), scientist (9-12).

export const t = en => ({ en });

export const LEVELS = [
  { id: 'explorer', icon: '🔭', name: t('Explorer'), grades: t('Grades 3–5'),
    blurb: t('Look, tap and wonder') },
  { id: 'navigator', icon: '🧭', name: t('Navigator'), grades: t('Grades 6–8'),
    blurb: t('Measure and compare') },
  { id: 'scientist', icon: '🧪', name: t('Scientist'), grades: t('Grades 9–12'),
    blurb: t('Test ideas with numbers') },
];

export const CARDS = [
  {
    id: 'solar-system', n: 1, color: '#f59e0b', pairs: ['sun'], lab: 'kepler',
    title: t('Our Solar System'),
    tagline: t('Eight planets, one star'),
    levels: {
      explorer: {
        intro: t('Eight planets travel around the Sun. Each one follows its own path, called an orbit. Tap a planet to meet it.'),
        facts: [
          t('Planets near the Sun are small and rocky. The far ones are giant and made of gas or ice.'),
          t('Earth takes one year to go once around the Sun.'),
          t('Neptune is so far away that one trip around the Sun takes 165 years.'),
        ],
      },
      navigator: {
        intro: t('The Sun holds 99.8% of all the mass in the solar system, so its gravity keeps every planet in orbit. The closer a planet is, the faster it moves.'),
        facts: [
          t('Mercury orbits in 88 days. Earth takes 365 days. Jupiter takes almost 12 years.'),
          t('The planets are shown where they really are today. Sizes and distances are squeezed to fit on the card.'),
          t('Sunlight reaches Earth in about 8 minutes, and Neptune in about 4 hours.'),
        ],
      },
      scientist: {
        intro: t("Kepler's third law links every orbit: T² = a³ when T is in years and a is in astronomical units (AU). Tap planets and check that T²/a³ stays close to 1."),
        facts: [
          t('Orbital speed falls with distance: v = √(GM/r). Mercury moves at 47 km/s, Neptune at only 5.4 km/s.'),
          t('1 AU is the average Earth–Sun distance: about 149.6 million km.'),
          t('Orbits are ellipses with the Sun at one focus. Most planetary orbits are very nearly circles.'),
        ],
      },
    },
    hotspots: {
      sun: [t('The Sun'), t('Our star. All eight planets orbit it.')],
      mercury: [t('Mercury'), t('The smallest planet and the closest to the Sun. Year: 88 days.')],
      venus: [t('Venus'), t('The hottest planet, about 465°C, wrapped in thick clouds.')],
      earth: [t('Earth'), t('Our home. The only world known to have life.')],
      mars: [t('Mars'), t('The red planet. India’s Mangalyaan reached it in 2014.')],
      jupiter: [t('Jupiter'), t('The biggest planet. 11 Earths would fit across it.')],
      saturn: [t('Saturn'), t('Famous for its bright rings of ice.')],
      uranus: [t('Uranus'), t('An ice giant that spins lying on its side.')],
      neptune: [t('Neptune'), t('The farthest planet. Winds reach 2,000 km/h.')],
    },
  },
  {
    id: 'earth', n: 2, color: '#3b82f6', pairs: ['sun', 'moon'], mission: 'daynight',
    title: t('Earth'),
    tagline: t('Our spinning home'),
    levels: {
      explorer: {
        intro: t('Earth is a giant ball that spins like a top. When India faces the Sun it is day. When India turns away it is night.'),
        facts: [
          t('Earth spins once every 24 hours. That is one day.'),
          t('Most of Earth is covered by ocean. That is why it looks blue from space.'),
          t('You are spinning with the Earth right now, but it is so smooth you cannot feel it.'),
        ],
      },
      navigator: {
        intro: t('Earth spins on an axis tilted by 23.4°. The spin gives us day and night. The tilt gives us seasons.'),
        facts: [
          t('At the equator the ground moves at about 1,670 km/h because of Earth’s spin.'),
          t('Earth is 12,742 km wide. A plane would need about two days to fly around it.'),
          t('About 71% of the surface is water.'),
        ],
      },
      scientist: {
        intro: t('Earth rotates once in 23 h 56 min (a sidereal day). The line between day and night is called the terminator. The axis keeps pointing at the same star, Polaris, all year.'),
        facts: [
          t('Speed from rotation at latitude φ is v = 1,670 × cos φ km/h. At Delhi (28.6°N) that is about 1,470 km/h.'),
          t('Indian Standard Time is set at longitude 82.5°E, which is 5 h 30 min ahead of Greenwich.'),
          t('Earth’s mass is 5.97 × 10²⁴ kg and surface gravity is 9.8 m/s².'),
        ],
      },
    },
    hotspots: {
      india: [t('India'), t('The dots are Delhi, Mumbai, Kolkata, Chennai and Bengaluru. Watch them cross from day into night.')],
      axis: [t('Earth’s axis'), t('Earth spins around this line. It leans over by 23.4°.')],
      night: [t('Night side'), t('This half is facing away from the Sun, so it is dark here.')],
    },
  },
  {
    id: 'moon', n: 3, color: '#cbd5e1', pairs: ['earth'], mission: 'phases',
    title: t('The Moon'),
    tagline: t('Earth’s companion'),
    levels: {
      explorer: {
        intro: t('The Moon is a ball of rock that travels around the Earth. It does not make its own light. It shines because sunlight bounces off it.'),
        facts: [
          t('The dark patches are flat plains of old lava. The round marks are craters made by space rocks.'),
          t('On the Moon you could jump six times higher than on Earth.'),
          t('India landed Chandrayaan-3 near the Moon’s south pole in 2023.')],
      },
      navigator: {
        intro: t('The Moon orbits Earth once every 27.3 days and always keeps the same face towards us. Half of it is always in sunlight.'),
        facts: [
          t('The Moon is about 384,400 km away. That is 30 Earths side by side.'),
          t('The Moon is 3,474 km wide, about one quarter of Earth’s width.'),
          t('From one full moon to the next takes 29.5 days.'),
        ],
      },
      scientist: {
        intro: t('The Moon is tidally locked: it rotates once per orbit, so one hemisphere always faces Earth. Its gravity raises the ocean tides on Earth.'),
        facts: [
          t('Surface gravity is 1.62 m/s², about one sixth of Earth’s.'),
          t('The sidereal month is 27.32 days but the cycle of phases is 29.53 days, because Earth moves around the Sun meanwhile.'),
          t('The Moon is moving away from Earth by about 3.8 cm every year.'),
        ],
      },
    },
    hotspots: {
      maria: [t('Seas of lava'), t('These dark plains formed when lava filled giant craters billions of years ago.')],
      tycho: [t('Tycho crater'), t('A bright, young crater 85 km wide. Its rays stretch across the Moon.')],
      southpole: [t('Shiv Shakti Point'), t('Chandrayaan-3 landed here, near the south pole, on 23 August 2023.')],
    },
  },
  {
    id: 'sun', n: 4, color: '#fbbf24', pairs: ['earth', 'solar-system'], mission: 'seasons',
    title: t('The Sun'),
    tagline: t('Our nearest star'),
    levels: {
      explorer: {
        intro: t('The Sun is a star: a huge ball of glowing gas. It gives us light and heat. Never look straight at the real Sun.'),
        facts: [
          t('The Sun is so big that 109 Earths would fit across it.'),
          t('Its light takes about 8 minutes to reach us.'),
          t('India’s Aditya-L1 spacecraft watches the Sun all day, every day.'),
        ],
      },
      navigator: {
        intro: t('The Sun is made mostly of hydrogen and helium. Deep in its core, hydrogen is squeezed into helium. This releases the energy that lights the solar system.'),
        facts: [
          t('The surface is about 5,500°C. The core is about 15 million °C.'),
          t('Sunspots are cooler, darker patches. Many are bigger than Earth.'),
          t('Aditya-L1 sits 1.5 million km from Earth at a point called L1, where it always sees the Sun.'),
        ],
      },
      scientist: {
        intro: t('The Sun fuses about 600 million tonnes of hydrogen every second. Around 4 million tonnes of that mass becomes energy, following E = mc².'),
        facts: [
          t('Luminosity: 3.8 × 10²⁶ W. At Earth this arrives as about 1,361 W on every square metre.'),
          t('Energy made in the core takes more than 100,000 years to work its way out to the surface.'),
          t('The corona is over a million °C, far hotter than the surface. Why is still being studied, including by Aditya-L1.'),
        ],
      },
    },
    hotspots: {
      core: [t('Core'), t('The Sun’s engine. Hydrogen fuses into helium at 15 million °C.')],
      sunspot: [t('Sunspot'), t('A cooler patch caused by strong magnetism. It looks dark only because the rest is brighter.')],
      flare: [t('Prominence'), t('A loop of glowing gas held up by magnetism. Many Earths could fit under it.')],
      earthsize: [t('Earth, to scale'), t('This tiny dot is how big Earth is next to the Sun.')],
    },
  },
  {
    id: 'mars', n: 5, color: '#ef4444', pairs: ['earth', 'sun'], lab: 'marsplanner',
    title: t('Mars'),
    tagline: t('The red planet'),
    levels: {
      explorer: {
        intro: t('Mars is a cold, dusty desert world. It looks red because its soil is full of rust.'),
        facts: [
          t('Mars has the tallest volcano of any planet: Olympus Mons.'),
          t('Mars has two tiny moons, Phobos and Deimos.'),
          t('India’s Mangalyaan reached Mars in 2014, on its very first try.'),
        ],
      },
      navigator: {
        intro: t('Mars is about half as wide as Earth. A day there lasts 24 h 37 min, almost like ours, but a year lasts 687 Earth days.'),
        facts: [
          t('Olympus Mons is about 22 km high, roughly two and a half times Mount Everest.'),
          t('Valles Marineris is a canyon 4,000 km long, longer than India is from north to south.'),
          t('Gravity on Mars is 38% of Earth’s. A 30 kg child would feel like 11 kg.'),
        ],
      },
      scientist: {
        intro: t('Spacecraft reach Mars on a Hohmann transfer: half an ellipse that touches Earth’s orbit at launch and Mars’s orbit on arrival. The launch window opens about every 26 months.'),
        facts: [
          t('The transfer takes about 259 days. Mars must be about 44° ahead of Earth at launch.'),
          t('The thin air is 95% carbon dioxide. Surface pressure is under 1% of Earth’s.'),
          t('The Mars Orbiter Mission cost about ₹450 crore, among the least expensive Mars missions ever flown.'),
        ],
      },
    },
    hotspots: {
      olympus: [t('Olympus Mons'), t('The tallest volcano in the solar system, about 22 km high.')],
      valles: [t('Valles Marineris'), t('A canyon system 4,000 km long and up to 7 km deep.')],
      icecap: [t('Polar ice cap'), t('Frozen water and frozen carbon dioxide. It grows in winter and shrinks in summer.')],
      moons: [t('Phobos and Deimos'), t('Two small, potato-shaped moons. Phobos circles Mars three times a day.')],
      mangalyaan: [t('Mangalyaan'), t('India’s Mars Orbiter Mission. It studied Mars from orbit from 2014 to 2022.')],
    },
  },
  {
    id: 'jupiter', n: 6, color: '#d97706', pairs: ['sun', 'earth'],
    title: t('Jupiter'),
    tagline: t('King of the planets'),
    levels: {
      explorer: {
        intro: t('Jupiter is the biggest planet. It has no ground to stand on. It is a giant ball of gas with stripes made of clouds.'),
        facts: [
          t('The Great Red Spot is a storm bigger than Earth.'),
          t('Jupiter spins so fast that a day lasts under 10 hours.'),
          t('Four of its moons are so big you can spot them with binoculars.'),
        ],
      },
      navigator: {
        intro: t('Jupiter is 11 times wider than Earth and has more than twice the mass of all the other planets put together. Galileo found its four largest moons in 1610.'),
        facts: [
          t('Io has more than 400 active volcanoes.'),
          t('Europa hides a salty ocean under its shell of ice.'),
          t('Ganymede is the largest moon in the solar system, bigger than the planet Mercury.'),
        ],
      },
      scientist: {
        intro: t('Jupiter is 318 Earth masses of mostly hydrogen and helium. Its moons Io, Europa and Ganymede are in a 4:2:1 orbital resonance: watch Io go round four times for each orbit of Ganymede.'),
        facts: [
          t('Orbital periods: Io 1.77 d, Europa 3.55 d, Ganymede 7.15 d, Callisto 16.7 d.'),
          t('Timing these moons let Ole Rømer make the first estimate of the speed of light, in 1676.'),
          t('Jupiter’s magnetic field is about 20 times stronger than Earth’s.'),
        ],
      },
    },
    hotspots: {
      redspot: [t('Great Red Spot'), t('A giant storm that has been seen for well over 150 years.')],
      io: [t('Io'), t('The most volcanic world we know.')],
      europa: [t('Europa'), t('An icy moon with an ocean underneath. A place to look for life.')],
      ganymede: [t('Ganymede'), t('The biggest moon in the solar system.')],
      callisto: [t('Callisto'), t('One of the most heavily cratered surfaces anywhere.')],
    },
  },
  {
    id: 'saturn', n: 7, color: '#eab308', pairs: ['sun', 'earth'],
    title: t('Saturn'),
    tagline: t('Lord of the rings'),
    levels: {
      explorer: {
        intro: t('Saturn is a giant gas planet with beautiful rings. The rings are not solid. They are made of billions of pieces of ice.'),
        facts: [
          t('Some ring pieces are as small as sand. Some are as big as a house.'),
          t('Saturn is so light for its size that it would float in a big enough bathtub.'),
          t('Saturn has more moons than any other planet.'),
        ],
      },
      navigator: {
        intro: t('Saturn’s rings stretch about 280,000 km across, yet most of them are only around 10 metres thick. Saturn takes 29 Earth years to orbit the Sun.'),
        facts: [
          t('The dark gap in the rings is the Cassini Division, about 4,700 km wide.'),
          t('Titan, the largest moon, has a thick atmosphere and lakes of liquid methane.'),
          t('Saturn has more than 270 known moons.'),
        ],
      },
      scientist: {
        intro: t('Saturn’s mean density is 0.69 g/cm³, lower than water. Rings exist inside the Roche limit, where tidal forces stop ice from clumping into a moon.'),
        facts: [
          t('Each ring particle is a tiny moon obeying Kepler’s laws: the inner edge orbits in about 6 hours, the outer edge in about 14.'),
          t('Saturn’s axis is tilted 26.7°, so it has seasons and we see the rings open and close over 29 years.'),
          t('The Cassini Division is kept clear by a 2:1 resonance with the moon Mimas.'),
        ],
      },
    },
    hotspots: {
      rings: [t('The rings'), t('Billions of pieces of water ice, each one orbiting Saturn.')],
      cassini: [t('Cassini Division'), t('A gap in the rings swept nearly clear by the pull of a moon.')],
      titan: [t('Titan'), t('A moon bigger than Mercury, with clouds, rain and lakes of methane.')],
    },
  },
  {
    id: 'iss', n: 8, color: '#22d3ee', pairs: ['earth'], mission: 'orbit',
    title: t('Space Station'),
    tagline: t('A home in orbit'),
    levels: {
      explorer: {
        intro: t('The International Space Station is a home and laboratory that flies around the Earth. Astronauts live and work inside it.'),
        facts: [
          t('It goes around the whole Earth in about 90 minutes.'),
          t('Astronauts on board see 16 sunrises every day.'),
          t('In 2025 Shubhanshu Shukla became the first Indian to stay on the Space Station.'),
        ],
      },
      navigator: {
        intro: t('The station flies about 400 km above the ground at 27,600 km/h. It is as long as a football field and has been lived in without a break since November 2000.'),
        facts: [
          t('400 km is close: about as far as Delhi is from Amritsar.'),
          t('Its giant solar panels turn sunlight into electricity.'),
          t('You can see it from India with your own eyes, as a bright dot gliding across the evening sky.'),
        ],
      },
      scientist: {
        intro: t('At 400 km, gravity is still about 88% of its surface value. Astronauts float because the station is in free fall: it moves sideways at 7.66 km/s, so as it falls the ground curves away beneath it.'),
        facts: [
          t('Orbital speed: v = √(GM/r) = 7.66 km/s for r = 6,771 km.'),
          t('g at altitude h: g = 9.8 × (R/(R+h))². For h = 400 km this gives 8.7 m/s².'),
          t('Thin air still drags on the station, so its engines must boost it back up several times a year.'),
        ],
      },
    },
    hotspots: {
      solar: [t('Solar arrays'), t('Eight huge wings that make electricity from sunlight.')],
      modules: [t('Modules'), t('Rooms joined together where the crew live, sleep and do experiments.')],
      radiators: [t('Radiators'), t('White panels that get rid of extra heat.')],
    },
  },
  {
    id: 'rocket', n: 9, color: '#f97316', pairs: ['chandrayaan', 'earth'],
    title: t('LVM3 Rocket'),
    tagline: t('India’s heavy lifter'),
    levels: {
      explorer: {
        intro: t('LVM3 is India’s most powerful rocket. It carried Chandrayaan-3 on its way to the Moon. Slide the timeline to watch it fly.'),
        facts: [
          t('It is 43.5 metres tall, like a 14-storey building.'),
          t('A rocket drops its empty parts as it climbs. A lighter rocket can go faster.'),
          t('It launches from Sriharikota, on the coast of Andhra Pradesh.'),
        ],
      },
      navigator: {
        intro: t('LVM3 has three stages. Two solid boosters lift it off the pad, a liquid core stage takes over, and a cryogenic upper stage gives the final push to orbit.'),
        facts: [
          t('At lift-off it weighs 640 tonnes, as much as about 130 elephants.'),
          t('It can carry 4,000 kg to a high transfer orbit, or about 8,000 kg to low Earth orbit.'),
          t('A human-rated version will carry Indian astronauts on the Gaganyaan mission.'),
        ],
      },
      scientist: {
        intro: t('A rocket works by Newton’s third law: it throws exhaust down and is pushed up. Staging matters because of the rocket equation, Δv = vₑ ln(m₀/m₁): shedding dead mass raises the mass ratio.'),
        facts: [
          t('The C25 stage burns liquid hydrogen at −253°C with liquid oxygen at −183°C.'),
          t('Each S200 booster holds about 205 tonnes of solid propellant, among the largest solid boosters in the world.'),
          t('Low Earth orbit needs about 7.8 km/s of speed, plus about 1.5 km/s more to beat gravity and air drag on the way up.'),
        ],
      },
    },
    hotspots: {
      boosters: [t('S200 boosters'), t('Two solid rockets that fire first and fall away after about two minutes.')],
      core: [t('L110 core stage'), t('Two Vikas liquid-fuel engines. They light up while the rocket is already in flight.')],
      cryo: [t('C25 cryogenic stage'), t('Burns super-cold hydrogen and oxygen for the final push.')],
      fairing: [t('Payload fairing'), t('The nose cone. It protects the spacecraft, then splits open above the air.')],
    },
  },
  {
    id: 'chandrayaan', n: 10, color: '#a78bfa', pairs: ['moon', 'rocket'],
    title: t('Chandrayaan-3'),
    tagline: t('India on the Moon'),
    levels: {
      explorer: {
        intro: t('On 23 August 2023 India landed the Vikram lander on the Moon. A small rover named Pragyan rolled out to explore. Tap the ground to drive the rover.'),
        facts: [
          t('India was the first country to land near the Moon’s south pole.'),
          t('Pragyan has six wheels and moves slowly: 1 centimetre every second.'),
          t('23 August is now celebrated as National Space Day.'),
        ],
      },
      navigator: {
        intro: t('Chandrayaan-3 was launched on 14 July 2023 and touched down 40 days later at about 69° south. That made India the fourth country to make a soft landing on the Moon.'),
        facts: [
          t('The rover weighs 26 kg and runs on solar power. It drove about 100 metres.'),
          t('Both worked for one lunar day, which is about 14 Earth days of sunlight.'),
          t('Scientists want to explore the south pole because craters there may hold frozen water.'),
        ],
      },
      scientist: {
        intro: t('With no air for parachutes, Vikram landed using engines alone, slowing from about 1.7 km/s to under 2 m/s in a powered descent of roughly 19 minutes.'),
        facts: [
          t('Pragyan’s laser instrument (LIBS) confirmed sulphur in the soil near the south pole.'),
          t('The ChaSTE probe found the temperature fell by around 60°C within the top 8 cm of soil.'),
          t('Near the pole the Sun stays low, so some crater floors have been in shadow for billions of years.'),
        ],
      },
    },
    hotspots: {
      lander: [t('Vikram lander'), t('Carried the rover to the surface and measured moonquakes and soil temperature.')],
      rover: [t('Pragyan rover'), t('A six-wheeled robot the size of a small suitcase. Its name means wisdom.')],
      ramp: [t('Ramp'), t('The rover rolled down this ramp a few hours after landing.')],
      earth: [t('Earth in the sky'), t('From the Moon, Earth hangs in the sky, almost four times wider than the Moon looks from home.')],
    },
  },
];

export const cardById = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const cardByMarker = Object.fromEntries(CARDS.map(c => [c.n, c]));
