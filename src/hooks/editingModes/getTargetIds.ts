import type { EditingModeContext } from '../../types/editing';
import { getParticleId } from './getParticleId';

export function getTargetIds(ctx: EditingModeContext): string[] {
  if (ctx.temporarySelectionIds?.length) return ctx.temporarySelectionIds;
  const obj = ctx.lastIntersected.current;
  if (!obj) return [];
  const el = obj.userData;
  if (!ctx.individualMode && el?.groupId && ctx.getGroupMembers) {
    return ctx.getGroupMembers(el.groupId).map((m) => m.id);
  }
  const particleId = getParticleId(obj);
  return particleId ? [particleId] : [];
}
