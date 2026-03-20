import { useQuery } from "@tanstack/react-query";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getRecentActivity, getWalletPortfolio } from "../services/contract";
// import { createSnapshot, getCurrentBlockHeight, hashTextToHex, submitCheckIn } from "../services/contract";
// import { createTrackerTransport, trackerSdk } from "../services/contract";
// const transport = createTrackerTransport();
// export function useDashboard(principal: string | null) {
//   return useQuery({
//     queryKey: ["dashboard", principal],
//     queryFn: () => trackerSdk.getDashboard(principal!, transport),
//     enabled: Boolean(principal)
//   });
// }

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

/*
export function useCreateSnapshot(principal: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ objective, durationDays }: { objective: string; durationDays: number }) => {
      const [commitmentHashHex, currentBlockHeight] = await Promise.all([
        hashTextToHex(objective),
        getCurrentBlockHeight()
      ]);

      const dueAtHeight = currentBlockHeight + durationDays * 144;
      return createSnapshot(commitmentHashHex, dueAtHeight);
    },
    onSuccess: async () => {
      if (principal) {
        await queryClient.invalidateQueries({ queryKey: ["dashboard", principal] });
        await queryClient.invalidateQueries({ queryKey: ["activity", principal] });
      }
    }
  });
}

export function useCheckIn(principal: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ note }: { note: string }) => {
      const proofHashHex = await hashTextToHex(note);
      return submitCheckIn(proofHashHex);
    },
    onSuccess: async () => {
      if (principal) {
        await queryClient.invalidateQueries({ queryKey: ["dashboard", principal] });
        await queryClient.invalidateQueries({ queryKey: ["activity", principal] });
      }
    }
  });
}
*/
