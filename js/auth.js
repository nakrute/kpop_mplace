import { supabase } from "./supabaseClient.js";

let currentUser = null;

export function getUser() {
  return currentUser;
}

export async function initAuth({ onAuthChange } = {}) {
  const { data } = await supabase.auth.getSession();
  currentUser = data?.session?.user ?? null;

  supabase.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    if (typeof onAuthChange === "function") onAuthChange(currentUser);
  });

  return currentUser;
}

export async function requireAuth() {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user ?? null;
  if (!user) {
    window.location.href = "./login.html";
    return null;
  }
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
}
