import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/hitting/PageHeader';
import { BottomNav } from '@/components/hitting/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus } from 'lucide-react';

export default function CoachLogin() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Check your email', description: 'Password reset link sent.' });
        setMode('login');
      }
      return;
    }

    const fn = mode === 'login' ? signIn : signUp;
    const { error } = await fn(email, password);
    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (mode === 'signup') {
      toast({ title: 'Account created', description: 'Check your email to verify your account.' });
      setMode('login');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="Coach Access" showBack />

      <div className="px-4 py-8 max-w-sm mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground mx-auto mb-4">
            {mode === 'signup' ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
          </div>
          <h2 className="text-xl font-bold">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === 'forgot'
              ? 'Enter your email to receive a reset link'
              : 'Sign in to add players, log outings, and manage data'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="coach@team.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('forgot')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Forgot password?
              </button>
              <p className="text-sm text-muted-foreground">
                No account?{' '}
                <button onClick={() => setMode('signup')} className="text-accent font-medium hover:underline">
                  Sign up
                </button>
              </p>
            </>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <p className="text-sm text-muted-foreground">
              <button onClick={() => setMode('login')} className="text-accent font-medium hover:underline">
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
