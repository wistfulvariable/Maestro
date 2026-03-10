/**
 * sessionToTab — Maps Session objects to AITab objects for the TabBar.
 *
 * This mapping layer allows the existing TabBar component (designed for AITab[])
 * to render session-level tabs without any changes to TabBar itself.
 * Each session in the active project becomes one tab in the tab bar.
 */

import type { Session, AITab } from '../types';
import { getActiveTab } from './tabHelpers';

/**
 * Map a single Session to an AITab-compatible object.
 * The TabBar renders these exactly like AI tabs — same visual indicators,
 * same hover overlay structure, same drag/drop behavior.
 */
export function mapSessionToAITab(session: Session): AITab {
	const activeTab = getActiveTab(session);

	return {
		id: session.id,
		agentSessionId: session.id,
		name: session.name,
		starred: session.bookmarked ?? false,
		logs: activeTab?.logs ?? [],
		inputValue: '',
		stagedImages: [],
		usageStats: activeTab?.usageStats,
		createdAt: activeTab?.createdAt ?? Date.now(),
		state: session.state === 'busy' ? 'busy' : 'idle',
		hasUnread: session.aiTabs?.some((t) => t.hasUnread) ?? false,
		isGeneratingName: session.state === 'connecting',
		agentError: activeTab?.agentError,
	};
}

/**
 * Map an array of Sessions to AITab[] for the TabBar.
 * Typically called with sessions filtered to the active project.
 */
export function mapSessionsToTabs(sessions: Session[]): AITab[] {
	return sessions.map(mapSessionToAITab);
}
