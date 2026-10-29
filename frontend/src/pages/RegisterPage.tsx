import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/FormControls';
import { useAuth } from '../context/AuthContext';
import { useStudentData } from '../context/StudentDataContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { updateProfile } = useStudentData();
  const { success } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [targetRole, setTargetRole] = useState('Full-Stack Software Engineer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        role: 'student',
        profile: {
          college: institution,
          university: institution,
          targetRoles: [targetRole],
        },
      });
      updateProfile({
        name,
        email,
        targetRoles: [targetRole],
        education: {
          institution: institution || 'State University',
          degree: 'B.S. in Computer Science',
          major: 'Software Engineering',
          graduationYear: 2027,
          currentYear: '3rd Year (Junior)',
          gpa: '3.8 / 4.0',
        },
      });
      success('Account Created!', 'Launching your onboarding setup.');
      navigate('/onboarding');
    } catch (err) {
      const message = (err as Error).message || 'Registration failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
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
          Create Free Student Account
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Prepare for upcoming campus placements, roadmaps, and mock interviews.
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input
                label="Full Name"
                placeholder="e.g. Alex Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Student Email Address"
                type="email"
                placeholder="alex.chen@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="University / College"
                placeholder="e.g. California State University"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />

              <Select
                label="Primary Target Career Role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                options={[
                  { label: 'Full-Stack Software Engineer', value: 'Full-Stack Software Engineer' },
                  { label: 'Backend Systems Engineer', value: 'Backend Systems Engineer' },
                  { label: 'Cloud & DevOps Platform Engineer', value: 'Cloud & DevOps Engineer' },
                  { label: 'AI Solutions & Data Engineer', value: 'Data Scientist & AI Solutions Engineer' },
                ]}
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-2"
                isLoading={isLoading}
                loadingText="Creating Account..."
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Create Account & Continue
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:underline">
                Sign in here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
