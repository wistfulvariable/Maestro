/**
 * useInboxWatcher - Watches session state transitions and creates inbox items.
 *
 * Triggers:
 * - busy -> idle: "finished"
 * - busy -> error: "error"
 * - * -> waiting_input: "waiting_input"
 *
 * Only for sessions the user is NOT currently looking at.
 */

import { useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { useProjectStore } from '../stores/projectStore';
import { useInboxStore } from '../stores/inboxStore';
import { generateId } from '../utils/ids';
import type { InboxReason } from '../types';

/**
 * Pure function to determine if a state transition should create an inbox item.
 * Exported for testing.
 */
export function shouldCreateInboxItem(
	prevState: string,
	newState: string,
	sessionId: string,
	activeSessionId: string
): InboxReason | null {
	// Don't create items for the session the user is currently viewing
	if (sessionId === activeSessionId) return null;

	// busy -> idle = finished
	if (prevState === 'busy' && newState === 'idle') return 'finished';

	// busy -> error = error
	if (prevState === 'busy' && newState === 'error') return 'error';

	// * -> waiting_input = waiting
	if (newState === 'waiting_input' && prevState !== 'waiting_input') return 'waiting_input';

	return null;
}

export function useInboxWatcher() {
	useEffect(() => {
		// Subscribe to session store changes
		const unsubscribe = useSessionStore.subscribe((state, prevState) => {
			const activeSessionId = state.activeSessionId;
			const { addItem } = useInboxStore.getState();

			for (const session of state.sessions) {
				const prevSession = prevState.sessions.find((s) => s.id === session.id);
				if (!prevSession) continue;

				const prevSessionState = prevSession.state;
				const newSessionState = session.state;

				if (prevSessionState === newSessionState) continue;

				const reason = shouldCreateInboxItem(
					prevSessionState,
					newSessionState,
					session.id,
					activeSessionId
				);

				if (reason) {
					const project = useProjectStore
						.getState()
						.projects.find((p) => p.id === session.projectId);
					const activeTab = session.aiTabs.find((t) => t.id === session.activeTabId);

					addItem({
						id: generateId(),
						sessionId: session.id,
						tabId: session.activeTabId,
						projectId: session.projectId || '',
						reason,
						agentType: session.toolType,
						tabName: activeTab?.name || session.name,
						projectName: project?.name || 'Unknown',
						timestamp: Date.now(),
					});
				}
			}
		});

		return unsubscribe;
	}, []);
}
