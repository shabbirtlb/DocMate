import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './auth-provider';
import { toast } from 'sonner';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  });

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        const result = await signUp(formData.email, formData.password, formData.name);
        if (result.success) {
          toast.success('Account created successfully!');
        } else {
          toast.error(result.error || 'Failed to create account');
        }
      } else {
        const result = await signIn(formData.email, formData.password);
        if (result.success) {
          toast.success('Welcome back!');
        } else {
          toast.error(result.error || 'Failed to sign in');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 6) return { strength: 1, text: 'Too short' };
    if (password.length < 8) return { strength: 2, text: 'Weak' };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { strength: 3, text: 'Good' };
    return { strength: 4, text: 'Strong' };
  };

  const passwordStrength = isSignUp ? getPasswordStrength(formData.password) : null;

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl shadow-lg">
                <Shield className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold">DocuMate+</h1>
                <p className="text-sm text-muted-foreground">Secure & Local</p>
              </div>
            </div>
          </div>

          <Card className="shadow-xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                {isSignUp 
                  ? 'Start managing your documents securely' 
                  : 'Sign in to access your documents'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isSignUp && passwordStrength && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full ${
                              level <= passwordStrength.strength
                                ? level <= 2
                                  ? 'bg-red-500'
                                  : level === 3
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Password strength: {passwordStrength.text}
                      </p>
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="pl-9"
                        required
                      />
                      {formData.confirmPassword && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {formData.password === formData.confirmPassword ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  <Button
                    variant="link"
                    className="p-0 ml-1 h-auto font-medium"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setFormData({ email: '', password: '', name: '', confirmPassword: '' });
                    }}
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </Button>
                </p>
              </div>

              {/* Security Features */}
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-md">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs text-green-800 dark:text-green-200 font-medium">
                      All data stored locally on your device
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>No cloud storage</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Encrypted locally</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>No data sharing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Full privacy</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slogan Section */}
        <div className="mt-8 text-center max-w-md">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white/20 dark:border-gray-700/20">
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              All Your Docs. One Safe Place.
            </h2>
            <p className="text-muted-foreground">
              Cards, subscriptions, and files—organized, encrypted & local.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}