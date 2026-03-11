/**
 * Tests for SessionSidebar — Column 2 of the left sidebar.
 *
 * Covers:
 * - Header rendering ("Sessions" label)
 * - "+" button calls onNewSession
 * - Session list rendering
 * - Empty state when no sessions
 * - Active session marking
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionSidebar } from '../../../../renderer/components/SessionSidebar/SessionSidebar';
import type { Session, AITab } from '../../../../renderer/types';
import type { Theme } from '../../../../renderer/constants/themes';

// ============================================================================
// Test helpers
// ============================================================================

function makeTheme(): Theme {
	return {
		id: 'test-theme',
		name: 'Test Theme',
		colors: {
			bgMain: '#1a1a1a',
			bgSidebar: '#111111',
			bgActivity: '#2a2a2a',
			textMain: '#ffffff',
			textDim: '#888888',
			accent: '#3b82f6',
			accentForeground: '#ffffff',
			success: '#22c55e',
			warning: '#eab308',
			error: '#ef4444',
			border: '#333333',
		},
	} as Theme;
}

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
		id: `sess-${Math.random().toString(36).slice(2, 8)}`,
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
// Tests
// ============================================================================

describe('SessionSidebar', () => {
	const theme = makeTheme();

	it('renders "Sessions" header', () => {
		render(
			<SessionSidebar
				theme={theme}
				sessions={[]}
				activeSessionId=""
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		expect(screen.getByText('Sessions')).toBeDefined();
	});

	it('renders "+" button that calls onNewSession', () => {
		const handleNew = vi.fn();
		render(
			<SessionSidebar
				theme={theme}
				sessions={[]}
				activeSessionId=""
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={handleNew}
			/>
		);
		fireEvent.click(screen.getByTitle('New Session'));
		expect(handleNew).toHaveBeenCalledOnce();
	});

	it('shows empty state when sessions array is empty', () => {
		render(
			<SessionSidebar
				theme={theme}
				sessions={[]}
				activeSessionId=""
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		expect(screen.getByText(/No sessions yet/)).toBeDefined();
	});

	it('renders session items for each session', () => {
		const sessions = [
			makeSession({ id: 's1', name: 'Session Alpha' }),
			makeSession({ id: 's2', name: 'Session Beta' }),
			makeSession({ id: 's3', name: 'Session Gamma' }),
		];
		render(
			<SessionSidebar
				theme={theme}
				sessions={sessions}
				activeSessionId="s1"
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		expect(screen.getByText('Session Alpha')).toBeDefined();
		expect(screen.getByText('Session Beta')).toBeDefined();
		expect(screen.getByText('Session Gamma')).toBeDefined();
	});

	it('does not show empty state when sessions exist', () => {
		const sessions = [makeSession({ name: 'Test' })];
		render(
			<SessionSidebar
				theme={theme}
				sessions={sessions}
				activeSessionId=""
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		expect(screen.queryByText(/No sessions yet/)).toBeNull();
	});

	it('passes onSessionSelect through to SessionItem', () => {
		const handleSelect = vi.fn();
		const sessions = [makeSession({ id: 'sess-click', name: 'Clickable' })];
		render(
			<SessionSidebar
				theme={theme}
				sessions={sessions}
				activeSessionId=""
				onSessionSelect={handleSelect}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		fireEvent.click(screen.getByText('Clickable'));
		expect(handleSelect).toHaveBeenCalledWith('sess-click');
	});

	it('marks the active session correctly', () => {
		const sessions = [
			makeSession({ id: 'active-sess', name: 'Active One' }),
			makeSession({ id: 'other-sess', name: 'Other One' }),
		];
		const { container } = render(
			<SessionSidebar
				theme={theme}
				sessions={sessions}
				activeSessionId="active-sess"
				onSessionSelect={vi.fn()}
				onSessionClose={vi.fn()}
				onNewSession={vi.fn()}
			/>
		);
		// The active session's row should have a non-transparent background
		// (accent color with alpha, converted to rgba by the DOM)
		const activeText = screen.getByText('Active One');
		const otherText = screen.getByText('Other One');

		// Walk up to find the clickable row containers
		// The SessionItem root div has the backgroundColor style
		const findRowDiv = (el: HTMLElement): HTMLElement | null => {
			let current: HTMLElement | null = el;
			while (current) {
				if (current.style?.backgroundColor && current.style.backgroundColor !== '') {
					return current;
				}
				current = current.parentElement;
			}
			return null;
		};

		const activeRow = findRowDiv(activeText);
		const otherRow = findRowDiv(otherText);

		// Active row should have a non-transparent background
		expect(activeRow).toBeTruthy();
		expect(activeRow!.style.backgroundColor).not.toBe('transparent');

		// Inactive row should be transparent
		expect(otherRow).toBeTruthy();
		expect(otherRow!.style.backgroundColor).toBe('transparent');
	});
});
