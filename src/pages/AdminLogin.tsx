import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export function AdminLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) {
      setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <span className="font-display font-bold text-xl text-slate-900">ETS Laurent Mathieu</span>
          </a>
          <p className="text-sm text-slate-500 mt-1">Espace administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Connexion</h2>

          <div className="space-y-4">
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemple.fr"
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label-field">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <a href="/" className="block text-center text-sm text-slate-500 hover:text-brand-600 mt-4 transition-colors">
            ← Retour au site
          </a>
        </form>
      </div>
    </div>
  );
}
