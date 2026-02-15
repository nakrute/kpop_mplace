import { supabase } from "./supabaseClient.js";

export async function getActiveListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active");

  if (error) throw error;
  return data ?? [];
}

export async function getCardById(cardId) {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function getListingsForCard(cardId) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("status", "active")
    .eq("card_id", cardId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getMyListings(userId) {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function updateListingStatus(listingId, status) {
  const { data, error } = await supabase
    .from("listings")
    .update({ status })
    .eq("id", listingId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
