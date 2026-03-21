import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimBadge,
  completeMission,
  createMission,
  getCurrentBlockHeight,
  getMissionConsole,
  getRecentActivity,
  getWalletPortfolio,
  hashTextToHex,
  publishProfile,
  submitCheckIn
} from "../services/contract";

export function useMissionConsole(principal: string | null) {
  return useQuery({
    queryKey: ["mission-console", principal],
    queryFn: () => getMissionConsole(principal!),
    enabled: Boolean(principal)
  });
}

export function useRecentActivity(principal: string | null) {
  return useQuery({
    queryKey: ["activity", principal],
    queryFn: () => getRecentActivity(principal!),
    enabled: Boolean(principal)
  });
}

export function useWalletPortfolio(principal: string | null) {
  return useQuery({
    queryKey: ["portfolio", principal],
    queryFn: () => getWalletPortfolio(principal!),
    enabled: Boolean(principal)
  });
}

function useMissionInvalidation(principal: string | null) {
  const queryClient = useQueryClient();

  return async function invalidate() {
    if (!principal) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["mission-console", principal] }),
      queryClient.invalidateQueries({ queryKey: ["activity", principal] }),
      queryClient.invalidateQueries({ queryKey: ["portfolio", principal] })
    ]);
  };
}

export function useCreateMission(principal: string | null) {
  const invalidate = useMissionInvalidation(principal);

  return useMutation({
    mutationFn: async ({ missionLabel, objective, durationDays }: { missionLabel: string; objective: string; durationDays: number }) => {
      const [commitmentHashHex, currentBlockHeight] = await Promise.all([
        hashTextToHex(objective),
        getCurrentBlockHeight()
      ]);

      const dueAtHeight = currentBlockHeight + durationDays * 144;
      return createMission(missionLabel, commitmentHashHex, dueAtHeight);
    },
    onSuccess: invalidate
  });
}

export function useCheckIn(principal: string | null) {
  const invalidate = useMissionInvalidation(principal);

  return useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const proofHashHex = await hashTextToHex(note);
      return submitCheckIn(proofHashHex);
    },
    onSuccess: invalidate
  });
}

export function useCompleteMission(principal: string | null) {
  const invalidate = useMissionInvalidation(principal);

  return useMutation({
    mutationFn: () => completeMission(),
    onSuccess: invalidate
  });
}

export function usePublishProfile(principal: string | null) {
  const invalidate = useMissionInvalidation(principal);

  return useMutation({
    mutationFn: ({ displayName, tagline }: { displayName: string; tagline: string }) =>
      publishProfile(displayName, tagline),
    onSuccess: invalidate
  });
}

export function useClaimBadge(principal: string | null) {
  const invalidate = useMissionInvalidation(principal);

  return useMutation({
    mutationFn: ({ badgeId }: { badgeId: number }) => claimBadge(badgeId),
    onSuccess: invalidate
  });
}
