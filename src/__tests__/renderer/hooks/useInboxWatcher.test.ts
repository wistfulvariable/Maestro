/**
 * Tests for useInboxWatcher hook
 *
 * Tests the pure shouldCreateInboxItem function and the hook's
 * Zustand subscription behavior for creating inbox items on
 * session state transitions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock generateId for deterministic IDs
let idCounter = 0;
vi.mock('../../../renderer/utils/ids', () => ({
	generateId: vi.fn(() => `inbox-id-${++idCounter}`),
}));

import { shouldCreateInboxItem, useInboxWatcher } from '../../../renderer/hooks/useInboxWatcher';
import { useSessionStore } from '../../../renderer/stores/sessionStore';
import { useInboxStore } from '../../../renderer/stores/inboxStore';
import { useProjectStore } from '../../../renderer/stores/projectStore';
import type { Session } from '../../../renderer/types';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockSession(overrides: Partial<Session> = {}): Session {
	return {
		id: 'session-1',
		name: 'Test Agent',
		cwd: '/projects/test',
		fullPath: '/projects/test',
		projectRoot: '/projects/test',
		toolType: 'claude-code' as any,
		inputMode: 'ai' as any,
		state: 'idle' as any,
		projectId: 'project-1',
		aiTabs: [
			{
				id: 'tab-1',
				agentSessionId: null,
				name: 'Main Tab',
				state: 'idle' as const,
				logs: [],
				starred: false,
				inputValue: '',
				stagedImages: [],
				createdAt: Date.now(),
			},
		],
		activeTabId: 'tab-1',
		aiLogs: [],
		shellLogs: [],
		workLog: [],
		contextUsage: 0,
		aiPid: 0,
		terminalPid: 0,
		port: 0,
		isLive: false,
		changedFiles: [],
		isGitRepo: false,
		fileTree: [],
		fileExplorerExpanded: [],
		fileExplorerScrollPos: 0,
		executionQueue: [],
		activeTimeMs: 0,
		filePreviewTabs: [],
		activeFileTabId: null,
		unifiedTabOrder: [{ type: 'ai' as const, id: 'tab-1' }],
		unifiedClosedTabHistory: [],
		closedTabHistory: [],
		...overrides,
	} as Session;
}

// ============================================================================
// shouldCreateInboxItem (pure function)
// ============================================================================

describe('shouldCreateInboxItem', () => {
	it('returns "finished" when transitioning busy -> idle for non-active session', () => {
		const result = shouldCreateInboxItem('busy', 'idle', 'session-1', 'session-2');
		expect(result).toBe('finished');
	});

	it('returns "error" when transitioning busy -> error for non-active session', () => {
		const result = shouldCreateInboxItem('busy', 'error', 'session-1', 'session-2');
		expect(result).toBe('error');
	});

	it('returns "waiting_input" when transitioning busy -> waiting_input', () => {
		const result = shouldCreateInboxItem('busy', 'waiting_input', 'session-1', 'session-2');
		expect(result).toBe('waiting_input');
	});

	it('returns "waiting_input" when transitioning idle -> waiting_input', () => {
		const result = shouldCreateInboxItem('idle', 'waiting_input', 'session-1', 'session-2');
		expect(result).toBe('waiting_input');
	});

	it('returns "waiting_input" when transitioning connecting -> waiting_input', () => {
		const result = shouldCreateInboxItem('connecting', 'waiting_input', 'session-1', 'session-2');
		expect(result).toBe('waiting_input');
	});

	it('returns "waiting_input" when transitioning error -> waiting_input', () => {
		const result = shouldCreateInboxItem('error', 'waiting_input', 'session-1', 'session-2');
		expect(result).toBe('waiting_input');
	});

	it('returns null for active session (user is looking at it)', () => {
		const result = shouldCreateInboxItem('busy', 'idle', 'session-1', 'session-1');
		expect(result).toBeNull();
	});

	it('returns null when active session transitions busy -> error', () => {
		const result = shouldCreateInboxItem('busy', 'error', 'session-1', 'session-1');
		expect(result).toBeNull();
	});

	it('returns null when active session transitions to waiting_input', () => {
		const result = shouldCreateInboxItem('busy', 'waiting_input', 'session-1', 'session-1');
		expect(result).toBeNull();
	});

	it('returns null for idle -> busy (not a completion transition)', () => {
		expect(shouldCreateInboxItem('idle', 'busy', 's1', 's2')).toBeNull();
	});

	it('returns null for idle -> connecting', () => {
		expect(shouldCreateInboxItem('idle', 'connecting', 's1', 's2')).toBeNull();
	});

	it('returns null for connecting -> busy', () => {
		expect(shouldCreateInboxItem('connecting', 'busy', 's1', 's2')).toBeNull();
	});

	it('returns null for same state (no transition)', () => {
		expect(shouldCreateInboxItem('idle', 'idle', 's1', 's2')).toBeNull();
		expect(shouldCreateInboxItem('busy', 'busy', 's1', 's2')).toBeNull();
		expect(shouldCreateInboxItem('error', 'error', 's1', 's2')).toBeNull();
	});

	it('returns null when waiting_input stays waiting_input (no-op)', () => {
		expect(shouldCreateInboxItem('waiting_input', 'waiting_input', 's1', 's2')).toBeNull();
	});

	it('returns null for idle -> error (not from busy)', () => {
		expect(shouldCreateInboxItem('idle', 'error', 's1', 's2')).toBeNull();
	});

	it('returns null for connecting -> idle (not from busy)', () => {
		expect(shouldCreateInboxItem('connecting', 'idle', 's1', 's2')).toBeNull();
	});

	it('returns null for error -> idle (not from busy)', () => {
		expect(shouldCreateInboxItem('error', 'idle', 's1', 's2')).toBeNull();
	});
});

// ============================================================================
// useInboxWatcher hook (integration with stores)
// ============================================================================

describe('useInboxWatcher hook', () => {
	beforeEach(() => {
		idCounter = 0;
		// Reset stores to clean state
		useSessionStore.setState({
			sessions: [],
			activeSessionId: '',
			sessionsLoaded: false,
			initialLoadComplete: false,
		});
		useInboxStore.setState({ items: [] });
		useProjectStore.setState({
			projects: [{ id: 'project-1', name: 'Test Project', repoPath: '/test', createdAt: 1 }],
			activeProjectId: 'project-1',
		});
	});

	it('creates inbox item when non-active session transitions busy -> idle', () => {
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2', // different session is active
		});

		renderHook(() => useInboxWatcher());

		// Simulate state transition: busy -> idle
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({
			id: 'inbox-id-1',
			reason: 'finished',
			sessionId: 's1',
			tabId: 'tab-1',
			projectId: 'project-1',
			agentType: 'claude-code',
			projectName: 'Test Project',
			tabName: 'Main Tab',
		});
		expect(items[0].timestamp).toBeGreaterThan(0);
	});

	it('creates inbox item when non-active session transitions busy -> error', () => {
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'error' as any })],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0].reason).toBe('error');
		expect(items[0].sessionId).toBe('s1');
	});

	it('creates inbox item when non-active session transitions to waiting_input', () => {
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'waiting_input' as any })],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0].reason).toBe('waiting_input');
	});

	it('does NOT create inbox item for the active session', () => {
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's1', // same session is active
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's1',
			});
		});

		expect(useInboxStore.getState().items).toHaveLength(0);
	});

	it('does NOT create inbox item for non-triggering transitions', () => {
		const session = createMockSession({ id: 's1', state: 'idle' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		// idle -> busy is not a trigger
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'busy' as any })],
				activeSessionId: 's2',
			});
		});

		expect(useInboxStore.getState().items).toHaveLength(0);
	});

	it('handles multiple sessions with different transitions simultaneously', () => {
		const sessions = [
			createMockSession({ id: 's1', state: 'busy' as any }),
			createMockSession({ id: 's2', state: 'busy' as any, name: 'Agent 2' }),
			createMockSession({ id: 's3', state: 'idle' as any, name: 'Agent 3' }),
		];
		useSessionStore.setState({
			sessions,
			activeSessionId: 's3', // s3 is active
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [
					createMockSession({ id: 's1', state: 'idle' as any }), // busy -> idle = finished
					createMockSession({ id: 's2', state: 'error' as any, name: 'Agent 2' }), // busy -> error = error
					createMockSession({ id: 's3', state: 'busy' as any, name: 'Agent 3' }), // idle -> busy = no trigger (also active)
				],
				activeSessionId: 's3',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(2);
		// Items are stored newest-first by inboxStore
		const reasons = items.map((i) => i.reason).sort();
		expect(reasons).toEqual(['error', 'finished']);
	});

	it('uses session name when tab has no name', () => {
		const session = createMockSession({
			id: 's1',
			name: 'My Agent',
			state: 'busy' as any,
			aiTabs: [
				{
					id: 'tab-1',
					agentSessionId: null,
					name: null,
					state: 'idle' as const,
					logs: [],
					starred: false,
					inputValue: '',
					stagedImages: [],
					createdAt: Date.now(),
				},
			],
		});
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [
					createMockSession({
						id: 's1',
						name: 'My Agent',
						state: 'idle' as any,
						aiTabs: [
							{
								id: 'tab-1',
								agentSessionId: null,
								name: null,
								state: 'idle' as const,
								logs: [],
								starred: false,
								inputValue: '',
								stagedImages: [],
								createdAt: Date.now(),
							},
						],
					}),
				],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0].tabName).toBe('My Agent'); // Falls back to session name
	});

	it('uses "Unknown" when project is not found', () => {
		const session = createMockSession({
			id: 's1',
			state: 'busy' as any,
			projectId: 'nonexistent-project',
		});
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [
					createMockSession({
						id: 's1',
						state: 'idle' as any,
						projectId: 'nonexistent-project',
					}),
				],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0].projectName).toBe('Unknown');
	});

	it('uses empty string for projectId when session has no projectId', () => {
		const session = createMockSession({
			id: 's1',
			state: 'busy' as any,
			projectId: undefined,
		});
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		act(() => {
			useSessionStore.setState({
				sessions: [
					createMockSession({
						id: 's1',
						state: 'idle' as any,
						projectId: undefined,
					}),
				],
				activeSessionId: 's2',
			});
		});

		const items = useInboxStore.getState().items;
		expect(items).toHaveLength(1);
		expect(items[0].projectId).toBe('');
	});

	it('ignores newly added sessions (no previous state to compare)', () => {
		useSessionStore.setState({
			sessions: [],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		// Add a brand new session that is already idle
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's2',
			});
		});

		expect(useInboxStore.getState().items).toHaveLength(0);
	});

	it('unsubscribes on unmount', () => {
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		const { unmount } = renderHook(() => useInboxWatcher());
		unmount();

		// After unmount, state changes should not create inbox items
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's2',
			});
		});

		expect(useInboxStore.getState().items).toHaveLength(0);
	});

	it('does not create duplicate items for same session+reason', () => {
		// The inboxStore.addItem already deduplicates, but let's verify end-to-end
		const session = createMockSession({ id: 's1', state: 'busy' as any });
		useSessionStore.setState({
			sessions: [session],
			activeSessionId: 's2',
		});

		renderHook(() => useInboxWatcher());

		// First transition: busy -> idle
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's2',
			});
		});

		expect(useInboxStore.getState().items).toHaveLength(1);

		// Go back to busy and then idle again
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'busy' as any })],
				activeSessionId: 's2',
			});
		});
		act(() => {
			useSessionStore.setState({
				sessions: [createMockSession({ id: 's1', state: 'idle' as any })],
				activeSessionId: 's2',
			});
		});

		// Should still be 1 due to inboxStore deduplication (same session+reason)
		expect(useInboxStore.getState().items).toHaveLength(1);
	});
});
