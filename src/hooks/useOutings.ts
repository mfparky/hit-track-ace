import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Outing, AtBat } from '@/types/hitting';
import { Json } from '@/integrations/supabase/types';

export function useOutings() {
  const queryClient = useQueryClient();

  const { data: outings = [], isLoading, error } = useQuery({
    queryKey: ['outings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outings')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      return data.map((o): Outing => ({
        id: o.id,
        playerId: o.player_id,
        type: o.type as Outing['type'],
        date: o.date,
        opponent: o.opponent ?? undefined,
        atBats: (o.at_bats as unknown as AtBat[]) || [],
        notes: o.notes ?? undefined,
        isComplete: o.is_complete,
      }));
    },
  });

  const addOuting = useMutation({
    mutationFn: async (outing: Omit<Outing, 'id'>) => {
      const { data, error } = await supabase
        .from('outings')
        .insert({
          player_id: outing.playerId,
          type: outing.type,
          date: outing.date,
          opponent: outing.opponent ?? null,
          at_bats: outing.atBats as unknown as Json,
          notes: outing.notes ?? null,
          is_complete: outing.isComplete,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        playerId: data.player_id,
        type: data.type as Outing['type'],
        date: data.date,
        opponent: data.opponent ?? undefined,
        atBats: (data.at_bats as unknown as AtBat[]) || [],
        notes: data.notes ?? undefined,
        isComplete: data.is_complete,
      } as Outing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outings'] });
    },
  });

  const updateOuting = useMutation({
    mutationFn: async (outing: Outing) => {
      const { error } = await supabase
        .from('outings')
        .update({
          player_id: outing.playerId,
          type: outing.type,
          date: outing.date,
          opponent: outing.opponent ?? null,
          at_bats: outing.atBats as unknown as Json,
          notes: outing.notes ?? null,
          is_complete: outing.isComplete,
        })
        .eq('id', outing.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outings'] });
    },
  });

  const deleteOuting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('outings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outings'] });
    },
  });

  const getPlayerOutings = (playerId: string) => {
    return outings.filter((o) => o.playerId === playerId);
  };

  return {
    outings,
    isLoading,
    error,
    addOuting: addOuting.mutateAsync,
    updateOuting: updateOuting.mutateAsync,
    deleteOuting: deleteOuting.mutateAsync,
    getPlayerOutings,
    isAddingOuting: addOuting.isPending,
    isUpdatingOuting: updateOuting.isPending,
  };
}
