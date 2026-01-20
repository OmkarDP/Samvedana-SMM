/**
 * Authentication hook for Samvedana Foundation Admin App
 * Handles login/logout and user session management using Firebase Firestore
 */

import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, firebaseIsConfigured } from '@/lib/firebase';

export interface User {
  mobile_number: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (mobile: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('samvedana_admin_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState(prev => ({ ...prev, user, loading: false }));
      } catch (error) {
        localStorage.removeItem('samvedana_admin_user');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  /**
   * Login function - validates against Authority collection
   * NOTE: In production, password validation should be done server-side
   */
  const login = async (mobile: string, password: string): Promise<boolean> => {
    if (!firebaseIsConfigured) {
      setAuthState(prev => ({ 
        ...prev, 
        error: 'Firebase is not configured. Please check your configuration.' 
      }));
      return false;
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Query Authority collection using mobile number as document ID
      const authorityDoc = await getDoc(doc(db, 'Authority', mobile));
      
      if (!authorityDoc.exists()) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Invalid mobile number or password' 
        }));
        return false;
      }

      const userData = authorityDoc.data();
      
      // Validate password (client-side - should be server-side in production)
      if (userData.password !== password) {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Invalid mobile number or password' 
        }));
        return false;
      }

      // Check if user has Administrator role
      if (userData.role !== 'Administrator') {
        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Access denied. Administrator role required.' 
        }));
        return false;
      }

      // Create user session
      const user: User = {
        mobile_number: userData.mobile_number,
        name: userData.name,
        role: userData.role,
      };

      // Store user in localStorage for session persistence
      localStorage.setItem('samvedana_admin_user', JSON.stringify(user));
      
      setAuthState({
        user,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Login failed. Please try again.' 
      }));
      return false;
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    localStorage.removeItem('samvedana_admin_user');
    setAuthState({
      user: null,
      loading: false,
      error: null,
    });
  };

  /**
   * Clear error function
   */
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}