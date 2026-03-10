/**
 * useSessionTabs — Provides session-level tab data and handlers for the TabBar.
 *
 * Instead of showing AI conversation tabs within a single session,
 * the tab bar shows one tab per session/agent belonging to the active project.
 * This hook maps sessions to AITab[] and provides handlers that operate
 * on sessions (switching, closing, creating, reordering, starring, renaming).
 */

import { useMemo, useCallback } from 'react';
import type { AITab } from '../../types';
import { useSessionStore } from '../../stores/sessionStore';
import { useProjectStore } from '../../stores/projectStore';
import { getModalActions } from '../../stores/modalStore';
import { mapSessionsToTabs } from '../../utils/sessionToTab';

// ============================================================================
// Return type
// ============================================================================

export interface UseSessionTabsReturn {
	/** Sessions mapped to AITab[] for the TabBar (filtered to active project) */
	sessionTabs: AITab[];
	/** The active session ID (used as TabBar's activeTabId) */
	activeSessionTabId: string;

	// Handlers matching TabBar callback signatures
	handleSessionTabSelect: (id: string) => void;
	handleSessionTabClose: (id: string) => void;
	handleSessionTabNew: () => void;
	handleSessionTabReorder: (fromIndex: number, toIndex: number) => void;
	handleSessionTabRename: (id: string) => void;
	handleSessionTabStar: (id: string, starred: boolean) => void;
}

// ============================================================================
// Hook implementation
// ============================================================================

export function useSessionTabs(): UseSessionTabsReturn {
	// --- Store subscriptions ---
	const sessions = useSessionStore((s) => s.sessions);
	const activeSessionId = useSessionStore((s) => s.activeSessionId);
	const activeProjectId = useProjectStore((s) => s.activeProjectId);

	// --- Derived: sessions belonging to the active project ---
	const projectSessions = useMemo(
		() => sessions.filter((s) => s.projectId === activeProjectId),
		[sessions, activeProjectId]
	);

	// --- Mapped tabs for TabBar ---
	const sessionTabs = useMemo(
		() => mapSessionsToTabs(projectSessions),
		[projectSessions]
	);

	// --- Handlers ---

	/** Select a session tab → switch active session */
	const handleSessionTabSelect = useCallback((sessionId: string) => {
		useSessionStore.getState().setActiveSessionId(sessionId);
	}, []);

	/** Close a session tab → open delete confirmation modal */
	const handleSessionTabClose = useCallback((sessionId: string) => {
		const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
		if (session) {
			getModalActions().setDeleteAgentSession(session);
		}
	}, []);

	/** New session tab → open NewInstanceModal */
	const handleSessionTabNew = useCallback(() => {
		getModalActions().setNewInstanceModalOpen(true);
	}, []);

	/** Reorder sessions within the active project */
	const handleSessionTabReorder = useCallback(
		(fromIndex: number, toIndex: number) => {
			const currentProjectId = useProjectStore.getState().activeProjectId;
			const { sessions: allSessions, setSessions } = useSessionStore.getState();

			// Get indices of project sessions within the full sessions array
			const projectIndices: number[] = [];
			for (let i = 0; i < allSessions.length; i++) {
				if (allSessions[i].projectId === currentProjectId) {
					projectIndices.push(i);
				}
			}

			if (fromIndex < 0 || fromIndex >= projectIndices.length) return;
			if (toIndex < 0 || toIndex >= projectIndices.length) return;

			// Map project-relative indices to full-array indices
			const fromGlobalIndex = projectIndices[fromIndex];
			const toGlobalIndex = projectIndices[toIndex];

			setSessions((prev) => {
				const updated = [...prev];
				const [moved] = updated.splice(fromGlobalIndex, 1);
				updated.splice(toGlobalIndex, 0, moved);
				return updated;
			});
		},
		[]
	);

	/** Rename a session via the rename instance modal */
	const handleSessionTabRename = useCallback((sessionId: string) => {
		const session = useSessionStore.getState().sessions.find((s) => s.id === sessionId);
		if (!session) return;

		const actions = getModalActions();
		actions.setRenameInstanceValue(session.name);
		actions.setRenameInstanceSessionId(sessionId);
	}, []);

	/** Toggle starred/bookmarked state on a session */
	const handleSessionTabStar = useCallback((sessionId: string, starred: boolean) => {
		useSessionStore.getState().updateSession(sessionId, { bookmarked: starred });
	}, []);

	return {
		sessionTabs,
		activeSessionTabId: activeSessionId,
		handleSessionTabSelect,
		handleSessionTabClose,
		handleSessionTabNew,
		handleSessionTabReorder,
		handleSessionTabRename,
		handleSessionTabStar,
	};
}
