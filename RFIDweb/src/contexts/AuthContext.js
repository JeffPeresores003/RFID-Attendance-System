import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      // Try to fetch from teachers table first
      let { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .single();

      // If not found in teachers, try admin table
      if (error && error.code === 'PGRST116') {
        const { data: adminData, error: adminError } = await supabase
          .from('admin')
          .select('*')
          .eq('id', userId)
          .single();

        if (adminError) throw adminError;
        
        // Add role to admin profile
        data = { ...adminData, role: 'admin' };
      } else if (error) {
        throw error;
      } else {
        // Add role to teacher profile
        data = { ...data, role: 'teacher' };
      }

      setUser(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const signIn = async (input, password, portal) => {
    try {
      let email;
      
      // Check if input is already an email (contains @) or username
      if (input.includes('@')) {
        email = input; // It's already an email
      } else {
        // Convert username to email format
        const cleanUsername = input.toLowerCase()
          .replace(/\s+/g, '.') // Replace spaces with dots
          .replace(/[^a-z0-9.]/g, ''); // Remove special characters except dots
        email = `${cleanUsername}@local.app`;
      }
      
      console.log('Attempting login with email:', email); // Debug log
      
      // Try signing in using new internal domain first, then fall back to old domain
      let authData, authError;
      try {
        const tryEmail = email; // e.g. username@local.app
        console.log('Attempting login with email:', tryEmail);
        ({ data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: tryEmail,
          password,
        }));
        if (authError) throw authError;
      } catch (e1) {
        // If first attempt failed, try legacy @school.com email (handles existing accounts)
        try {
          const legacyEmail = email.replace('@local.app', '@school.com');
          console.log('First attempt failed, trying legacy email:', legacyEmail);
          const res = await supabase.auth.signInWithPassword({
            email: legacyEmail,
            password,
          });
          authData = res.data;
          authError = res.error;
          if (authError) throw authError;
        } catch (e2) {
          console.error('Auth attempts failed:', e1.message || e1, e2?.message || e2);
          // propagate original error to UI
          throw e2 || e1;
        }
      }

      // Determine which table to query based on portal
      const tableName = portal === 'admin' ? 'admin' : 'teachers';
      
      // Fetch user profile from the appropriate table
      const { data: profile, error: profileError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        return { 
          data: null, 
          error: { message: `This account is not registered as a ${portal}. Please select the correct portal.` } 
        };
      }

      // Add role and username to profile
      const username = email.replace('@local.app', '').replace(/\./g, '');
      const userProfile = { ...profile, role: portal, username };
      
      setUser(userProfile);
      return { data: userProfile, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  // Sign Up
  const signUp = async (email, password, role, fullName, studentId = null, grade = null) => {
    try {
      // Create auth user with metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: fullName,
            student_id: studentId,
            grade: grade?.toString()
          }
        }
      });

      if (authError) throw authError;

      return { data: authData, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
