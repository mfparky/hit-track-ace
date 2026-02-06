import { useState } from 'react';
import { useHitting } from '@/context/HittingContext';
import { BottomNav } from '@/components/hitting/BottomNav';
import { PageHeader } from '@/components/hitting/PageHeader';
import { PlayerCard } from '@/components/hitting/PlayerCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Player } from '@/types/hitting';



export default function Roster() {
  const { players, outings, addPlayer } = useHitting();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    number: '',
    bats: 'R' as 'L' | 'R' | 'S',
  });

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.number.includes(search)
  );

  const handleAddPlayer = () => {
    if (!newPlayer.name || !newPlayer.number) return;

    const player: Player = {
      id: Date.now().toString(),
      ...newPlayer,
    };

    addPlayer(player);
    setNewPlayer({ name: '', number: '', bats: 'R' });
    setDialogOpen(false);
  };

  const getPlayerStats = (playerId: string) => {
    const playerOutings = outings.filter(o => o.playerId === playerId);
    const totalABs = playerOutings.reduce((acc, o) => 
      acc + o.atBats.filter(ab => !['walk', 'hbp'].includes(ab.result)).length, 0
    );
    const hits = playerOutings.reduce((acc, o) => 
      acc + o.atBats.filter(ab => ['single', 'double', 'triple', 'hr'].includes(ab.result)).length, 0
    );
    
    return {
      avg: totalABs > 0 ? hits / totalABs : 0,
      outings: playerOutings.length,
    };
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="Roster"
        subtitle={`${players.length} players`}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="text-accent">
                <Plus className="w-6 h-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle>Add Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Player name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Number</Label>
                  <Input
                    id="number"
                    placeholder="#"
                    value={newPlayer.number}
                    onChange={(e) => setNewPlayer({ ...newPlayer, number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Bats</Label>
                  <Select
                    value={newPlayer.bats}
                    onValueChange={(value: 'L' | 'R' | 'S') => setNewPlayer({ ...newPlayer, bats: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R">Right</SelectItem>
                      <SelectItem value="L">Left</SelectItem>
                      <SelectItem value="S">Switch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={handleAddPlayer}
                  disabled={!newPlayer.name || !newPlayer.number}
                >
                  Add Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Player List */}
        <div className="space-y-3">
          {filteredPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              stats={getPlayerStats(player.id)}
              onClick={() => navigate(`/player/${player.id}`)}
            />
          ))}

          {filteredPlayers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No players found</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
