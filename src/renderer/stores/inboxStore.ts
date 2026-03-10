/**
 * inboxStore - Zustand store for attention inbox management
 *
 * Tracks sessions that need user attention (finished, errored, waiting for input).
 * Runtime-only — not persisted to disk.
 */

import { create } from 'zustand';
import type { InboxItem } from '../types';

// ============================================================================
// Store Types
// ============================================================================

export interface InboxStoreState {
	items: InboxItem[];
}

export interface InboxStoreActions {
	addItem: (item: InboxItem) => void;
	dismissItem: (itemId: string) => void;
	dismissAllForSession: (sessionId: string) => void;
	dismissAllForProject: (projectId: string) => void;
	clearAll: () => void;
}

export type InboxStore = InboxStoreState & InboxStoreActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useInboxStore = create<InboxStore>()((set) => ({
	items: [],

	addItem: (item) =>
		set((s) => {
			// Deduplicate: don't add if same session+reason already exists
			const exists = s.items.some(
				(existing) => existing.sessionId === item.sessionId && existing.reason === item.reason
			);
			if (exists) return s;
			return { items: [...s.items, item] };
		}),

	dismissItem: (itemId) =>
		set((s) => {
			const filtered = s.items.filter((item) => item.id !== itemId);
			if (filtered.length === s.items.length) return s;
			return { items: filtered };
		}),

	dismissAllForSession: (sessionId) =>
		set((s) => {
			const filtered = s.items.filter((item) => item.sessionId !== sessionId);
			if (filtered.length === s.items.length) return s;
			return { items: filtered };
		}),

	dismissAllForProject: (projectId) =>
		set((s) => {
			const filtered = s.items.filter((item) => item.projectId !== projectId);
			if (filtered.length === s.items.length) return s;
			return { items: filtered };
		}),

	clearAll: () => set({ items: [] }),
}));

// ============================================================================
// Selectors
// ============================================================================

export const selectInboxItems = (state: InboxStore): InboxItem[] =>
	[...state.items].sort((a, b) => b.timestamp - a.timestamp);

export const selectInboxCount = (state: InboxStore): number => state.items.length;

export const selectInboxByProject =
	(projectId: string) =>
	(state: InboxStore): InboxItem[] =>
		state.items
			.filter((item) => item.projectId === projectId)
			.sort((a, b) => b.timestamp - a.timestamp);

// ============================================================================
// Non-React Access
// ============================================================================

export function getInboxActions() {
	const state = useInboxStore.getState();
	return {
		addItem: state.addItem,
		dismissItem: state.dismissItem,
		dismissAllForSession: state.dismissAllForSession,
		dismissAllForProject: state.dismissAllForProject,
		clearAll: state.clearAll,
	};
}
