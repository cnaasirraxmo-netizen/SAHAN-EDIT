import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { auth, googleProvider } from '../../services/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    AuthError
} from 'firebase/auth';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
    const { t } = useLanguage();
    const { currentUser } = useAuth();
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuthError = (err: AuthError) => {
        console.error("Firebase Auth Error:", err.code, err.message);
        switch (err.code) {
            case 'auth/email-already-in-use':
                return t('auth_modal_error_email_exists');
            case 'auth/weak-password':
                return t('auth_modal_error_weak_password');
            case 'auth/invalid-credential':
                return t('auth_modal_error_invalid_cred');
            default:
                return t('auth_modal_error_generic');
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            onClose();
        } catch (err) {
            setError(handleAuthError(err as AuthError));
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithPopup(auth, googleProvider);
            onClose();
        } catch (err) {
            setError(handleAuthError(err as AuthError));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
        onClose();
    };

    if (currentUser) {
        return (
            <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
                <div className="bg-zinc-800 rounded-2xl w-full max-w-sm m-4 shadow-2xl border border-zinc-700 p-8 text-center" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-2xl font-bold text-white mb-2">{t('auth_modal_welcome_back')}</h2>
                    <p className="text-zinc-400 mb-6 truncate">{currentUser.email}</p>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        {t('auth_modal_logout')}
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <div className="bg-zinc-800 rounded-2xl w-full max-w-sm m-4 shadow-2xl border border-zinc-700 relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">{isLoginView ? t('auth_modal_signin') : t('auth_modal_signup')}</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-zinc-400 text-sm font-bold mb-2" htmlFor="email">
                                {t('auth_modal_email')}
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-zinc-400 text-sm font-bold mb-2" htmlFor="password">
                                {t('auth_modal_password')}
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                                minLength={6}
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-zinc-600"
                        >
                            {isLoading ? '...' : (isLoginView ? t('auth_modal_signin_cta') : t('auth_modal_signup_cta'))}
                        </button>
                    </form>

                    <div className="my-6 flex items-center">
                        <div className="flex-grow border-t border-zinc-700"></div>
                        <span className="flex-shrink mx-4 text-zinc-500 text-sm">OR</span>
                        <div className="flex-grow border-t border-zinc-700"></div>
                    </div>

                    <button 
                        onClick={handleGoogleSignIn}
                        disabled={isLoading}
                        className="w-full bg-zinc-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-zinc-600 transition-colors flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-76.3 76.3c-24.2-22.4-56-36.4-92.6-36.4-68.9 0-125.9 55.2-125.9 123s57 123 125.9 123c72.8 0 115.7-48.4 120.9-72.6H248v-94.2h238.2c1.2 11.2 2.7 22.4 2.7 34.2z"></path></svg>
                        <span>{t('auth_modal_google_signin')}</span>
                    </button>

                    <p className="text-center text-sm text-zinc-400 mt-6">
                        {isLoginView ? t('auth_modal_no_account') : t('auth_modal_have_account')}{' '}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-bold text-indigo-400 hover:underline">
                            {isLoginView ? t('auth_modal_signup') : t('auth_modal_signin')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
