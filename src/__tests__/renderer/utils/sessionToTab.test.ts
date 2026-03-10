/**
 * Tests for sessionToTab.ts — Maps Session objects to AITab objects for the TabBar.
 *
 * Functions tested:
 * - mapSessionToAITab (single session mapping)
 * - mapSessionsToTabs (batch mapping)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapSessionToAITab, mapSessionsToTabs } from '../../../renderer/utils/sessionToTab';
import type { Session, AITab } from '../../../renderer/types';

// ============================================================================
// Test helpers
// ============================================================================

/** Create a minimal Session with sensible defaults for testing. */
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
// mapSessionToAITab
// ============================================================================

describe('mapSessionToAITab', () => {
	it('maps session ID to tab id and agentSessionId', () => {
		const session = makeSession({ id: 'session-abc' });
		const tab = mapSessionToAITab(session);
		expect(tab.id).toBe('session-abc');
		expect(tab.agentSessionId).toBe('session-abc');
	});

	it('maps session name to tab name', () => {
		const session = makeSession({ name: 'Claude Code' });
		const tab = mapSessionToAITab(session);
		expect(tab.name).toBe('Claude Code');
	});

	it('maps bookmarked=true to starred=true', () => {
		const session = makeSession({ bookmarked: true });
		const tab = mapSessionToAITab(session);
		expect(tab.starred).toBe(true);
	});

	it('maps bookmarked=false to starred=false', () => {
		const session = makeSession({ bookmarked: false });
		const tab = mapSessionToAITab(session);
		expect(tab.starred).toBe(false);
	});

	it('defaults starred to false when bookmarked is undefined', () => {
		const session = makeSession();
		delete (session as any).bookmarked;
		const tab = mapSessionToAITab(session);
		expect(tab.starred).toBe(false);
	});

	it('maps session state "busy" to tab state "busy"', () => {
		const session = makeSession({ state: 'busy' });
		const tab = mapSessionToAITab(session);
		expect(tab.state).toBe('busy');
	});

	it('maps session state "idle" to tab state "idle"', () => {
		const session = makeSession({ state: 'idle' });
		const tab = mapSessionToAITab(session);
		expect(tab.state).toBe('idle');
	});

	it('maps session state "waiting_input" to tab state "idle"', () => {
		const session = makeSession({ state: 'waiting_input' });
		const tab = mapSessionToAITab(session);
		expect(tab.state).toBe('idle');
	});

	it('maps session state "error" to tab state "idle"', () => {
		const session = makeSession({ state: 'error' });
		const tab = mapSessionToAITab(session);
		expect(tab.state).toBe('idle');
	});

	it('maps session state "connecting" to isGeneratingName=true', () => {
		const session = makeSession({ state: 'connecting' });
		const tab = mapSessionToAITab(session);
		expect(tab.isGeneratingName).toBe(true);
	});

	it('sets isGeneratingName=false for non-connecting states', () => {
		const session = makeSession({ state: 'idle' });
		const tab = mapSessionToAITab(session);
		expect(tab.isGeneratingName).toBe(false);
	});

	it('aggregates hasUnread from all AI tabs — true if any tab has unread', () => {
		const session = makeSession({
			aiTabs: [
				{ id: 't1', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 1000, state: 'idle', hasUnread: false },
				{ id: 't2', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 2000, state: 'idle', hasUnread: true },
			],
			activeTabId: 't1',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.hasUnread).toBe(true);
	});

	it('aggregates hasUnread from all AI tabs — false if no tab has unread', () => {
		const session = makeSession({
			aiTabs: [
				{ id: 't1', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 1000, state: 'idle', hasUnread: false },
				{ id: 't2', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 2000, state: 'idle', hasUnread: false },
			],
			activeTabId: 't1',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.hasUnread).toBe(false);
	});

	it('uses logs from the active AI tab', () => {
		const activeTabLogs = [
			{ id: 'log-1', timestamp: 1000, source: 'user' as const, text: 'hello' },
		];
		const session = makeSession({
			aiTabs: [
				{ id: 't1', agentSessionId: null, name: null, starred: false, logs: activeTabLogs, inputValue: '', stagedImages: [], createdAt: 1000, state: 'idle' },
				{ id: 't2', agentSessionId: null, name: null, starred: false, logs: [{ id: 'log-2', timestamp: 2000, source: 'ai' as const, text: 'other' }], inputValue: '', stagedImages: [], createdAt: 2000, state: 'idle' },
			],
			activeTabId: 't1',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.logs).toBe(activeTabLogs);
	});

	it('uses usageStats from the active AI tab', () => {
		const usageStats = { inputTokens: 100, outputTokens: 50, totalCost: 0.5 };
		const session = makeSession({
			aiTabs: [
				{ id: 't1', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 1000, state: 'idle', usageStats },
			],
			activeTabId: 't1',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.usageStats).toBe(usageStats);
	});

	it('uses agentError from the active AI tab', () => {
		const agentError = { message: 'Process crashed', code: 'CRASH' };
		const session = makeSession({
			aiTabs: [
				{ id: 't1', agentSessionId: null, name: null, starred: false, logs: [], inputValue: '', stagedImages: [], createdAt: 1000, state: 'idle', agentError: agentError as any },
			],
			activeTabId: 't1',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.agentError).toBe(agentError);
	});

	it('sets inputValue to empty string (not used at session level)', () => {
		const session = makeSession();
		const tab = mapSessionToAITab(session);
		expect(tab.inputValue).toBe('');
	});

	it('sets stagedImages to empty array (not used at session level)', () => {
		const session = makeSession();
		const tab = mapSessionToAITab(session);
		expect(tab.stagedImages).toEqual([]);
	});

	it('falls back to empty logs when no active tab exists', () => {
		const session = makeSession({
			aiTabs: [],
			activeTabId: 'nonexistent',
		});
		const tab = mapSessionToAITab(session);
		expect(tab.logs).toEqual([]);
	});
});

// ============================================================================
// mapSessionsToTabs
// ============================================================================

describe('mapSessionsToTabs', () => {
	it('returns empty array for empty sessions', () => {
		expect(mapSessionsToTabs([])).toEqual([]);
	});

	it('maps each session to a tab preserving order', () => {
		const sessions = [
			makeSession({ id: 'sess-a', name: 'Agent A' }),
			makeSession({ id: 'sess-b', name: 'Agent B' }),
			makeSession({ id: 'sess-c', name: 'Agent C' }),
		];
		const tabs = mapSessionsToTabs(sessions);
		expect(tabs).toHaveLength(3);
		expect(tabs[0].id).toBe('sess-a');
		expect(tabs[0].name).toBe('Agent A');
		expect(tabs[1].id).toBe('sess-b');
		expect(tabs[1].name).toBe('Agent B');
		expect(tabs[2].id).toBe('sess-c');
		expect(tabs[2].name).toBe('Agent C');
	});

	it('correctly maps mixed states across sessions', () => {
		const sessions = [
			makeSession({ id: 'sess-idle', state: 'idle' }),
			makeSession({ id: 'sess-busy', state: 'busy' }),
			makeSession({ id: 'sess-connecting', state: 'connecting' }),
		];
		const tabs = mapSessionsToTabs(sessions);
		expect(tabs[0].state).toBe('idle');
		expect(tabs[0].isGeneratingName).toBe(false);
		expect(tabs[1].state).toBe('busy');
		expect(tabs[1].isGeneratingName).toBe(false);
		expect(tabs[2].state).toBe('idle');
		expect(tabs[2].isGeneratingName).toBe(true);
	});
});
