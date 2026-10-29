import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/FormControls';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both your registered email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password });
      success('Welcome Back!', 'Redirecting to your student placement dashboard.');
      navigate('/dashboard');
    } catch (err) {
      const message = (err as Error).message || 'Invalid email or password. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('alex.chen@university.edu');
    setPassword('DemoPlacement2026!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Compass className="w-6 h-6" />
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">Career Pilot AI</span>
        </Link>
        <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
          Sign In to Your Student Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Access your skills assessment, milestone roadmap, and placement tracker.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="shadow-lg border-slate-200">
          <CardContent className="pt-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Student Email Address"
                type="email"
                placeholder="alex.chen@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent to demo email.'); }} className="text-indigo-600 hover:underline font-medium">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                loadingText="Authenticating..."
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Dashboard
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDemoFill}
                className="w-full text-xs text-center text-indigo-600 hover:text-indigo-800 font-semibold py-1.5 px-3 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100/50 transition-colors"
              >
                ⚡ Autofill Demo Student Credentials
              </button>
            </div>
          </CardContent>

          <CardFooter className="justify-center bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              New to Career Pilot AI?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
                Create student account
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
