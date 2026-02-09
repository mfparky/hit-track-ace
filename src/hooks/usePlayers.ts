import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Player } from '@/types/hitting';

export function usePlayers() {
  const queryClient = useQueryClient();

  const { data: players = [], isLoading, error } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      return data.map((p): Player => ({
        id: p.id,
        name: p.name,
        number: p.number,
        bats: p.bats as 'L' | 'R' | 'S',
        avatar: p.avatar ?? undefined,
        youtubePlaylistUrl: (p as any).youtube_playlist_url ?? undefined,
      }));
    },
  });

  const addPlayer = useMutation({
    mutationFn: async (player: Omit<Player, 'id'>) => {
      const { data, error } = await supabase
        .from('players')
        .insert({
          name: player.name,
          number: player.number,
          bats: player.bats,
          avatar: player.avatar ?? null,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const updatePlayer = useMutation({
    mutationFn: async (player: Player) => {
      const { error } = await supabase
        .from('players')
        .update({
          name: player.name,
          number: player.number,
          bats: player.bats,
          avatar: player.avatar ?? null,
          youtube_playlist_url: player.youtubePlaylistUrl ?? null,
        } as any)
        .eq('id', player.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  const deletePlayer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
    },
  });

  return {
    players,
    isLoading,
    error,
    addPlayer: addPlayer.mutateAsync,
    updatePlayer: updatePlayer.mutateAsync,
    deletePlayer: deletePlayer.mutateAsync,
    isAddingPlayer: addPlayer.isPending,
  };
}
