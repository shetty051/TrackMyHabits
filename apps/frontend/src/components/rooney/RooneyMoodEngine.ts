import { RooneyExpression } from './RooneyExpressions';
import { DialogueLine } from './rooneyDialogueEngine';

export function getRealtimeRooneyMood(
  totalDueCount: number,
  completedCount: number,
  hasUnaddressedMissedHabit: boolean,
  simulatedHour?: number
): DialogueLine {
  // Priority 1: Unaddressed Streak Break (Disappointed / Sad Rooney on App Open)
  if (hasUnaddressedMissedHabit) {
    return {
      text: "Aww man, we missed a habit yesterday and ran out of freezes! 💔 Streak reset, but don't give up — let me help you build a new streak today!",
      expression: RooneyExpression.ROASTING,
    };
  }

  // Priority 2: No Habits Created Yet / Due Today
  if (totalDueCount === 0) {
    return {
      text: "Welcome! Create your first habit today to start building your streak! ⚡",
      expression: RooneyExpression.NEUTRAL,
    };
  }

  const incompleteCount = Math.max(0, totalDueCount - completedCount);

  // Priority 3: All Habits Completed Today!
  if (incompleteCount === 0) {
    return {
      text: "Awesome work! All scheduled habits for today are completed! Enjoy the rest of your day! 🎉",
      expression: RooneyExpression.CELEBRATORY,
    };
  }

  // Priority 4: Compute Real Remaining Time in Current Day (until 11:59:59 PM local time)
  const now = new Date();
  const currentHour = simulatedHour !== undefined ? simulatedHour : now.getHours();

  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let diffMs = Math.max(0, endOfDay.getTime() - now.getTime());

  if (simulatedHour !== undefined) {
    const simTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), simulatedHour, 0, 0);
    diffMs = Math.max(0, endOfDay.getTime() - simTime.getTime());
  }

  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const timeString = `${hoursLeft}h ${minutesLeft}m`;

  // Morning (12 AM - 12 PM)
  if (currentHour < 12) {
    return {
      text: `Good day! You have ${incompleteCount} habit${
        incompleteCount === 1 ? '' : 's'
      } to tackle today with ${timeString} remaining. Let's make today count! ☀️`,
      expression: RooneyExpression.ENCOURAGING,
    };
  }

  // Afternoon (12 PM - 6 PM)
  if (currentHour < 18) {
    return {
      text: `Afternoon check-in! ${incompleteCount} habit${
        incompleteCount === 1 ? '' : 's'
      } pending for today with ${timeString} left in the day. Stay consistent! 💪`,
      expression: RooneyExpression.THINKING,
    };
  }

  // Evening (6 PM - 9 PM) - Mildly Concerned
  if (currentHour < 21) {
    return {
      text: `Evening update! Only ${timeString} remaining today and ${incompleteCount} habit${
        incompleteCount === 1 ? '' : 's'
      } still left. Finish them up soon! 🌆`,
      expression: RooneyExpression.POINTING_2,
    };
  }

  // Late Night (9 PM - 12 AM) - High Urgency!
  return {
    text: `⚠️ URGENT ALERT! Only ${timeString} left before midnight! Complete your ${incompleteCount} habit${
      incompleteCount === 1 ? '' : 's'
    } now to protect your streak! ⏳`,
    expression: RooneyExpression.URGENT,
  };
}
