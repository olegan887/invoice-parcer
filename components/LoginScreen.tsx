import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DocumentTextIcon } from './Icons';
import type { UserProfile } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

// This would typically be loaded from environment variables.
// A placeholder is used here to prevent configuration errors in this environment.
// For full functionality, replace this with your actual Google Client ID.
const GOOGLE_CLIENT_ID = "1002324914399-6vkpsoj29t6o7d5q9b540h21s9622d56.apps.googleusercontent.com";


const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleLogin = useCallback((credential: string) => {
        try {
            const tokenPayload = credential.split('.')[1];
            const decodedPayload = atob(tokenPayload);
            const parsedData = JSON.parse(decodedPayload);
            
            const loggedInUser: UserProfile = {
                id: parsedData.sub,
                name: parsedData.name,
                email: parsedData.email,
                picture: parsedData.picture,
            };
            
            onLogin(loggedInUser);
        } catch (error) {
            console.error("Failed to decode Google credential:", error);
            setError("Google Sign-In failed. Please try again.");
        }
    }, [onLogin]);

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.error("Google Client ID is not configured.");
            return;
        }

        const google = (window as any).google;

        if (google?.accounts?.id) {
            google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: (response: any) => {
                    handleGoogleLogin(response.credential);
                },
            });

            if (googleButtonRef.current) {
                google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { theme: "outline", size: "large", type: 'standard', text: 'signin_with' }
                );
            }
        } else {
            console.warn("Google Identity Services library not loaded yet.");
        }
    }, [handleGoogleLogin]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        // Basic email validation
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (isSignUp) {
            // --- Sign Up Logic ---
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.');
                return;
            }
            const existingUser = localStorage.getItem(`user_auth_${email}`);
            if (existingUser) {
                setError('An account with this email already exists. Please sign in.');
                return;
            }
            // In a real app, you would hash the password before storing it.
            const newUserAuth = { email, password };
            const userId = `email|${btoa(email)}`;
            const newUserProfile: UserProfile = {
                id: userId,
                name: email.split('@')[0],
                email: email,
                picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random&color=fff`,
            };
            localStorage.setItem(`user_auth_${email}`, JSON.stringify(newUserAuth));
            onLogin(newUserProfile);
        } else {
            // --- Sign In Logic ---
            const savedUserAuthString = localStorage.getItem(`user_auth_${email}`);
            if (!savedUserAuthString) {
                setError('No account found with this email. Please sign up.');
                return;
            }
            const savedUserAuth = JSON.parse(savedUserAuthString);
            if (savedUserAuth.password !== password) {
                setError('Incorrect password.');
                return;
            }
            
            const userId = `email|${btoa(email)}`;
            const userProfileString = localStorage.getItem(`user_profile_${userId}`);
            if (!userProfileString) {
                setError('Could not find user profile. Please try signing up again.');
                return;
            }

            const userProfile = JSON.parse(userProfileString);
            onLogin(userProfile);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
                    <div className="flex justify-center mb-6">
                        <div className="bg-indigo-600 p-4 rounded-full text-white">
                            <DocumentTextIcon className="h-10 w-10" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-center text-slate-800">Invoice AI Parser</h1>
                    <p className="text-center text-slate-500 mt-2 mb-6">{isSignUp ? 'Create an account to get started.' : 'Sign in to your account.'}</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>

                        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </button>
                    </form>

                    <div className="text-center my-4">
                        <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>

                    <div className="my-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-center">
                        <div ref={googleButtonRef}></div>
                    </div>
                    {!GOOGLE_CLIENT_ID && <p className="text-center text-red-500 text-xs mt-4">Google Sign-In is not configured on this server.</p>}
                </div>
                <footer className="text-center p-4 text-xs text-slate-400 mt-4">
                    <p>&copy; 2024 Invoice AI Parser.</p>
                </footer>
            </div>
        </div>
    );
};

export default LoginScreen;
