import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { profileService } from "@/services/profileService";
import type { Profile } from "@/types/database";

export function useProfile() {
  return useQuery<Profile>({
    queryKey: queryKeys.profile,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: profileService.getProfile,
  });
}
