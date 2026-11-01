import { scheduleSpecs, type RecipeCtx, type RecipeSpec } from './recipes';
import type { GainLike } from './engine';

/** What the deck needs to speak: a context and the bus it voices into. */
export interface DeckArm {
  ctx: RecipeCtx;
  bus: GainLike;
  /** Only some recipes need noise; the tick and click are tones. */
  noiseBuffer?: unknown;
}

/**
 * The deck's touch sounds. Only a running clock speaks — hover is not a
 * user gesture, so before the page's first real activation the context
 * sits suspended and the tick simply never schedules. Arm through the
 * caller (sound enabled), silence through the state check.
 */
export function playDeck(arm: DeckArm | null, recipe: () => RecipeSpec[]): void {
  if (!arm || arm.ctx.state !== 'running') return;
  scheduleSpecs(arm.ctx, arm.bus, recipe(), { noiseBuffer: arm.noiseBuffer });
}
