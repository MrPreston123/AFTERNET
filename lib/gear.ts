import { SHOP } from './config';

export type GearItem = {
  id: string;
  name: string;
  cat: string;
  icon: string;
  tier: 'Essential' | 'Recommended' | 'Long-term';
  price: string;
  why: string;
  look: string[];
  query: string;
};

export const GEAR_CATS = ['All', 'Power', 'Water', 'Medical', 'Comms', 'Light & Fire', 'Shelter', 'Food', 'Tools', 'Data'];

export const GEAR: GearItem[] = [
  {
    id: 'solar-bank', name: 'Solar power bank', cat: 'Power', icon: 'battery', tier: 'Essential', price: '€25–60',
    why: 'Keeps your phone, and AFTERNET, alive for days. Charge it from the sun, empty it into your phone at night.',
    look: ['20,000 mAh or more', 'USB-C Power Delivery', 'Built-in or fold-out solar panels', 'IP65+ water resistance'],
    query: 'solar power bank 20000mah usb c waterproof',
  },
  {
    id: 'solar-panel', name: 'Folding solar panel', cat: 'Power', icon: 'sun', tier: 'Essential', price: '€50–150',
    why: 'Built-in panels on power banks are slow. A 28–60 W folding panel refills a power bank in a few hours of sun.',
    look: ['28 W minimum, 60 W+ ideal', 'USB-A + USB-C outputs', 'Auto-restart after clouds', 'Grommets for hanging'],
    query: 'foldable solar panel charger 60w usb c',
  },
  {
    id: 'power-station', name: 'Portable power station', cat: 'Power', icon: 'bolt', tier: 'Recommended', price: '€250–900',
    why: 'Runs lights, a laptop, a router or a small fridge. Pairs with solar panels for a silent, fume-free generator.',
    look: ['LiFePO4 battery chemistry', '300–1,000 Wh capacity', 'Pure sine wave AC outlet', 'Solar (MPPT) input'],
    query: 'portable power station lifepo4 solar generator',
  },
  {
    id: 'crank-radio', name: 'Hand-crank emergency radio', cat: 'Comms', icon: 'radio', tier: 'Essential', price: '€25–60',
    why: 'Official emergency broadcasts reach you with no internet and no batteries. Most also charge a phone and act as a torch.',
    look: ['AM/FM (+ weather band in the US)', 'Hand crank + solar + USB', 'USB output to charge a phone', 'Built-in flashlight & SOS alarm'],
    query: 'hand crank emergency radio solar am fm usb',
  },
  {
    id: 'two-way', name: 'Two-way radios', cat: 'Comms', icon: 'radio', tier: 'Recommended', price: '€30–90',
    why: 'Talk to your family across a neighbourhood with no network at all. Licence-free.',
    look: ['PMR446 (Europe) or FRS (US)', 'Rechargeable via USB', 'Privacy codes', 'Pack of 2–4'],
    query: 'pmr446 walkie talkie rechargeable long range',
  },
  {
    id: 'water-filter', name: 'Personal water filter', cat: 'Water', icon: 'drop', tier: 'Essential', price: '€20–45',
    why: 'Turns stream, rain or tap water of unknown quality into drinkable water. Filters thousands of litres.',
    look: ['0.1 micron hollow fibre', 'Rated 1,000+ litres', 'Squeeze or gravity bag included', 'Can attach to bottles'],
    query: 'portable water filter 0.1 micron squeeze',
  },
  {
    id: 'purify-tabs', name: 'Water purification tablets', cat: 'Water', icon: 'drop', tier: 'Essential', price: '€8–15',
    why: 'Light, cheap and kills viruses that filters miss. The perfect backup.',
    look: ['Chlorine dioxide', 'Individually foil-sealed', 'Long shelf life (4–5 years)'],
    query: 'chlorine dioxide water purification tablets',
  },
  {
    id: 'water-can', name: 'Collapsible water containers', cat: 'Water', icon: 'drop', tier: 'Recommended', price: '€15–35',
    why: 'Store and carry water when taps stop. Fold flat when empty.',
    look: ['Food-grade, BPA-free', '10–20 litre', 'Tap/spigot', 'Carry handle'],
    query: 'collapsible water container 20l food grade spigot',
  },
  {
    id: 'trauma-kit', name: 'Trauma first aid kit + tourniquet', cat: 'Medical', icon: 'medkit', tier: 'Essential', price: '€40–120',
    why: 'Most standard kits are plasters. You want a kit that can stop serious bleeding.',
    look: ['Genuine windlass tourniquet (avoid cheap copies)', 'Pressure bandage', 'Haemostatic or packing gauze', 'Shears, gloves, foil blanket'],
    query: 'trauma first aid kit with tourniquet ifak',
  },
  {
    id: 'blankets', name: 'Emergency foil blankets', cat: 'Shelter', icon: 'shield', tier: 'Essential', price: '€8–15',
    why: 'Pocket-sized heat retention for hypothermia, shock or a cold night.',
    look: ['Pack of 5–10', 'Reflective on both sides', 'Or a reusable bivvy bag'],
    query: 'emergency mylar thermal blankets pack',
  },
  {
    id: 'headlamp', name: 'Rechargeable headlamp', cat: 'Light & Fire', icon: 'light', tier: 'Essential', price: '€20–50',
    why: 'Hands-free light for cooking, first aid and repairs in the dark.',
    look: ['USB-C rechargeable', 'Red-light mode (saves night vision)', '300+ lumens', 'Also accepts AAA batteries'],
    query: 'rechargeable headlamp usb c red light',
  },
  {
    id: 'fire', name: 'Ferro rod & stormproof matches', cat: 'Light & Fire', icon: 'flame', tier: 'Essential', price: '€10–25',
    why: 'Fire means warmth, safe water and cooked food. A ferro rod lights thousands of times, even wet.',
    look: ['Thick rod (10 mm+)', 'Stormproof matches in waterproof case', 'Some tinder tabs'],
    query: 'ferro rod fire starter stormproof matches',
  },
  {
    id: 'stove', name: 'Camping stove + fuel', cat: 'Food', icon: 'flame', tier: 'Recommended', price: '€25–70',
    why: 'Boil water and cook when the power is out. Use outdoors only.',
    look: ['Butane/propane or multi-fuel', 'Piezo ignition', 'Windshield', 'Spare fuel canisters'],
    query: 'portable camping gas stove',
  },
  {
    id: 'food-ration', name: 'Emergency food rations', cat: 'Food', icon: 'food', tier: 'Recommended', price: '€30–150',
    why: 'Long shelf-life calories you never have to think about until you need them.',
    look: ['5–25 year shelf life', 'Freeze-dried meals or ration bars', '2,000+ kcal per person per day'],
    query: 'emergency food supply freeze dried 25 year',
  },
  {
    id: 'multitool', name: 'Multitool', cat: 'Tools', icon: 'tool', tier: 'Essential', price: '€30–120',
    why: 'Pliers, knife, saw, screwdrivers, can opener. A toolbox in your pocket.',
    look: ['Locking blades', 'Full-size pliers + wire cutters', 'Stainless steel', 'Long warranty'],
    query: 'multitool pliers stainless steel locking',
  },
  {
    id: 'compass', name: 'Baseplate compass', cat: 'Tools', icon: 'compass', tier: 'Recommended', price: '€15–40',
    why: 'Never runs out of battery. Pair with paper maps of your area.',
    look: ['Liquid-filled capsule', 'Adjustable declination', 'Ruler scales', 'Mirror sight for accuracy'],
    query: 'baseplate compass declination adjustment',
  },
  {
    id: 'storage', name: 'High-capacity offline storage', cat: 'Data', icon: 'storage', tier: 'Recommended', price: '€15–60',
    why: 'Store the full Wikipedia (about 100 GB with images), maps for whole countries and AI models. Share them device to device.',
    look: ['256 GB–1 TB', 'USB-C flash drive or microSD for phones', 'Rugged / waterproof'],
    query: 'usb c flash drive 256gb rugged',
  },
  {
    id: 'faraday', name: 'Faraday bag', cat: 'Data', icon: 'shield', tier: 'Long-term', price: '€15–40',
    why: 'Protects a spare phone or drive loaded with AFTERNET from electromagnetic pulses and solar storms.',
    look: ['Multi-layer shielding', 'Tested attenuation (dB) rating', 'Sized for a phone or tablet'],
    query: 'faraday bag phone',
  },
];

export function gearLink(item: GearItem) {
  const tag = SHOP.amazonTag ? `&tag=${encodeURIComponent(SHOP.amazonTag)}` : '';
  return `https://www.${SHOP.amazonDomain}/s?k=${encodeURIComponent(item.query)}${tag}`;
}
