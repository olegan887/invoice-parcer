
import React, { useRef, useEffect, useState } from 'react';
import { DocumentTextIcon } from './Icons';
import type { UserProfile } from '../types';
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase'; // Assuming your firebase config is exported from 'firebase.ts'

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        try {
            let userCredential;
            if (isSignUp) {
                if (password.length < 6) {
                    setError('Password must be at least 6 characters long.');
                    return;
                }
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
                userCredential = await signInWithEmailAndPassword(auth, email, password);
            }

            const firebaseUser = userCredential.user;
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || email.split('@')[0],
                email: firebaseUser.email!,
                picture: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random&color=fff`,
            };
            onLogin(userProfile);

        } catch (error: any) {
            // More specific error handling
            if (error.code === 'auth/email-already-in-use') {
                setError('An account with this email already exists. Please sign in.');
            } else if (error.code === 'auth/user-not-found') {
                setError('No account found with this email. Please sign up.');
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password.');
            } else {
                setError('Authentication failed. Please try again.');
            }
            console.error("Firebase authentication error:", error);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            const firebaseUser = result.user;
            const userProfile: UserProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName!,
                email: firebaseUser.email!,
                picture: firebaseUser.photoURL!,
            };
            onLogin(userProfile);
        } catch (error) {
            setError("Google Sign-In failed. Please try again.");
            console.error("Google Sign-In error:", error);
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
                    
                    <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
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
                            {isSignUp ? 'Already have an account? Sign In' : "Don\'t have an account? Sign Up"}
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
                         <button onClick={handleGoogleSignIn} className="flex items-center justify-center w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50">
                            <svg className="w-5 h-5 mr-2" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 111.3 512 0 398.5 0 256S111.3 0 244 0c69.1 0 125.3 27.2 170.4 69.1L377.5 128C345.1 98.1 300.5 80 244 80c-87.6 0-158.3 70.7-158.3 158.3s70.7 158.3 158.3 158.3c96.1 0 133.3-67.9 138-102.3H244v-73.4h239.3c5.1 27.3 8.7 56.4 8.7 87.5z"></path></svg>
                            Sign in with Google
                        </button>
                    </div>
                </div>
                <footer className="text-center p-4 text-xs text-slate-400 mt-4">
                    <p>&copy; 2024 Invoice AI Parser.</p>
                </footer>
            </div>
        </div>
    );
};

export default LoginScreen;
