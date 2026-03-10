/**
 * InboxItem - A single attention item in the inbox sidebar section.
 * Shows reason icon (colored dot), tab name, project name, and relative time.
 * Click navigates to the project + session and auto-dismisses.
 */

import React, { useCallback, useMemo } from 'react';
import type { InboxItem as InboxItemType } from '../../types';
import type { Theme } from '../../constants/themes';

interface InboxItemProps {
	item: InboxItemType;
	theme: Theme;
	onNavigate: (item: InboxItemType) => void;
}

const REASON_CONFIG = {
	finished: { icon: '\u25CF', color: '#22c55e', label: 'Finished' },
	error: { icon: '\u25CF', color: '#ef4444', label: 'Error' },
	waiting_input: { icon: '\u25CF', color: '#eab308', label: 'Waiting' },
} as const;

function formatRelativeTime(timestamp: number): string {
	const diff = Date.now() - timestamp;
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

export const InboxItemComponent = React.memo(function InboxItemComponent({
	item,
	theme,
	onNavigate,
}: InboxItemProps) {
	const config = REASON_CONFIG[item.reason];

	const handleClick = useCallback(() => {
		onNavigate(item);
	}, [item, onNavigate]);

	const timeAgo = useMemo(() => formatRelativeTime(item.timestamp), [item.timestamp]);

	return (
		<div
			onClick={handleClick}
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '6px 12px',
				cursor: 'pointer',
				borderRadius: 4,
				gap: 8,
				minHeight: 36,
				backgroundColor: 'transparent',
				transition: 'background-color 0.1s',
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.backgroundColor = theme.colors.bgActivity;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.backgroundColor = 'transparent';
			}}
		>
			<span style={{ color: config.color, fontSize: 10, flexShrink: 0 }}>{config.icon}</span>
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						color: theme.colors.textMain,
						fontSize: 12,
						fontWeight: 500,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{item.tabName}
				</div>
				<div
					style={{
						color: theme.colors.textDim,
						fontSize: 10,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{item.projectName} &middot; {timeAgo}
				</div>
			</div>
		</div>
	);
});
