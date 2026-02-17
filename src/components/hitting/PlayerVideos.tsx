import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Video, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface VideoItem {
  name: string;
  url: string;
  createdAt: string;
}

interface PlayerVideosProps {
  playerId: string;
  isCoach?: boolean;
}

const BUCKET = 'swing-videos';

export function PlayerVideos({ playerId, isCoach }: PlayerVideosProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list(playerId, { sortBy: { column: 'created_at', order: 'desc' } });

      if (error) {
        console.warn('Failed to list videos:', error.message);
        setVideos([]);
        return;
      }

      const items: VideoItem[] = (data || [])
        .filter(f => f.name.endsWith('.mp4') || f.name.endsWith('.webm'))
        .map(f => {
          const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(`${playerId}/${f.name}`);
          return {
            name: f.name,
            url: urlData.publicUrl,
            createdAt: f.created_at ?? '',
          };
        });

      setVideos(items);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [playerId]);

  const handleDelete = async (name: string) => {
    setDeletingName(name);
    const { error } = await supabase.storage.from(BUCKET).remove([`${playerId}/${name}`]);
    if (error) {
      toast({ title: 'Failed to delete video', variant: 'destructive' });
    } else {
      setVideos(prev => prev.filter(v => v.name !== name));
      toast({ title: 'Video deleted' });
    }
    setDeletingName(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        No saved videos yet. Record a swing during an outing to save it here.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {videos.map(v => (
        <div key={v.name} className="bg-card border border-border rounded-xl overflow-hidden">
          <video
            src={v.url}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-video bg-black"
          />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs text-muted-foreground truncate">
              {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : v.name}
            </span>
            {isCoach && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive"
                disabled={deletingName === v.name}
                onClick={() => handleDelete(v.name)}
              >
                {deletingName === v.name ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
