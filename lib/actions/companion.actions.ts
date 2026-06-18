'use server';

import { auth } from '@clerk/nextjs/server';
import { createSupabaseClient } from '../supabase';

// Create a new AI Companion
export const createCompanion = async (formData: CreateCompanion) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('Unauthorized');

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('companions')
    .insert({ ...formData, author })
    .select();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create companion');
  }

  return data[0];
};

// Get all AI Companions created by the authenticated user
export const getCompanions = async () => {
  const { userId: author } = await auth();
  if (!author) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('companions')
    .select('*')
    .eq('author', author)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching companions:', error.message, 'Details:', error.details, 'Code:', error.code);
    return [];
  }

  return data || [];
};

// Get an AI Companion by its ID (includes mock fallback for popular companions)
export const getCompanionById = async (id: string) => {
  // Hardcoded fallback for popular companions on the home page
  const popularCompanions = [
    {
      id: "123",
      name: "Neura the Brainy Explorer",
      subject: "science",
      topic: "Neural Network of the Brain",
      duration: 45,
      voice: "female",
      style: "casual",
    },
    {
      id: "456",
      name: "Countsy the Number Wizard",
      subject: "maths",
      topic: "Derivatives & Integrals",
      duration: 30,
      voice: "male",
      style: "casual",
    },
    {
      id: "789",
      name: "Verba the Vocabulary Builder",
      subject: "language",
      topic: "English Literature",
      duration: 30,
      voice: "female",
      style: "formal",
    }
  ];

  const popular = popularCompanions.find((c) => c.id === id);
  if (popular) {
    return popular;
  }

  const { userId: author } = await auth();
  if (!author) return null;

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('companions')
    .select('*')
    .eq('id', id)
    .eq('author', author)
    .single();

  if (error) {
    console.error('Error fetching companion by ID:', error);
    return null;
  }

  return data;
};

// Delete a custom AI Companion
export const deleteCompanion = async (id: string) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('Unauthorized');

  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from('companions')
    .delete()
    .eq('id', id)
    .eq('author', author);

  if (error) {
    throw new Error(error.message);
  }

  return true;
};

// Log a completed learning session
export const createSession = async (sessionData: {
  companion_id: string;
  name: string;
  subject: string;
  topic: string;
  duration: number;
}) => {
  const { userId: author } = await auth();
  if (!author) throw new Error('Unauthorized');

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .insert({ ...sessionData, author })
    .select();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create session');
  }

  return data[0];
};

// Get all learning sessions completed by the user
export const getSessions = async () => {
  const { userId: author } = await auth();
  if (!author) return [];

  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('author', author)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error.message, 'Details:', error.details, 'Code:', error.code);
    return [];
  }

  return data || [];
};
