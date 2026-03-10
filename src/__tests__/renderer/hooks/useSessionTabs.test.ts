/**
 * Tests for useSessionTabs hook — session-level tab bar (project-scoped).
 *
 * Tests:
 *   - sessionTabs filtered by active project
 *   - activeSessionTabId matches activeSessionId
 *   - handleSessionTabSelect switches active session
 *   - handleSessionTabClose opens delete agent confirmation
 *   - handleSessionTabNew opens new instance modal
 *   - handleSessionTabReorder reorders sessions within project
 *   - handleSessionTabRename opens rename modal
 *   - handleSessionTabStar toggles bookmarked state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';

// ============================================================================
// Imports (Zustand stores must be imported before rendering)
// ============================================================================

import { useSessionTabs } from '../../../renderer/hooks/tabs/useSessionTabs';
import { useSessionStore } from '../../../renderer/stores/sessionStore';
import { useProjectStore } from '../../../renderer/stores/projectStore';
import { useModalStore, getModalActions } from '../../../renderer/stores/modalStore';
import type { Session, AITab } from '../../../renderer/types';

// ============================================================================
// Test helpers
// ============================================================================

function makeSession(overrides: Partial<Session> = {}): Session {
	const defaultTab: AITab = {
		id: 'tab-1',
		agentSessionId: null,
		name: null,
		starred: false,
		logs: [],
		inputValue: '',
		stagedImages: [],
		createdAt: 1000,
		state: 'idle',
	};

	return {
		id: 'sess-1',
		name: 'My Agent',
		toolType: 'claude-code',
		state: 'idle',
		cwd: '/home/user/project',
		fullPath: '/home/user/project',
		projectRoot: '/home/user/project',
		isGitRepo: false,
		aiLogs: [],
		shellLogs: [],
		workLog: [],
		contextUsage: 0,
		inputMode: 'ai',
		aiPid: 0,
		terminalPid: 0,
		port: 3000,
		isLive: false,
		changedFiles: [],
		fileTree: [],
		fileExplorerExpanded: [],
		fileExplorerScrollPos: 0,
		fileTreeAutoRefreshInterval: 180,
		shellCwd: '/home/user/project',
		aiCommandHistory: [],
		shellCommandHistory: [],
		executionQueue: [],
		activeTimeMs: 0,
		aiTabs: [defaultTab],
		activeTabId: 'tab-1',
		closedTabHistory: [],
		filePreviewTabs: [],
		activeFileTabId: null,
		unifiedTabOrder: [{ type: 'ai', id: 'tab-1' }],
		unifiedClosedTabHistory: [],
		autoRunFolderPath: '/home/user/project/.maestro/auto-run',
		...overrides,
	} as Session;
}

// ============================================================================
// Setup / Teardown
// ============================================================================

beforeEach(() => {
	// Reset stores to initial state
	useSessionStore.setState({
		sessions: [],
		activeSessionId: '',
		groups: [],
		sessionsLoaded: false,
		initialLoadComplete: false,
		removedWorktreePaths: new Set(),
		cyclePosition: -1,
	});

	useProjectStore.setState({
		activeProjectId: 'proj-1',
	});

	// Reset modal store — close all modals by resetting the layers stack
	const modalState = useModalStore.getState();
	if (modalState.isOpen('deleteAgent')) modalState.closeModal('deleteAgent');
	if (modalState.isOpen('newInstance')) modalState.closeModal('newInstance');
	if (modalState.isOpen('renameInstance')) modalState.closeModal('renameInstance');
});

afterEach(() => {
	cleanup();
});

// ============================================================================
// Tests: Filtering by project
// ============================================================================

describe('useSessionTabs — sessionTabs', () => {
	it('returns only sessions belonging to the active project', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'a', name: 'Agent A', projectId: 'proj-1' }),
				makeSession({ id: 'b', name: 'Agent B', projectId: 'proj-2' }),
				makeSession({ id: 'c', name: 'Agent C', projectId: 'proj-1' }),
			],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		expect(result.current.sessionTabs).toHaveLength(2);
		expect(result.current.sessionTabs[0].id).toBe('a');
		expect(result.current.sessionTabs[0].name).toBe('Agent A');
		expect(result.current.sessionTabs[1].id).toBe('c');
		expect(result.current.sessionTabs[1].name).toBe('Agent C');
	});

	it('returns empty array when no sessions match the active project', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'a', projectId: 'other-project' }),
			],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());
		expect(result.current.sessionTabs).toHaveLength(0);
	});

	it('returns empty array when there are no sessions', () => {
		useSessionStore.setState({
			sessions: [],
			activeSessionId: '',
		});

		const { result } = renderHook(() => useSessionTabs());
		expect(result.current.sessionTabs).toHaveLength(0);
	});

	it('updates when active project changes', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'a', projectId: 'proj-1' }),
				makeSession({ id: 'b', projectId: 'proj-2' }),
			],
			activeSessionId: 'a',
		});

		const { result, rerender } = renderHook(() => useSessionTabs());
		expect(result.current.sessionTabs).toHaveLength(1);
		expect(result.current.sessionTabs[0].id).toBe('a');

		// Switch project
		act(() => {
			useProjectStore.setState({ activeProjectId: 'proj-2' });
		});
		rerender();

		expect(result.current.sessionTabs).toHaveLength(1);
		expect(result.current.sessionTabs[0].id).toBe('b');
	});
});

// ============================================================================
// Tests: activeSessionTabId
// ============================================================================

describe('useSessionTabs — activeSessionTabId', () => {
	it('returns the activeSessionId from the session store', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'sess-active', projectId: 'proj-1' })],
			activeSessionId: 'sess-active',
		});

		const { result } = renderHook(() => useSessionTabs());
		expect(result.current.activeSessionTabId).toBe('sess-active');
	});
});

// ============================================================================
// Tests: handleSessionTabSelect
// ============================================================================

describe('useSessionTabs — handleSessionTabSelect', () => {
	it('sets the active session ID when selecting a tab', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'a', projectId: 'proj-1' }),
				makeSession({ id: 'b', projectId: 'proj-1' }),
			],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabSelect('b');
		});

		expect(useSessionStore.getState().activeSessionId).toBe('b');
	});
});

// ============================================================================
// Tests: handleSessionTabClose
// ============================================================================

describe('useSessionTabs — handleSessionTabClose', () => {
	it('opens delete agent confirmation for the specified session', () => {
		const sessionA = makeSession({ id: 'a', name: 'Agent A', projectId: 'proj-1' });
		useSessionStore.setState({
			sessions: [sessionA],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabClose('a');
		});

		const store = useModalStore.getState();
		expect(store.isOpen('deleteAgent')).toBe(true);
		const data = store.getData('deleteAgent') as any;
		expect(data?.session?.id).toBe('a');
	});

	it('does nothing when session is not found', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'a', projectId: 'proj-1' })],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabClose('nonexistent');
		});

		const store = useModalStore.getState();
		expect(store.isOpen('deleteAgent')).toBe(false);
	});
});

// ============================================================================
// Tests: handleSessionTabNew
// ============================================================================

describe('useSessionTabs — handleSessionTabNew', () => {
	it('opens the new instance modal', () => {
		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabNew();
		});

		expect(useModalStore.getState().isOpen('newInstance')).toBe(true);
	});
});

// ============================================================================
// Tests: handleSessionTabReorder
// ============================================================================

describe('useSessionTabs — handleSessionTabReorder', () => {
	it('reorders sessions within the active project', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'other', projectId: 'proj-2' }),
				makeSession({ id: 'a', projectId: 'proj-1' }),
				makeSession({ id: 'b', projectId: 'proj-1' }),
				makeSession({ id: 'c', projectId: 'proj-1' }),
			],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			// Move first project session (index 0 = 'a') to index 2 (after 'c')
			result.current.handleSessionTabReorder(0, 2);
		});

		const sessions = useSessionStore.getState().sessions;
		// 'other' stays at index 0 (different project)
		// Project sessions should now be: b, c, a
		const projectSessions = sessions.filter((s) => s.projectId === 'proj-1');
		expect(projectSessions[0].id).toBe('b');
		expect(projectSessions[1].id).toBe('c');
		expect(projectSessions[2].id).toBe('a');
	});

	it('ignores out of bounds indices', () => {
		useSessionStore.setState({
			sessions: [
				makeSession({ id: 'a', projectId: 'proj-1' }),
				makeSession({ id: 'b', projectId: 'proj-1' }),
			],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabReorder(-1, 0);
		});

		// Sessions should be unchanged
		const sessions = useSessionStore.getState().sessions;
		expect(sessions[0].id).toBe('a');
		expect(sessions[1].id).toBe('b');
	});
});

// ============================================================================
// Tests: handleSessionTabRename
// ============================================================================

describe('useSessionTabs — handleSessionTabRename', () => {
	it('opens rename modal with the session name', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'a', name: 'My Claude', projectId: 'proj-1' })],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabRename('a');
		});

		const store = useModalStore.getState();
		expect(store.isOpen('renameInstance')).toBe(true);
		const data = store.getData('renameInstance') as any;
		expect(data?.value).toBe('My Claude');
		expect(data?.sessionId).toBe('a');
	});

	it('does nothing for nonexistent session', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'a', name: 'Agent', projectId: 'proj-1' })],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabRename('nonexistent');
		});

		const store = useModalStore.getState();
		expect(store.isOpen('renameInstance')).toBe(false);
	});
});

// ============================================================================
// Tests: handleSessionTabStar
// ============================================================================

describe('useSessionTabs — handleSessionTabStar', () => {
	it('toggles bookmarked state on a session', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'a', bookmarked: false, projectId: 'proj-1' })],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabStar('a', true);
		});

		const session = useSessionStore.getState().sessions.find((s) => s.id === 'a');
		expect(session?.bookmarked).toBe(true);
	});

	it('can unstar a bookmarked session', () => {
		useSessionStore.setState({
			sessions: [makeSession({ id: 'a', bookmarked: true, projectId: 'proj-1' })],
			activeSessionId: 'a',
		});

		const { result } = renderHook(() => useSessionTabs());

		act(() => {
			result.current.handleSessionTabStar('a', false);
		});

		const session = useSessionStore.getState().sessions.find((s) => s.id === 'a');
		expect(session?.bookmarked).toBe(false);
	});
});
