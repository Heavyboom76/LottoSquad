/**
 * LottoSquad Auth
 *
 * Two session types:
 *  1. Admin  — Supabase Auth (email + password). Owns a group.
 *  2. Member — localStorage session { id, name, group_id }. Joined via invite link.
 *
 * An admin visiting their own pool is BOTH an admin session AND
 * can also have a member session in the same group so they show up
 * in the pool roster.
 */

import { supabase } from './supabase.js'

const MEMBER_KEY = 'ls_member'   // localStorage key for member session
const GROUP_KEY  = 'ls_group_id' // localStorage key for last-visited group

// ── Admin (Supabase Auth) ──────────────────────────────────────────────────

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data.user
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}

export async function signOut() {
  clearMemberSession()
  await supabase.auth.signOut()
}

export async function getAuthUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

// ── Admin's group ─────────────────────────────────────────────────────────

export async function getAdminGroup(userId) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('admin_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function createGroup({ name, etransfer_info, rules }) {
  const user = await getAuthUser()
  if (!user) throw new Error('Not signed in')

  // Build a URL-safe slug from group name + random suffix
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const slug = base + '-' + Math.random().toString(36).slice(2, 7)

  const { data, error } = await supabase
    .from('groups')
    .insert({ admin_id: user.id, name: name.trim(), slug, etransfer_info: etransfer_info?.trim() || null, rules: rules?.trim() || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateGroup(groupId, fields) {
  const { data, error } = await supabase
    .from('groups')
    .update(fields)
    .eq('id', groupId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getGroupBySlug(slug) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

// ── Member session (localStorage) ─────────────────────────────────────────

export function getMemberSession() {
  try {
    const raw = localStorage.getItem(MEMBER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setMemberSession(member) {
  localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
  localStorage.setItem(GROUP_KEY, member.group_id)
}

export function clearMemberSession() {
  localStorage.removeItem(MEMBER_KEY)
  localStorage.removeItem(GROUP_KEY)
}

export function getLastGroupId() {
  return localStorage.getItem(GROUP_KEY) || null
}

// ── Members CRUD ──────────────────────────────────────────────────────────

export async function fetchGroupMembers(groupId) {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('group_id', groupId)
    .order('name')
  if (error) throw error
  return data || []
}

export async function createMember(groupId, name, email = null) {
  const { data, error } = await supabase
    .from('members')
    .insert({ group_id: groupId, name: name.trim(), email: email?.trim() || null })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('That name is already taken in this squad!')
    throw error
  }
  return data
}

export async function deleteMember(id) {
  const { error } = await supabase.from('members').delete().eq('id', id)
  if (error) throw error
}
