// Bedside guide shown in the Teacher area. Mirrors docs/TEACHER_GUIDE.md.
import { t } from './cards.js';

export const GUIDE = [
  { ordered: true, title: t('A 10 to 15 minute bedside session'), items: [
    t('Check with the nurse that the child is well enough today. Wipe the card and the tablet.'),
    t('Start a session in the Teacher tab. Use a learner code, never a name.'),
    t('Pick the child’s level together. You can change it at any time from the top of the screen.'),
    t('Put a card on the tray table and choose Scan a card. If the child cannot hold or see a card, choose Explore in 3D.'),
    t('Let the child lead: tap the glowing dots, move the sliders, ask what they notice.'),
    t('Run one mission. Ask the prediction question first and accept any answer without correcting it.'),
    t('Read the explanation together, then ask the Talk about it question.'),
    t('End the session and let the child pick a face. Leave the card with the child if infection-control rules allow.'),
  ] },
  { title: t('Stop the session if'), items: [
    t('the child looks tired, dizzy, in pain or upset, or simply asks to stop'),
    t('a nurse or doctor needs the child or the bed space'),
    t('the tablet is too heavy to hold: use a stand, or hold it for the child'),
  ] },
  { title: t('Hygiene'), items: [
    t('Wipe cards and tablet with the ward’s approved disinfectant before and after every child.'),
    t('In isolation rooms use a single-patient card set that stays in the room.'),
    t('Replace any card whose lamination is peeling or cracked.'),
  ] },
  { title: t('If the card is not recognised'), items: [
    t('Tilt the card or the tablet a little to move the glare off the black-and-white square.'),
    t('Keep the whole square in view, with fingers off it, 20 to 50 cm from the camera.'),
    t('Switch to 3D at the top of the screen: everything works without the card.'),
  ] },
];
