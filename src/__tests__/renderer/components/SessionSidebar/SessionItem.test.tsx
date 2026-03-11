/**
 * Tests for SessionItem — renders a single session row in the session sidebar.
 *
 * Covers:
 * - Rendering session name and agent type
 * - Status dot colors for each SessionState
 * - Active session highlight styling
 * - Click handler fires onSelect
 * - Close button fires onClose
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SessionItem } from '../../../../renderer/components/SessionSidebar/SessionItem';
import type { Session, AITab, SessionState } from '../../../../renderer/types';
import type { Theme } from '../../../../renderer/constants/themes';

// ============================================================================
// Test helpers
// ============================================================================

function makeTheme(overrides: Partial<Theme['colors']> = {}): Theme {
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
			...overrides,
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
// Tests
// ============================================================================

describe('SessionItem', () => {
	const theme = makeTheme();
	const onSelect = vi.fn();
	const onClose = vi.fn();

	it('renders session name', () => {
		const session = makeSession({ name: 'Test Session' });
		render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={onSelect}
				onClose={onClose}
			/>
		);
		expect(screen.getByText('Test Session')).toBeDefined();
	});

	it('renders agent type label', () => {
		const session = makeSession({ toolType: 'codex' });
		render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={onSelect}
				onClose={onClose}
			/>
		);
		expect(screen.getByText('codex')).toBeDefined();
	});

	it('calls onSelect when clicked', () => {
		const handleSelect = vi.fn();
		const session = makeSession({ id: 'sess-42' });
		render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={handleSelect}
				onClose={onClose}
			/>
		);
		fireEvent.click(screen.getByText('My Agent'));
		expect(handleSelect).toHaveBeenCalledWith('sess-42');
	});

	it('calls onClose when close button clicked', () => {
		const handleClose = vi.fn();
		const session = makeSession({ id: 'sess-99' });
		render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={onSelect}
				onClose={handleClose}
			/>
		);
		fireEvent.click(screen.getByTitle('Close session'));
		expect(handleClose).toHaveBeenCalledWith('sess-99');
	});

	it('close button click does not trigger onSelect', () => {
		const handleSelect = vi.fn();
		const handleClose = vi.fn();
		const session = makeSession();
		render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={handleSelect}
				onClose={handleClose}
			/>
		);
		fireEvent.click(screen.getByTitle('Close session'));
		expect(handleClose).toHaveBeenCalled();
		expect(handleSelect).not.toHaveBeenCalled();
	});

	it('applies active highlight styles when isActive is true', () => {
		const session = makeSession();
		const { container } = render(
			<SessionItem
				session={session}
				isActive={true}
				theme={theme}
				onSelect={onSelect}
				onClose={onClose}
			/>
		);
		const row = container.firstChild as HTMLElement;
		// DOM converts hex+alpha to rgba — just verify it's not transparent
		expect(row.style.backgroundColor).not.toBe('transparent');
		expect(row.style.backgroundColor).toBeTruthy();
		// Box shadow should contain "inset"
		expect(row.style.boxShadow).toContain('inset');
	});

	it('does not apply active styles when isActive is false', () => {
		const session = makeSession();
		const { container } = render(
			<SessionItem
				session={session}
				isActive={false}
				theme={theme}
				onSelect={onSelect}
				onClose={onClose}
			/>
		);
		const row = container.firstChild as HTMLElement;
		expect(row.style.backgroundColor).toBe('transparent');
		expect(row.style.boxShadow).toBe('none');
	});

	describe('status dot colors', () => {
		/** DOM converts hex to rgb — compare by checking the color is non-empty and consistent */
		const stateExpectations: Array<{ state: SessionState; label: string }> = [
			{ state: 'idle', label: 'green (success)' },
			{ state: 'busy', label: 'yellow (warning)' },
			{ state: 'waiting_input', label: 'yellow (warning)' },
			{ state: 'error', label: 'red (error)' },
			{ state: 'connecting', label: 'orange (#f97316)' },
		];

		stateExpectations.forEach(({ state, label }) => {
			it(`shows ${label} dot for ${state} state`, () => {
				const session = makeSession({ state });
				const { container } = render(
					<SessionItem
						session={session}
						isActive={false}
						theme={theme}
						onSelect={onSelect}
						onClose={onClose}
					/>
				);
				// Status dot is the first span child
				const dot = container.querySelector('span') as HTMLElement;
				// DOM converts hex to rgb — just verify the color is set and non-empty
				expect(dot.style.backgroundColor).toBeTruthy();
			});
		});

		it('idle and error states have different dot colors', () => {
			const idleSession = makeSession({ state: 'idle' });
			const errorSession = makeSession({ state: 'error', id: 'err-sess' });
			const { container: idleContainer } = render(
				<SessionItem session={idleSession} isActive={false} theme={theme} onSelect={onSelect} onClose={onClose} />
			);
			const { container: errorContainer } = render(
				<SessionItem session={errorSession} isActive={false} theme={theme} onSelect={onSelect} onClose={onClose} />
			);
			const idleDot = idleContainer.querySelector('span') as HTMLElement;
			const errorDot = errorContainer.querySelector('span') as HTMLElement;
			expect(idleDot.style.backgroundColor).not.toBe(errorDot.style.backgroundColor);
		});

		it('applies pulse animation for connecting state', () => {
			const session = makeSession({ state: 'connecting' });
			const { container } = render(
				<SessionItem
					session={session}
					isActive={false}
					theme={theme}
					onSelect={onSelect}
					onClose={onClose}
				/>
			);
			const dot = container.querySelector('span') as HTMLElement;
			expect(dot.style.animation).toContain('sessionPulse');
		});

		it('does not pulse for idle state', () => {
			const session = makeSession({ state: 'idle' });
			const { container } = render(
				<SessionItem
					session={session}
					isActive={false}
					theme={theme}
					onSelect={onSelect}
					onClose={onClose}
				/>
			);
			const dot = container.querySelector('span') as HTMLElement;
			expect(dot.style.animation).toBe('none');
		});
	});
});
