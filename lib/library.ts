/**
 * AFTERNET Survival Library. Bundled into the app, so it is available with zero network.
 * Body format: "## " heading, "- " bullet, "1. " numbered, "> ! " warning, "> " tip, **bold**.
 * General information only. Not a substitute for hands-on first aid training.
 */

export type Category = { id: string; name: string; icon: string; group: 'survive' | 'rebuild'; blurb: string };
export type Guide = { id: string; cat: string; title: string; summary: string; minutes: number; body: string; urgent?: boolean };

export const CATEGORIES: Category[] = [
  { id: 'first-aid', name: 'First Aid', icon: 'medkit', group: 'survive', blurb: 'Keep someone alive until help arrives, or when it never does.' },
  { id: 'water', name: 'Water', icon: 'drop', group: 'survive', blurb: 'Find it, make it safe, store it.' },
  { id: 'food', name: 'Food', icon: 'food', group: 'survive', blurb: 'Stockpile, ration, forage safely and cook without power.' },
  { id: 'shelter', name: 'Shelter & Fire', icon: 'tent', group: 'survive', blurb: 'Stay warm, dry and protected.' },
  { id: 'power', name: 'Power & Electricity', icon: 'bolt', group: 'survive', blurb: 'Keep your devices, and this system, running.' },
  { id: 'nav', name: 'Navigation & Comms', icon: 'compass', group: 'survive', blurb: 'Find your way and reach people without a network.' },
  { id: 'grow', name: 'Growing Food', icon: 'sprout', group: 'rebuild', blurb: 'Gardens, seeds and soil for the long run.' },
  { id: 'preserve', name: 'Preserving', icon: 'jar', group: 'rebuild', blurb: 'Make a harvest last through winter.' },
  { id: 'health', name: 'Sanitation & Health', icon: 'shield', group: 'rebuild', blurb: 'Most disasters kill through disease. Prevent it.' },
  { id: 'build', name: 'Tools & Repair', icon: 'tool', group: 'rebuild', blurb: 'Fix, make and maintain what you have.' },
  { id: 'community', name: 'Community & Plans', icon: 'people', group: 'rebuild', blurb: 'Nobody rebuilds alone.' },
];

export const GUIDES: Guide[] = [
  // ───────────── FIRST AID ─────────────
  {
    id: 'cpr',
    cat: 'first-aid',
    title: 'CPR & choking (adults)',
    summary: 'Restart circulation and clear a blocked airway.',
    minutes: 4,
    urgent: true,
    body: `> ! If phones still work, call emergency services first (112 in Europe, 911 in North America) or get someone else to.

## Check
1. Make sure the scene is safe for you.
2. Tap their shoulders and shout. No response?
3. Tilt the head back, lift the chin, and look for normal breathing for no more than 10 seconds. Gasping is not normal breathing.

## Compressions
1. Kneel beside them. Heel of one hand in the centre of the chest, other hand on top, fingers interlocked.
2. Arms straight, shoulders over hands. Push down **5–6 cm** (about 2 inches).
3. Rate **100–120 per minute**. The beat of "Stayin' Alive" is about right.
4. Let the chest fully rise between pushes.

## Breaths (if trained and willing)
- After **30 compressions**, give **2 breaths**: tilt head, pinch nose, seal your mouth over theirs, blow for 1 second until the chest rises.
- If you can't or won't give breaths, do continuous compressions. Hands-only CPR still saves lives.

## Keep going until
- They start breathing normally, an AED arrives, trained help takes over, or you are physically unable to continue.
- Swap with another rescuer every 2 minutes if possible. Quality drops fast when you tire.

## AED
Switch it on and follow the voice prompts. Pads go on bare chest: upper right below the collarbone, and lower left on the side of the ribs. Nobody touches the person during the shock.

## Choking
- If they can cough, encourage coughing.
- If they can't cough, speak or breathe: give **5 sharp back blows** between the shoulder blades, then **5 abdominal thrusts** (fist above the belly button, pull sharply in and up). Repeat.
- If they go unconscious, lower them down and start CPR. Check the mouth for the object before breaths.`,
  },
  {
    id: 'bleeding',
    cat: 'first-aid',
    title: 'Severe bleeding & tourniquets',
    summary: 'Stop life-threatening blood loss in minutes.',
    minutes: 3,
    urgent: true,
    body: `Major bleeding can kill in under five minutes. Act immediately.

## 1. Direct pressure
1. Put on gloves if you have them. Don't let that slow you down.
2. Press hard directly on the wound with a clean cloth, gauze, or your hand.
3. Keep pressure on for at least **10 minutes** without lifting to check.
4. If blood soaks through, add more material on top. Don't remove the first layer.

## 2. Pack deep wounds
For deep wounds in the armpit, groin or neck where a tourniquet won't work, pack gauze or clean cloth firmly **into** the wound, then hold hard pressure on top.

## 3. Tourniquet (arms and legs only)
Use when pressure doesn't stop bleeding from a limb, or bleeding is spurting.
1. Place it **5–7 cm above the wound**, never on a joint. If unsure, go high on the limb.
2. Tighten until the bleeding stops. This will hurt. That's normal.
3. Lock the windlass and **write down the time** it was applied (on the tourniquet or their forehead).
4. Do not loosen or remove it. That's for medical professionals.

> An improvised tourniquet needs a wide band (at least 4 cm, like a folded triangular bandage) and a stick to twist. Thin cord or wire causes damage and doesn't work well.

## Then
- Treat for shock: lay them down, keep them warm.
- Watch for pale, cold, clammy skin, fast breathing, confusion. These mean serious blood loss.`,
  },
  {
    id: 'burns',
    cat: 'first-aid',
    title: 'Burns',
    summary: 'Cool, cover, and know when it is serious.',
    minutes: 2,
    body: `## Cool it
1. Stop the burning: remove from heat, smother flames, remove hot or chemical-soaked clothing (unless stuck to the skin).
2. Cool under **cool running water for 20 minutes**. This still helps up to 3 hours after the burn.
3. Remove rings and watches before swelling starts.

> ! No ice, butter, oils, toothpaste or creams. Don't pop blisters.

## Cover it
- Cover loosely with cling film (lay it on, don't wrap tight) or a clean, non-fluffy dressing.
- Keep the person warm. Cooling large burns can cause hypothermia.

## Serious if
- Larger than the person's palm, deep (white, leathery or charred), or on the face, hands, feet, joints or genitals.
- Caused by chemicals or electricity, or the person breathed in smoke (hoarse voice, soot around nose or mouth).
- The person is a young child or elderly.

## Chemical burns
Brush off dry chemicals first, then flush with lots of water for at least 20 minutes.

## Afterwards
Watch for infection: increasing redness, swelling, pus, fever. Keep the wound clean and covered.`,
  },
  {
    id: 'fractures',
    cat: 'first-aid',
    title: 'Fractures, sprains & splints',
    summary: 'Immobilise injuries and move people safely.',
    minutes: 3,
    body: `## Signs of a fracture
Pain, swelling, deformity, inability to use the limb, grating feeling, or bone visible through the skin (open fracture).

## Splinting
1. Don't try to straighten a badly bent limb unless circulation below the injury is lost and help is hours or days away.
2. Pad the splint well. Use boards, branches, rolled magazines, trekking poles.
3. The splint must cover the joint **above and below** the break.
4. Tie it firmly but check circulation below every 15–30 minutes: skin colour, warmth, feeling. Loosen if fingers or toes go pale, blue, numb or cold.
5. An arm can be supported in a sling against the chest. A leg can be splinted to the other leg.

## Open fractures
Cover the wound with a clean dressing. Control bleeding around the bone without pressing on the bone itself.

## Spine and neck
If they fell from height, were in a crash, or have neck or back pain, numbness or tingling: **don't move them** unless they are in danger. Keep the head in line with the body.

## Sprains: RICE
- **Rest** the joint.
- **Ice** (wrapped in cloth) 20 minutes at a time.
- **Compression** with an elastic bandage.
- **Elevation** above heart level.`,
  },
  {
    id: 'cold',
    cat: 'first-aid',
    title: 'Hypothermia & frostbite',
    summary: 'Recognise cold injury early and rewarm safely.',
    minutes: 3,
    body: `## Hypothermia signs
- **Mild:** shivering, clumsy hands, slurred speech, poor decisions ("the umbles").
- **Severe:** shivering stops, confusion, drowsiness, slow breathing. This is an emergency.

## Treatment
1. Get them out of wind and wet into shelter.
2. Remove wet clothing and replace with dry layers.
3. Insulate from the ground. The ground steals heat faster than air.
4. Wrap in blankets, sleeping bag, and an emergency foil blanket. Cover the head.
5. Warm the core: warm (not hot) packs or bottles at armpits, chest and groin, wrapped in cloth. Skin-to-skin contact in a sleeping bag works.
6. If fully alert and able to swallow: warm, sweet drinks.

> ! Handle severe cases very gently. Rough movement can trigger cardiac arrest. No alcohol, and don't rub limbs.

## Frostbite
White, grey or waxy skin that feels hard or numb. Usually fingers, toes, nose, ears.
- **Don't rewarm if there's a chance it will freeze again.** Refreezing does more damage.
- Rewarm in warm water around **37–39°C** (comfortable to an uninjured hand) for 15–30 minutes. It will hurt.
- Don't rub it, don't use direct fire heat, don't walk on thawed feet if you can avoid it.
- Loosely cover with dry dressings between fingers and toes.`,
  },
  {
    id: 'heat',
    cat: 'first-aid',
    title: 'Heat exhaustion & heatstroke',
    summary: 'Cool people fast. Heatstroke kills.',
    minutes: 2,
    body: `## Heat exhaustion
Heavy sweating, headache, dizziness, nausea, cramps, fast pulse.
- Move to shade or a cool place. Lie down with legs raised.
- Loosen clothing, fan them, sponge with water.
- Give water or an oral rehydration drink if they can swallow.
- Should improve within 30 minutes. If not, treat as heatstroke.

## Heatstroke (emergency)
Very high body temperature (over 40°C), **confusion, slurred speech, collapse, seizures**. Skin may be hot and dry or still sweaty.
1. Cool them **as fast as possible**. The best method is immersion in cold water up to the neck.
2. If no immersion: soak them in water and fan hard, put ice or cold packs in the armpits, groin and neck.
3. Keep cooling until they are alert or their temperature drops.
4. Don't give fluids if they are confused or can't swallow safely.

## Prevention
Work in the cool morning and evening, drink before you are thirsty, wear light loose clothing and a hat, check on elderly people, children and the sick.`,
  },
  {
    id: 'shock',
    cat: 'first-aid',
    title: 'Primary survey & shock',
    summary: 'The order of checks when someone is hurt.',
    minutes: 3,
    body: `Use **DRSABC** for any casualty.

1. **Danger.** Is it safe to approach? Traffic, fire, electricity, collapse, gas.
2. **Response.** Talk to them, tap their shoulders. Do they respond?
3. **Send for help.** Shout for others, call emergency services if possible.
4. **Airway.** Open it with a head tilt and chin lift. Clear anything visible.
5. **Breathing.** Look, listen, feel for 10 seconds. Not breathing normally? Start CPR.
6. **Circulation.** Look for and stop major bleeding.

## Recovery position
Breathing but unresponsive: roll them onto their side with the top leg bent and head tilted back so vomit can drain. Keep checking their breathing.

## Shock
Shock means the body isn't getting enough blood flow, usually from blood loss, burns, severe dehydration or allergic reaction.
- **Signs:** pale, cold, clammy skin; fast, weak pulse; fast breathing; anxiety; thirst; confusion.
- **Treat the cause** (stop bleeding).
- Lay them down. Raise the legs if there's no leg, hip or spine injury.
- Keep them warm with a blanket underneath and on top.
- Nothing to eat or drink. Wet their lips if they're thirsty.
- Reassure them and stay with them.

## Severe allergic reaction (anaphylaxis)
Swelling of face or throat, difficulty breathing, widespread rash. If they carry an adrenaline auto-injector, help them use it in the outer thigh. A second dose can be given after 5–15 minutes if there's no improvement.`,
  },
  {
    id: 'wounds',
    cat: 'first-aid',
    title: 'Cleaning wounds & spotting infection',
    summary: 'Small wounds become deadly without care.',
    minutes: 2,
    body: `## Clean
1. Wash your hands. Control bleeding first.
2. Irrigate the wound with plenty of **clean drinking-quality water**. Pressure helps: a squeezed water bottle or a bag with a pinhole works.
3. Remove visible dirt with clean tweezers.
4. Don't pour hydrogen peroxide or alcohol into wounds. They damage tissue.
5. Cover with a clean dressing. Change it daily or when wet or dirty.

## Closing wounds
In austere settings, it's usually safer to **leave wounds open** and let them heal from the inside, especially bites, dirty wounds, or anything older than 6–8 hours. Closing a dirty wound traps infection.

## Signs of infection
- Increasing pain, redness, swelling or warmth after day 2
- Pus or a bad smell
- Red streaks spreading from the wound
- Fever or chills

> ! Red streaks, fever, or a spreading hard red area are signs of a serious infection that needs antibiotics. Get medical help by any means possible.

## Tetanus
Deep, dirty puncture wounds carry tetanus risk. Keep vaccinations up to date while you still can.`,
  },

  // ───────────── WATER ─────────────
  {
    id: 'water-find',
    cat: 'water',
    title: 'How much water & where to find it',
    summary: 'Your first priority after shelter.',
    minutes: 3,
    body: `## Rule of threes
You can survive roughly **3 minutes** without air, **3 hours** without shelter in harsh conditions, **3 days** without water, **3 weeks** without food.

## How much
- Plan **4 litres (1 gallon) per person per day**: about 2–3 L for drinking, the rest for cooking and hygiene.
- More in heat, at altitude, when working hard, or for pregnant and nursing women and the sick.
- Store at least **2 weeks' supply** if you can.

## Hidden water at home
- The water heater tank (turn off power or gas first, open the drain valve at the bottom)
- Toilet **cistern** (the tank, not the bowl) if no chemical cleaners were used
- Pipes: open the highest tap in the house, then drain from the lowest
- Ice cubes, canned fruit and vegetable liquids

## Outdoors
- Rain: collect from clean roofs, tarps or plastic sheets into clean containers. Discard the first runoff.
- Streams and springs: flowing beats still. Collect upstream from people and animals.
- Dew: wipe grass with a cloth at dawn and wring it out.
- Follow animal trails and green vegetation downhill.

> ! **Treat all outdoor water** before drinking. Clear water can still carry parasites and bacteria. Never drink seawater or urine.`,
  },
  {
    id: 'water-purify',
    cat: 'water',
    title: 'Purifying water',
    summary: 'Boil, chlorinate, filter or use sunlight.',
    minutes: 4,
    urgent: true,
    body: `If water is cloudy, **let it settle and filter it through cloth first**. Every method works better on clear water.

## Boiling (most reliable)
- Bring to a **rolling boil for 1 minute**.
- Above 2,000 m (6,500 ft) altitude, boil for **3 minutes**.
- Kills bacteria, viruses and parasites. Doesn't remove chemicals.

## Household bleach
Use plain, **unscented** bleach (sodium hypochlorite, usually 5–9%). No "splash-less", scented or colour-safe types.
- For 6% bleach: **2 drops per litre** (8 drops per US gallon).
- Double it if the water is cloudy or very cold.
- Stir and **wait 30 minutes**. It should smell slightly of chlorine. If not, repeat the dose and wait 15 more minutes.

## Purification tablets
Follow the packet exactly. Chlorine dioxide tablets are effective against more parasites (like Cryptosporidium) than plain chlorine but need a longer wait (often 4 hours).

## Filters
- Hollow-fibre filters (0.1–0.2 micron) remove bacteria and protozoa but **not viruses**. Combine with chlorine where sewage contamination is likely.
- Improvised sand and charcoal filters improve clarity and taste but **don't make water safe**. Always boil or disinfect afterwards.

## SODIS (solar disinfection)
1. Fill clear PET plastic bottles (2 L or smaller) with clear water.
2. Lay them on a reflective surface (metal roof, foil) in **full sun for 6 hours**, or **2 days** if it's cloudy.
3. Doesn't work with cloudy water or glass bottles.`,
  },
  {
    id: 'water-store',
    cat: 'water',
    title: 'Storing water',
    summary: 'Keep a supply that stays safe.',
    minutes: 2,
    body: `## Containers
- Food-grade plastic water containers, or cleaned soda bottles (PET).
- **Avoid** milk jugs (they break down and are hard to clean), and anything that held chemicals.
- Opaque containers block light and slow algae growth.

## Preparing
1. Wash containers with soap and rinse.
2. Sanitise: 1 teaspoon of unscented bleach per litre of water, shake, wait 30 seconds, pour out.
3. Fill with tap water. If it isn't from a treated supply, add 2 drops of bleach per litre.
4. Label with the date. Seal tightly.

## Where
Cool, dark place, off concrete floors, away from fuel, paint and pesticides (fumes pass through plastic).

## Rotate
Replace stored water **every 6 months**, or use commercially bottled water before its date.

## Rain harvesting
A 1 mm rainfall on 1 m² of roof gives 1 litre of water. A 50 m² roof in a 20 mm rainfall gives about 1,000 litres. Fit a first-flush diverter and screen and **treat the water before drinking**.`,
  },

  // ───────────── FOOD ─────────────
  {
    id: 'food-store',
    cat: 'food',
    title: 'Emergency food storage & rationing',
    summary: 'Build a pantry that lasts.',
    minutes: 3,
    body: `## What to store
Choose food that needs little water or cooking, and food you actually eat.
- **Staples:** rice, dried beans and lentils, oats, pasta, flour, sugar, salt, cooking oil
- **Ready to eat:** canned meat, fish, beans, vegetables, fruit; peanut butter; crackers; nuts; dried fruit
- **Extras:** powdered milk, honey (lasts indefinitely), multivitamins, coffee and tea for morale

## Calories
An adult needs roughly **2,000–2,500 kcal per day**, more for hard physical work or cold. Start with 2 weeks, build to 3 months.

## Storage rules
- Cool, dry, dark. Heat is the main enemy of shelf life.
- Rotate: **first in, first out**. Eat and replace.
- Protect from pests in sealed buckets or metal bins.
- Store a manual can opener.

## Bad cans
> ! Throw away cans that are **bulging, leaking, deeply dented on the seam, or spurt** when opened. They can carry botulism.

## Rationing
- Don't ration water. Drink what you need and ration food instead.
- Eat perishable food first (fridge, then freezer, then pantry). A closed freezer stays frozen about 24–48 hours.
- Healthy adults can manage on half rations for a while. Children, pregnant women and the sick cannot.`,
  },
  {
    id: 'forage',
    cat: 'food',
    title: 'Foraging safely',
    summary: 'Only eat what you can positively identify.',
    minutes: 3,
    body: `> ! **If in doubt, don't eat it.** Poisoning is far more dangerous than a few days of hunger. Most poisonous plants and mushrooms have edible look-alikes.

## Golden rules
1. Learn **5–10 common local plants** thoroughly before you need them, ideally from a local expert or regional field guide.
2. Identify with certainty using multiple features: leaves, stem, flowers, smell, habitat, season.
3. Avoid **wild mushrooms** entirely unless you are an expert. Several deadly species look ordinary.
4. Avoid plants with milky sap, almond smell, umbrella-shaped flower clusters (carrot family has deadly members), or three-leaved growth.
5. Don't forage beside roads, industrial land or sprayed fields.

## Generally reliable and widespread
- **Dandelion:** whole plant edible. Young leaves are less bitter.
- **Stinging nettle:** cook it to remove the sting. Rich in nutrients.
- **Blackberries and raspberries:** easy to recognise.
- **Clover:** flowers and leaves, best cooked.
- **Acorns:** must be leached in repeated changes of water to remove bitter tannins.

## Protein
Insects (cooked) are a real option: crickets, grasshoppers (remove legs and wings), grubs. Avoid brightly coloured or hairy insects. Fish and small game need skills and local legal knowledge.`,
  },
  {
    id: 'cook',
    cat: 'food',
    title: 'Cooking without power',
    summary: 'Stoves, fires and fuel-saving methods.',
    minutes: 3,
    body: `> ! **Never** use charcoal grills, camping stoves, or generators indoors or in a garage. Carbon monoxide is invisible, odourless and kills in minutes.

## Options
- **Camping gas stove:** easiest. Store fuel cans safely and use outdoors or in a very well ventilated space.
- **Rocket stove:** burns small sticks very efficiently. Can be built from bricks or cans.
- **Open fire:** cook over glowing coals, not flames.
- **Solar oven:** a box lined with foil and a glass lid can reach 90–150°C on a sunny day. Slow but free.

## Save fuel
- **Hay-box (retained heat) cooking:** bring a pot to the boil for a few minutes, then put it, lid on, in an insulated box (blankets, sleeping bag, straw). It finishes cooking in 2–4 hours on residual heat.
- Soak beans and grains overnight.
- Lids on pots, always.
- Cut food small.

## Food safety
- Wash hands with soap or use sanitiser before handling food.
- Cook meat thoroughly.
- Without a fridge, cook only what you eat in one meal.`,
  },

  // ───────────── SHELTER & FIRE ─────────────
  {
    id: 'warm',
    cat: 'shelter',
    title: 'Staying warm: shelter priorities',
    summary: 'Wind, wet and ground steal your heat.',
    minutes: 3,
    body: `## At home without heating
1. **Pick one room** to heat and live in, ideally small, interior and south-facing.
2. Close off other rooms. Hang blankets over doors and windows. Block draughts at the bottom of doors.
3. Everyone sleeps together in that room. Body heat adds up.
4. Layer clothing: base layer (wool or synthetic, not cotton), insulating layer, windproof outer layer. Hat and socks to bed.
5. Eat before sleeping. Digestion makes heat.
6. Hot water bottles.

## Outdoors: the four heat thieves
- **Conduction (ground):** insulate beneath you with 10+ cm of dry leaves, branches, pine needles or a foam pad.
- **Convection (wind):** get out of it. Use terrain, trees, a tarp.
- **Evaporation (wet):** stay dry. Wet clothing loses most insulation. Avoid sweating.
- **Radiation:** cover your head; use a foil blanket's shiny side towards you.

## Simple shelters
- **Tarp lean-to:** angled to the wind, with a fire reflector in front.
- **Debris hut:** a ridge pole on a stump, sticks along both sides, then a thick (60 cm+) pile of leaves on top. Make it small, barely bigger than your body.
- **Car:** good shelter, but run the engine only 10 minutes per hour with a window cracked and the exhaust clear of snow.`,
  },
  {
    id: 'fire',
    cat: 'shelter',
    title: 'Making fire',
    summary: 'Tinder, kindling, fuel. And safety.',
    minutes: 3,
    body: `## You need three sizes
1. **Tinder:** catches a spark. Dry grass, birch bark, cotton balls with petroleum jelly, dryer lint, fatwood shavings.
2. **Kindling:** pencil-lead to thumb thickness dry sticks. Gather twice what you think.
3. **Fuel:** wrist-thick and up. Dead, standing wood is drier than wood on the ground.

## Building it
- Clear the ground down to bare soil, away from overhanging branches, roots and tents.
- Make a tinder bundle, light it, add kindling in a teepee over it, then add fuel gradually. Don't smother it.
- Shield from wind. Blow gently at the base.

## Ignition
- Lighters and stormproof matches first. Keep them in a waterproof bag.
- **Ferro rod:** scrape the striker hard down the rod into the tinder. Works wet.
- Magnifying lens or the bottom of a clear bottle of water on a sunny day.
- 9V battery across fine steel wool.

## Safety
- Never leave a fire unattended. Keep water or dirt nearby.
- Put it out completely: drown, stir, drown again until cold to the touch.
- **Indoors:** only in a proper fireplace or wood stove with a clear chimney. Fit a battery carbon-monoxide alarm.`,
  },

  // ───────────── POWER ─────────────
  {
    id: 'phone-power',
    cat: 'power',
    title: 'Keeping your phone alive',
    summary: 'Your phone is your library. Make it last.',
    minutes: 2,
    urgent: true,
    body: `With AFTERNET installed, your phone holds an encyclopedia, a survival library, maps and an AI. Battery is everything.

## Stretch the charge
- **Airplane mode** when you don't need a signal. Searching for a dead network drains the battery fast.
- Low Power / Battery Saver mode on.
- Lowest usable screen brightness, dark mode, short screen timeout.
- Close apps you don't need. Turn off Bluetooth, Wi-Fi, location when not navigating.
- Keep it warm in cold weather (inside pocket). Cold batteries die fast.

## Charging without the grid
- **Power bank:** a 20,000 mAh bank charges most phones 3–4 times.
- **Solar:** a 20–30 W folding panel charges a phone in a few hours of direct sun. Charge the power bank by day, the phone by night.
- **Car:** USB adapter while the engine runs.
- **Hand crank:** many emergency radios have one. Slow, but it works.

## Before the outage
1. Install AFTERNET to your home screen.
2. Download Wikipedia articles, your region's maps and the AI model.
3. Turn on airplane mode and **test that everything works offline**.`,
  },
  {
    id: 'solar',
    cat: 'power',
    title: 'Solar power basics',
    summary: 'Size a small solar setup with simple maths.',
    minutes: 4,
    body: `## The only formula you need
**Energy (Wh) = Power (W) × Time (h)**

## Typical device needs
- Phone full charge: about **12–20 Wh**
- Tablet: 30–40 Wh
- Laptop: 50–100 Wh
- LED bulb (5 W) for 5 hours: 25 Wh
- Small fridge: 300–1,000 Wh per day

## Panel output
Daily energy ≈ panel watts × **peak sun hours** × 0.7 (losses)
- Peak sun hours: roughly 2 in a northern winter, 5–7 in summer or southern Europe.
- Example: 100 W panel × 5 h × 0.7 = **350 Wh/day**. That's 20 phone charges.

## Batteries
- Capacity in Wh = Ah × Volts. A 12 V 100 Ah battery = 1,200 Wh.
- **LiFePO4** batteries last thousands of cycles and are safe. Lead-acid batteries should not be drained below 50%.
- Power banks are rated in mAh at 3.7 V: 20,000 mAh ≈ 74 Wh, of which roughly 60 Wh is usable.

## Basic system
Panel → charge controller (MPPT is best) → battery → inverter (for 230/120 V AC) or USB/12 V outputs.
- Fuse every battery connection.
- Aim panels at the sun (south in the northern hemisphere), tilted at about your latitude.
- Keep panels clean and unshaded. Even partial shade cuts output badly.`,
  },
  {
    id: 'generator',
    cat: 'power',
    title: 'Generators, car batteries & safety',
    summary: 'Use backup power without killing anyone.',
    minutes: 3,
    body: `> ! **Carbon monoxide kills.** Run generators **outdoors only**, at least **6 m (20 ft)** from doors, windows and vents. Never in a garage, even with the door open. Fit battery CO alarms.

## Generators
- Let it cool before refuelling. Store fuel in approved cans away from the house.
- Never plug a generator into a wall socket ("backfeeding"). It can electrocute line workers and neighbours. Use extension leads to appliances, or a professionally installed transfer switch.
- Keep it dry. Use a canopy, not an enclosure.

## Car as a power source
- A car battery holds about **500–700 Wh**, but draining it below 50% may leave you unable to start the car.
- A 150 W plug-in inverter in the 12 V socket can charge laptops and phones while the engine runs.
- Run the engine outdoors only.

## Battery safety
- Lead-acid batteries emit hydrogen when charging. Ventilate and keep away from sparks.
- Never short the terminals. Remove rings and watches when working on batteries.
- Connect positive (red) first, disconnect negative (black) first.
- Damaged or swollen lithium batteries can catch fire. Keep them outside on a non-flammable surface.`,
  },

  // ───────────── NAV & COMMS ─────────────
  {
    id: 'nav',
    cat: 'nav',
    title: 'Navigation without GPS',
    summary: 'Sun, stars, watch and compass.',
    minutes: 4,
    body: `## The sun
Rises roughly **east**, sets roughly **west**. At midday it's due **south** in the northern hemisphere, and due **north** in the southern hemisphere.

## Shadow stick
1. Push a stick upright into flat ground. Mark the tip of its shadow.
2. Wait 15–20 minutes. Mark the new tip.
3. A line from the first mark to the second runs roughly **west to east**.

## Watch method (analog)
- **Northern hemisphere:** point the hour hand at the sun. South is halfway between the hour hand and 12 (use 1 o'clock during summer time).
- **Southern hemisphere:** point 12 at the sun. North is halfway between 12 and the hour hand.

## Stars
- **North Star (Polaris):** find the Big Dipper. Follow the two stars at the end of its "cup" about five times their distance. Polaris is almost exactly north.
- **Southern Cross:** extend its long axis about 4.5 times its length. That point is roughly south. Drop straight down to the horizon.

## Compass
- The red needle points to **magnetic north**. Keep it away from metal, phones and cars.
- To walk a bearing: point the direction-of-travel arrow at your target, turn the dial until the north arrow sits under the red needle. Then keep the needle "in the shed" as you walk.
- Pick a landmark on your bearing, walk to it, repeat.

## Your phone without a network
GPS works with **no signal and no internet**. It receives satellites directly. AFTERNET Maps uses this. Download your area while online.`,
  },
  {
    id: 'radio',
    cat: 'nav',
    title: 'Radio communications',
    summary: 'Get news and reach people when networks fail.',
    minutes: 4,
    body: `## Listen first
A battery, solar or hand-crank **AM/FM radio** is the best way to get official emergency information. AM travels much further at night. In North America, NOAA Weather Radio broadcasts alerts.

## Licence-free two-way radios
- **Europe: PMR446.** 16 channels, 0.5 W, about 1–3 km in towns, more on hilltops.
- **US: FRS.** 22 channels, about 1–3 km.
- Agree on a **primary channel and a backup** with your family in advance.

## Further range
- **CB radio** (27 MHz): licence-free in most countries, used by truckers, 5–30 km.
- **Amateur (ham) radio:** needs a licence (exam), but reaches across the region or the world. In an emergency, anyone may transmit to save life. Common calling frequencies: 2 m band 145.500 MHz (Europe), 146.520 MHz (US).

## Make a comms plan
- Set **check-in times**, e.g. the first 5 minutes of every hour. This saves battery.
- Choose an **out-of-area contact** everyone reports to.
- Write frequencies and channels on paper.

## Radio etiquette
Listen before talking. Keep it brief. Say who you're calling, then who you are: "Base, this is Alex." End with "over". Say "**Mayday**" three times only for life-threatening emergencies.

## Morse code SOS
**··· ––– ···** by flashlight, whistle, or tapping. Works where voice doesn't.`,
  },
  {
    id: 'signal',
    cat: 'nav',
    title: 'Signalling for rescue',
    summary: 'Be seen and heard from far away.',
    minutes: 2,
    body: `## Rule of three
**Three of anything** is a recognised distress signal: three whistle blasts, three fires in a triangle, three gunshots, three flashes.

## Visual signals
- **Signal mirror:** catch the sun, hold out two fingers in a V around your target, flash the light across it. Visible for tens of kilometres.
- **Ground signals:** make large letters (3 m+) with rocks, branches or trenches contrasting with the ground. **SOS** or **V** (need assistance), **X** (need medical help).
- **Smoke:** green leaves on a fire make white smoke (good against dark forest); rubber or oil makes black smoke (good against snow).
- Bright clothing or a space blanket spread out in the open.
- At night: flashlight, phone screen, fire.

## Sound
A whistle carries much further than a voice and uses less energy. Three blasts, pause, repeat.

## Being found
- If you're lost, **stay put** unless you're in danger. Searchers find stationary people faster.
- Tell someone your route and return time before you go anywhere.`,
  },

  // ───────────── REBUILD: GROW ─────────────
  {
    id: 'garden',
    cat: 'grow',
    title: 'Starting a survival garden',
    summary: 'The highest-calorie crops for your effort.',
    minutes: 4,
    body: `## Site
- At least **6–8 hours of direct sun**. Near water. Protected from animals.
- Start small: a well-tended 10 m² beats a neglected 100 m².

## Calorie crops (what actually feeds you)
- **Potatoes:** the most calories per square metre in cool climates. Plant seed potatoes in spring, harvest in about 90–120 days.
- **Sweet potatoes:** the same role in warm climates.
- **Winter squash and pumpkins:** store for months without processing.
- **Dry beans:** protein. Grow, dry on the plant, store for years.
- **Maize (corn):** grain for flour. Needs space and good soil.

## Fast and nutritious
- **Leafy greens:** lettuce, kale, chard, spinach. Harvest in 4–8 weeks.
- **Radishes:** 3–4 weeks.
- **Onions, garlic:** store well.
- **Tomatoes, peppers, courgettes:** big yields in summer.

## Soil
- Add compost every season. Healthy soil grows healthy plants.
- **Mulch** (straw, leaves, wood chips) keeps moisture in and weeds down.
- Rotate crop families yearly to avoid disease.

## Water
Water deeply and less often, early in the morning, at the base of plants. Collect rainwater.

## Seeds
Grow **open-pollinated or heirloom** varieties. You can save their seeds and they'll grow true next year. Hybrid (F1) seeds don't.`,
  },
  {
    id: 'seeds',
    cat: 'grow',
    title: 'Saving seeds & composting',
    summary: 'Close the loop so you never run out.',
    minutes: 3,
    body: `## Easy seeds to save
- **Beans and peas:** let pods dry completely on the plant, shell, dry further.
- **Tomatoes:** scoop seeds into a jar with a little water, leave 2–3 days to ferment, rinse, dry on a plate.
- **Lettuce:** let it bolt (flower), collect the fluffy seed heads.
- **Squash:** take seeds from a fully ripe fruit, wash and dry. Note: different squash cross easily.

## Storing seeds
Completely dry, in paper envelopes inside a sealed jar, cool and dark. Label with crop and year. Most last 3–5 years.

## Composting
1. Mix **browns** (dry leaves, straw, cardboard) and **greens** (vegetable scraps, grass, manure) roughly 2:1 by volume.
2. Keep it as damp as a wrung-out sponge.
3. Turn every week or two for air.
4. Ready in 2–6 months when dark, crumbly and earthy smelling.

> Don't compost meat, dairy, fats or pet and human waste in a normal heap. They attract pests and spread disease.`,
  },

  // ───────────── REBUILD: PRESERVE ─────────────
  {
    id: 'preserve',
    cat: 'preserve',
    title: 'Preserving food without a fridge',
    summary: 'Dry, salt, ferment and can, safely.',
    minutes: 4,
    body: `## Drying
- Slice fruit, vegetables or lean meat thin and even.
- Dry in a warm, airy, shaded place, a solar dryer, or a low oven. Meat for jerky should be heated to 71°C first or dried in a hot oven to be safe.
- Done when leathery (fruit) or brittle (vegetables). Store airtight.

## Salting & curing
Salt draws out water so bacteria can't grow. Pack fish or meat in layers of coarse salt, or use a strong brine. Soak in fresh water before cooking.

## Fermentation
**Sauerkraut:** shred cabbage, mix with **2% salt by weight** (20 g per kg), pack tightly into a jar until liquid covers it. Keep submerged, at room temperature, 1–4 weeks. Also works for most vegetables.

## Canning
> ! **Botulism** can grow in sealed jars of low-acid food and is often fatal. You can't see, smell or taste it.

- **High-acid foods** (fruit, jams, pickles, tomatoes with added lemon juice) can be processed in a **boiling water bath**.
- **Low-acid foods** (vegetables, beans, meat, fish) **must be pressure canned** at the correct pressure and time for your altitude.
- Use proper canning jars and new lids. Follow tested recipes exactly.

## Root cellar
Potatoes, carrots, beets, apples and cabbage keep for months in a dark, humid place at around 0–5°C. An unheated basement, a buried container, or a straw-insulated pit can work.`,
  },

  // ───────────── REBUILD: HEALTH ─────────────
  {
    id: 'sanitation',
    cat: 'health',
    title: 'Sanitation & hygiene',
    summary: 'Prevent the diseases that follow disasters.',
    minutes: 3,
    body: `After disasters, **diarrhoeal disease** from contaminated water and poor sanitation kills more people than the event itself.

## Handwashing
Soap and water for 20 seconds after the toilet, before food, after caring for the sick. A **tippy-tap** (a hanging jug tipped by a foot pedal) saves water and keeps hands clean.

## Toilets when water stops
- **Two-bucket system:** one for urine (can be diluted and used on non-food plants), one for solids. Cover solids each time with sawdust, ash, soil or cat litter. Line with bags.
- **Pit latrine:** at least **60 m (200 ft) from any water source** and downhill from it, 30 m from living areas. Cover with soil after each use.
- Add a lid to keep flies off.

## Waste
Bury or burn rubbish away from water and living areas. Keep food waste away from shelter to avoid rats.

## Oral rehydration solution (ORS)
For diarrhoea, especially in children. Mix in **1 litre of clean water: 6 level teaspoons of sugar + ½ level teaspoon of salt.** Sip often. Seek help if there's blood in the stool, high fever, or signs of severe dehydration (no urine, sunken eyes, lethargy).`,
  },
  {
    id: 'medicine-kit',
    cat: 'health',
    title: 'Building a home medical kit',
    summary: 'What to stock before you need it.',
    minutes: 2,
    body: `## Wound care
Gloves, gauze, adhesive bandages, non-stick dressings, crepe bandages, triangular bandages, medical tape, saline or clean water, tweezers, scissors, a commercial **tourniquet**, and haemostatic gauze if you're trained.

## Medicines (check with a pharmacist)
- Pain and fever: paracetamol/acetaminophen, ibuprofen
- Allergy: antihistamine tablets
- Stomach: oral rehydration salts, anti-diarrhoeal
- Antiseptic: povidone-iodine or chlorhexidine
- Burns: burn gel dressings
- Your household's **prescription medicines**: try to keep a reserve of 1–3 months

## Tools
Thermometer, pulse oximeter, foil blankets, splint (SAM-type), headlamp, notebook and pen, a printed first aid manual.

## Maintenance
Check expiry dates every 6 months. Store cool and dry. Know how to use everything in it. **Take a first aid course** while the world still runs.`,
  },

  // ───────────── REBUILD: TOOLS ─────────────
  {
    id: 'tools',
    cat: 'build',
    title: 'The essential tool kit',
    summary: 'Hand tools that work without electricity.',
    minutes: 3,
    body: `## Core kit
- **Cutting:** fixed-blade knife, folding saw, axe or hatchet, a quality multitool
- **Digging:** round-point shovel, mattock or pick, garden fork
- **Building:** claw hammer, hand saw, screwdrivers, pliers, adjustable wrench, tape measure, hand drill or brace and bits
- **Sharpening:** whetstone and file. A sharp tool is a safe tool.
- **Fixing:** duct tape, paracord, zip ties, wire, nails and screws, epoxy, sewing kit, tarp

## Care
- Clean and lightly oil metal after use to stop rust.
- Store dry, handles up.
- Replace cracked wooden handles before they fail mid-swing.

## Knots worth knowing
- **Bowline:** a fixed loop that won't slip or jam. For rescue and tying to things.
- **Clove hitch:** quickly ties a line to a post.
- **Taut-line hitch:** adjustable tension for tent and tarp lines.
- **Square (reef) knot:** joins two ends of the same rope. Not for critical loads.
- **Trucker's hitch:** cinches loads down tight.

## Skills over stuff
Practise with tools now. A saw you've never sharpened and an axe you've never swung are dangerous when you're tired and cold.`,
  },

  // ───────────── REBUILD: COMMUNITY ─────────────
  {
    id: 'plan',
    cat: 'community',
    title: 'Your family emergency plan',
    summary: 'Decide now, so nobody has to decide in panic.',
    minutes: 3,
    urgent: true,
    body: `## Write down
1. **Meeting points:** one near home, one outside your neighbourhood, one out of town.
2. **Contacts:** phone numbers on paper. Your phone may be dead.
3. **Out-of-area contact:** one person everyone reports to.
4. **Medical info:** each person's conditions, medicines, allergies, blood type.
5. **Utilities:** how and where to shut off water, gas and electricity.
6. **Evacuation routes:** two from home, two from your town.
7. **Pets:** carriers, food, where they can go.

## Grab bag (per person)
Water (3 L), 3 days of food, torch, power bank and cable, radio, first aid kit, copies of documents, cash in small notes, warm layer, rain cover, medicines, whistle, multitool, and **a phone with AFTERNET installed and loaded**.

## Practise
Run through it twice a year. Change stored water and check batteries at the same time.`,
  },
  {
    id: 'community',
    cat: 'community',
    title: 'Organising your community',
    summary: 'Skills, roles and trust in the long run.',
    minutes: 3,
    body: `Long-term recovery is a team effort. Isolated households struggle; organised neighbourhoods recover.

## Skills inventory
Make a list of who can do what: medicine and nursing, building and carpentry, electrical, mechanics, farming and gardening, cooking at scale, teaching, radio, security, childcare, counselling.

## Shared resources
Map water sources, generators, solar setups, vehicles, tools, food stocks, and safe buildings. Share tools rather than everyone buying the same ones.

## Roles
- **Coordinator**, plus a deputy.
- **Water and sanitation** team.
- **Medical** point of contact.
- **Comms:** radio operator and a notice board for news.
- **Food:** gardens, storage, shared kitchen.

## Make decisions fairly
Hold regular meetings. Write decisions down. Rotate tough duties. Prioritise the vulnerable: elderly, disabled, children, the sick.

## Knowledge is a resource
One AFTERNET device can serve a whole street. Set up a charging station on solar and let people look things up.`,
  },
];

export function guideById(id: string) {
  return GUIDES.find((g) => g.id === id);
}

export function categoryById(id: string) {
  return CATEGORIES.find((c) => c.id === id);
}

/** Splits guides into searchable sections (used by search and the local AI for grounding). */
export type Section = { guide: Guide; heading: string; text: string };
let _sections: Section[] | null = null;
export function sections(): Section[] {
  if (_sections) return _sections;
  const out: Section[] = [];
  for (const g of GUIDES) {
    const parts = g.body.split(/\n(?=## )/);
    for (const p of parts) {
      const m = p.match(/^## (.+)\n?/);
      out.push({ guide: g, heading: m ? m[1] : g.title, text: m ? p.slice(m[0].length) : p });
    }
  }
  return (_sections = out);
}

const STOP = new Set('a an the of to in on for and or is are be it i my me we how what do does can should with without when if at by from as this that your you'.split(' '));
export function tokens(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .map((w) => w.replace(/(ing|ed|es|s)$/, ''));
}

/** Simple keyword search across the library. */
export function searchLibrary(q: string, limit = 6) {
  const qt = tokens(q);
  if (!qt.length) return [];
  return sections()
    .map((s) => {
      const title = tokens(s.guide.title + ' ' + s.heading);
      const body = tokens(s.text);
      let score = 0;
      const guideTitle = tokens(s.guide.title);
      for (const t of qt) {
        const hit = (w: string) => w.length > 3 && t.length > 3 && (w.startsWith(t) || t.startsWith(w));
        score += guideTitle.filter((w) => w === t || hit(w)).length * 6;
        score += title.filter((w) => w === t || hit(w)).length * 3;
        score += Math.min(2, body.filter((w) => w === t).length);
      }
      return { s, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.s);
}

/** Each guide's matching article in the bundled Wikipedia pack (used for cover images and "read more"). */
export const GUIDE_WIKI: Record<string, string> = {
  cpr: 'cardiopulmonary-resuscitation', bleeding: 'tourniquet', burns: 'burn', fractures: 'splint-medicine', cold: 'hypothermia',
  heat: 'heat-stroke', shock: 'shock-circulatory', wounds: 'wound', 'water-find': 'rainwater-harvesting', 'water-purify': 'portable-water-purification',
  'water-store': 'water-storage', 'food-store': 'food-storage', forage: 'foraging', cook: 'rocket-stove', warm: 'lean-to', fire: 'fire-making',
  'phone-power': 'battery-pack', solar: 'solar-panel', generator: 'electric-generator', nav: 'compass', radio: 'amateur-radio', signal: 'distress-signal',
  garden: 'kitchen-garden', seeds: 'seed-saving', preserve: 'canning', sanitation: 'pit-latrine', 'medicine-kit': 'first-aid-kit', tools: 'hand-tool',
  plan: 'survival-kit', community: 'mutual-aid',
};
