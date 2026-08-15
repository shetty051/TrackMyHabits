import { RooneyExpression } from './RooneyExpressions';

export interface DialogueLine {
  text: string;
  expression: RooneyExpression;
}

export type ScenarioKey =
  | 'intro'
  | 'idle'
  | 'sleeping'
  | 'scared'
  | 'tutorialSkip'
  | 'celebration'
  | 'streakSave'
  | 'roast'
  | 'encouragement';

// Fixed App-Launch Intro Sequence Steps required by specification
export const ROONEY_INTRO_SEQUENCE: DialogueLine[] = [
  {
    text: "Hey! I'm Rooney, your personal AI assistant.",
    expression: RooneyExpression.NEUTRAL,
  },
  {
    text: "Rooney is derived from Maroon.",
    expression: RooneyExpression.THINKING,
  },
  {
    text: "Yeah, they just removed 'ma' from maroon and added 'ey' in the end to get my name.",
    expression: RooneyExpression.SAD,
  },
  {
    text: "As you can see, the creator is not very creative.",
    expression: RooneyExpression.ROASTING,
  },
  {
    text: "But hey! nevermind that, let me show you around the app",
    expression: RooneyExpression.CELEBRATORY,
  },
];

// Dialogue Dictionary with text variations per scenario
export const ROONEY_SCENARIOS: Record<ScenarioKey, DialogueLine[]> = {
  intro: ROONEY_INTRO_SEQUENCE,

  idle: [
    { text: "Just floating here, watching your habit game unfold!", expression: RooneyExpression.NEUTRAL },
    { text: "Need a quick motivational boost? I've got plenty in store!", expression: RooneyExpression.ENCOURAGING },
    { text: "Did you drink your water today? Just checking for a friend...", expression: RooneyExpression.POINTING },
    { text: "Consistency is key! Even 1% progress counts every single day.", expression: RooneyExpression.WINK },
    { text: "Hey! Remember, future you is going to thank current you.", expression: RooneyExpression.CELEBRATORY },
  ],

  sleeping: [
    { text: "Zzz... Oh! Sorry, I was catching some virtual zzz's.", expression: RooneyExpression.SLEEPING },
    { text: "Wake me up when you finish all your daily habit check-ins!", expression: RooneyExpression.SLEEPING },
    { text: "Snoring in binary... 01010011... 😴", expression: RooneyExpression.SLEEPING },
    { text: "Powering down for a micro-nap... Wake me with a habit check!", expression: RooneyExpression.SLEEPING },
    { text: "Rest is essential for high performers. Take a breather too!", expression: RooneyExpression.SLEEPING },
  ],

  scared: [
    { text: "Whoa! Don't let your streak slip away into the void!", expression: RooneyExpression.CONCERNED },
    { text: "Oh no! Is that a missed habit notification I see?!", expression: RooneyExpression.CONCERNED },
    { text: "Gasp! Quickly, use a streak freeze before it's too late!", expression: RooneyExpression.CONFUSED },
    { text: "Aah! Don't look at me like that, go check off your list!", expression: RooneyExpression.ANGRY },
    { text: "Yikes! We were doing so well! Let me check the stats...", expression: RooneyExpression.SAD },
  ],

  tutorialSkip: [
    { text: "Skipping the manual? Living dangerously, I like it!", expression: RooneyExpression.WINK },
    { text: "No worries! You can always tap me if you get lost.", expression: RooneyExpression.ENCOURAGING },
    { text: "Straight into action mode! That's the spirit!", expression: RooneyExpression.CELEBRATORY },
    { text: "Who needs instructions anyway? You've got this!", expression: RooneyExpression.ROASTING },
    { text: "Alright trailblazer, show me what you've got!", expression: RooneyExpression.POINTING },
  ],

  celebration: [
    { text: "BOOM! Another habit crushed into dust! Legendary!", expression: RooneyExpression.CELEBRATORY },
    { text: "Look at you go! You're practically unstoppable now!", expression: RooneyExpression.ENCOURAGING },
    { text: "Streak extended! Give yourself a well-deserved pat on the back!", expression: RooneyExpression.WINK },
    { text: "High five! That's how champions build consistency!", expression: RooneyExpression.CELEBRATORY },
    { text: "Chef's kiss! Absolute perfection on today's goals!", expression: RooneyExpression.BLUSHING },
  ],

  streakSave: [
    { text: "Phew! Saved by the freeze! That was a close call!", expression: RooneyExpression.POINTING_2 },
    { text: "Streak freeze deployed! Your progress lives to fight another day!", expression: RooneyExpression.ENCOURAGING },
    { text: "Close one! Keep that momentum going tomorrow!", expression: RooneyExpression.CONFUSED },
    { text: "Ice ice baby! Your streak stays frozen in time!", expression: RooneyExpression.WINK },
    { text: "Emergency freeze activated! Now let me see you smash tomorrow's goals!", expression: RooneyExpression.POINTING },
  ],

  roast: [
    { text: "I've seen dial-up internet move faster than your habit progress today...", expression: RooneyExpression.ROASTING },
    { text: "Are you practicing habits or practicing excuses? Just asking!", expression: RooneyExpression.ROASTING },
    { text: "My creator took 'Ma' off Maroon... and you're taking 'action' off your habits!", expression: RooneyExpression.ROASTING },
    { text: "I'd roast you, but your streak is already cold...", expression: RooneyExpression.ROASTING },
    { text: "Hey! Less scrolling, more habit crushing!", expression: RooneyExpression.ROASTING },
  ],

  encouragement: [
    { text: "Small steps today lead to massive transformations tomorrow!", expression: RooneyExpression.ENCOURAGING },
    { text: "You don't have to be perfect, just be present!", expression: RooneyExpression.BLUSHING },
    { text: "I believe in you! Let me see you tackle just one habit right now.", expression: RooneyExpression.POINTING },
    { text: "Every checkmark is a vote for the person you want to become!", expression: RooneyExpression.THINKING },
    { text: "You're capable of far more than you give yourself credit for!", expression: RooneyExpression.ENCOURAGING },
  ],
};

const lastPickedIndices: Partial<Record<ScenarioKey, number>> = {};

export function getRandomDialogue(scenario: ScenarioKey = 'idle'): DialogueLine {
  let targetScenario = scenario;
  if (scenario === 'idle') {
    const idlePools: ScenarioKey[] = ['idle', 'roast', 'encouragement', 'sleeping'];
    targetScenario = idlePools[Math.floor(Math.random() * idlePools.length)];
  }

  const lines = ROONEY_SCENARIOS[targetScenario] || ROONEY_SCENARIOS.idle;
  if (!lines || lines.length === 0) {
    return { text: "Consistency is key! You're doing great today!", expression: RooneyExpression.NEUTRAL };
  }

  const lastIndex = lastPickedIndices[targetScenario];
  let newIndex: number;

  if (lines.length === 1) {
    newIndex = 0;
  } else {
    do {
      newIndex = Math.floor(Math.random() * lines.length);
    } while (newIndex === lastIndex);
  }

  lastPickedIndices[targetScenario] = newIndex;
  return lines[newIndex];
}
