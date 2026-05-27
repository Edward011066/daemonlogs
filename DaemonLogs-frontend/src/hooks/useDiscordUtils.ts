import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import type { DiscordPublicUser, GuildChannelsResponse } from "@/types"

export function useDiscordUserLookup(discordUserId: string) {
  return useQuery({
    queryKey: ["utils", "discord-user", discordUserId],
    queryFn: () => apiFetch<DiscordPublicUser>(`/utils/discord-user/${discordUserId}`),
    enabled: !!discordUserId,
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useGuildChannels(guildId: string) {
  return useQuery({
    queryKey: ["utils", "guild-channels", guildId],
    queryFn: () => apiFetch<GuildChannelsResponse>(`/utils/guild-channels/${guildId}`),
    enabled: !!guildId,
    retry: false,
    staleTime: 60_000,
  })
}