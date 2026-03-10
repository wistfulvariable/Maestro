import { describe, it, expect, beforeEach } from 'vitest';
import {
	useInboxStore,
	selectInboxItems,
	selectInboxCount,
	selectInboxByProject,
	getInboxActions,
} from '../../../renderer/stores/inboxStore';
import type { InboxItem } from '../../../renderer/types';

function createMockInboxItem(overrides: Partial<InboxItem> = {}): InboxItem {
	return {
		id: overrides.id ?? `inbox-${Math.random().toString(36).slice(2, 8)}`,
		sessionId: overrides.sessionId ?? 'session-1',
		tabId: overrides.tabId ?? 'tab-1',
		projectId: overrides.projectId ?? 'project-1',
		reason: overrides.reason ?? 'finished',
		agentType: overrides.agentType ?? 'claude-code',
		tabName: overrides.tabName ?? 'Tab 1',
		projectName: overrides.projectName ?? 'Test Project',
		timestamp: overrides.timestamp ?? Date.now(),
		...overrides,
	};
}

describe('inboxStore', () => {
	beforeEach(() => {
		useInboxStore.setState({ items: [] });
	});

	describe('addItem', () => {
		it('should add an inbox item', () => {
			const item = createMockInboxItem({ id: 'i1' });
			useInboxStore.getState().addItem(item);
			expect(useInboxStore.getState().items).toHaveLength(1);
		});

		it('should deduplicate by sessionId + reason', () => {
			const item1 = createMockInboxItem({ id: 'i1', sessionId: 's1', reason: 'finished' });
			const item2 = createMockInboxItem({ id: 'i2', sessionId: 's1', reason: 'finished' });
			useInboxStore.getState().addItem(item1);
			useInboxStore.getState().addItem(item2);
			expect(useInboxStore.getState().items).toHaveLength(1);
		});

		it('should allow same session with different reason', () => {
			const item1 = createMockInboxItem({ id: 'i1', sessionId: 's1', reason: 'finished' });
			const item2 = createMockInboxItem({ id: 'i2', sessionId: 's1', reason: 'error' });
			useInboxStore.getState().addItem(item1);
			useInboxStore.getState().addItem(item2);
			expect(useInboxStore.getState().items).toHaveLength(2);
		});
	});

	describe('dismissItem', () => {
		it('should remove a specific item by ID', () => {
			const item = createMockInboxItem({ id: 'i1' });
			useInboxStore.setState({ items: [item] });
			useInboxStore.getState().dismissItem('i1');
			expect(useInboxStore.getState().items).toHaveLength(0);
		});

		it('should not mutate when dismissing non-existent item', () => {
			const item = createMockInboxItem({ id: 'i1' });
			useInboxStore.setState({ items: [item] });
			const before = useInboxStore.getState().items;
			useInboxStore.getState().dismissItem('nonexistent');
			expect(useInboxStore.getState().items).toBe(before);
		});
	});

	describe('dismissAllForSession', () => {
		it('should remove all items for a session', () => {
			const items = [
				createMockInboxItem({ id: 'i1', sessionId: 's1' }),
				createMockInboxItem({ id: 'i2', sessionId: 's1', reason: 'error' }),
				createMockInboxItem({ id: 'i3', sessionId: 's2' }),
			];
			useInboxStore.setState({ items });
			useInboxStore.getState().dismissAllForSession('s1');
			expect(useInboxStore.getState().items).toHaveLength(1);
			expect(useInboxStore.getState().items[0].sessionId).toBe('s2');
		});
	});

	describe('dismissAllForProject', () => {
		it('should remove all items for a project', () => {
			const items = [
				createMockInboxItem({ id: 'i1', projectId: 'p1' }),
				createMockInboxItem({ id: 'i2', projectId: 'p2' }),
			];
			useInboxStore.setState({ items });
			useInboxStore.getState().dismissAllForProject('p1');
			expect(useInboxStore.getState().items).toHaveLength(1);
			expect(useInboxStore.getState().items[0].projectId).toBe('p2');
		});
	});

	describe('clearAll', () => {
		it('should remove all items', () => {
			const items = [
				createMockInboxItem({ id: 'i1' }),
				createMockInboxItem({ id: 'i2', sessionId: 's2' }),
			];
			useInboxStore.setState({ items });
			useInboxStore.getState().clearAll();
			expect(useInboxStore.getState().items).toHaveLength(0);
		});
	});

	describe('selectors', () => {
		it('selectInboxItems returns items newest first (pre-sorted by addItem)', () => {
			// addItem prepends (newest first), so adding older then newer
			// results in newest at index 0
			const { addItem } = useInboxStore.getState();
			addItem(createMockInboxItem({ id: 'i1', timestamp: 1000 }));
			addItem(createMockInboxItem({ id: 'i2', sessionId: 's2', timestamp: 2000 }));

			const items = selectInboxItems(useInboxStore.getState());
			expect(items[0].id).toBe('i2');
			expect(items[1].id).toBe('i1');
		});

		it('selectInboxCount returns item count', () => {
			const items = [
				createMockInboxItem({ id: 'i1' }),
				createMockInboxItem({ id: 'i2', sessionId: 's2' }),
			];
			useInboxStore.setState({ items });
			expect(selectInboxCount(useInboxStore.getState())).toBe(2);
		});

		it('selectInboxByProject filters by project', () => {
			const items = [
				createMockInboxItem({ id: 'i1', projectId: 'p1' }),
				createMockInboxItem({ id: 'i2', projectId: 'p2', sessionId: 's2' }),
			];
			useInboxStore.setState({ items });
			const selector = selectInboxByProject('p1');
			expect(selector(useInboxStore.getState())).toHaveLength(1);
		});
	});
});
