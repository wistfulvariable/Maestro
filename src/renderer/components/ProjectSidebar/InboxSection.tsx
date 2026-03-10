/**
 * InboxSection - Collapsible section at the top of the left sidebar.
 * Shows inbox items with count badge and clear button.
 * Hides entirely when there are no inbox items.
 */

import React, { useCallback, useState } from 'react';
import { useInboxStore, selectInboxItems, selectInboxCount } from '../../stores/inboxStore';
import { InboxItemComponent } from './InboxItem';
import type { InboxItem } from '../../types';
import type { Theme } from '../../constants/themes';

interface InboxSectionProps {
	theme: Theme;
	onNavigateToItem: (item: InboxItem) => void;
}

export const InboxSection = React.memo(function InboxSection({
	theme,
	onNavigateToItem,
}: InboxSectionProps) {
	const items = useInboxStore(selectInboxItems);
	const count = useInboxStore(selectInboxCount);
	const clearAll = useInboxStore((s) => s.clearAll);
	const [collapsed, setCollapsed] = useState(false);

	const handleClear = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			clearAll();
		},
		[clearAll]
	);

	const toggleCollapsed = useCallback(() => {
		setCollapsed((prev) => !prev);
	}, []);

	if (count === 0) return null;

	return (
		<div style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
			{/* Header */}
			<div
				onClick={toggleCollapsed}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '8px 12px',
					cursor: 'pointer',
					userSelect: 'none',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
					<span
						style={{
							color: theme.colors.textDim,
							fontSize: 10,
							transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
							transition: 'transform 0.15s',
							display: 'inline-block',
						}}
					>
						&#9660;
					</span>
					<span
						style={{
							color: theme.colors.textDim,
							fontSize: 11,
							fontWeight: 600,
							textTransform: 'uppercase',
							letterSpacing: '0.05em',
						}}
					>
						Inbox
					</span>
					<span
						style={{
							backgroundColor: theme.colors.accent,
							color: theme.colors.accentForeground,
							fontSize: 10,
							fontWeight: 700,
							borderRadius: 8,
							padding: '1px 6px',
							minWidth: 16,
							textAlign: 'center',
						}}
					>
						{count}
					</span>
				</div>
				<button
					onClick={handleClear}
					style={{
						background: 'none',
						border: 'none',
						color: theme.colors.textDim,
						fontSize: 10,
						cursor: 'pointer',
						padding: '2px 6px',
						borderRadius: 3,
					}}
				>
					Clear
				</button>
			</div>

			{/* Items */}
			{!collapsed && (
				<div style={{ paddingBottom: 4 }}>
					{items.map((item) => (
						<InboxItemComponent
							key={item.id}
							item={item}
							theme={theme}
							onNavigate={onNavigateToItem}
						/>
					))}
				</div>
			)}
		</div>
	);
});
