import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { inboxService } from "@/services/inboxService";

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: queryKeys.unreadCount,
    queryFn: inboxService.unreadCount,
  });
}
