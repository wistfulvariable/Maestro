/**
 * SessionItem - A single session row in the session sidebar (Column 2).
 * Shows status dot (colored by session state), session name, and agent type badge.
 */

import React, { useCallback } from 'react';
import type { Session, SessionState } from '../../types';
import type { Theme } from '../../constants/themes';

interface SessionItemProps {
	session: Session;
	isActive: boolean;
	theme: Theme;
	onSelect: (sessionId: string) => void;
	onClose: (sessionId: string) => void;
}

function getStateColor(state: SessionState, theme: Theme): string {
	switch (state) {
		case 'idle':
			return theme.colors.success;
		case 'busy':
			return theme.colors.warning;
		case 'waiting_input':
			return theme.colors.warning;
		case 'connecting':
			return '#f97316'; // orange
		case 'error':
			return theme.colors.error;
		default:
			return theme.colors.textDim;
	}
}

export const SessionItem = React.memo(function SessionItem({
	session,
	isActive,
	theme,
	onSelect,
	onClose,
}: SessionItemProps) {
	const handleClick = useCallback(() => {
		onSelect(session.id);
	}, [session.id, onSelect]);

	const handleClose = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onClose(session.id);
		},
		[session.id, onClose]
	);

	const stateColor = getStateColor(session.state, theme);
	const isPulsing = session.state === 'connecting';

	return (
		<div
			onClick={handleClick}
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '6px 12px',
				cursor: 'pointer',
				borderRadius: 4,
				backgroundColor: isActive ? `${theme.colors.accent}20` : 'transparent',
				boxShadow: isActive ? `inset 2px 0 0 ${theme.colors.accent}` : 'none',
				transition: 'background-color 0.1s',
				gap: 8,
				minHeight: 36,
			}}
			onMouseEnter={(e) => {
				if (!isActive) {
					e.currentTarget.style.backgroundColor = theme.colors.bgActivity;
				}
			}}
			onMouseLeave={(e) => {
				if (!isActive) {
					e.currentTarget.style.backgroundColor = 'transparent';
				}
			}}
		>
			{/* Status dot */}
			<span
				style={{
					width: 8,
					height: 8,
					borderRadius: '50%',
					backgroundColor: stateColor,
					flexShrink: 0,
					animation: isPulsing ? 'sessionPulse 1.5s ease-in-out infinite' : 'none',
				}}
			/>

			{/* Session name + agent type */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<div
					style={{
						color: isActive ? theme.colors.textMain : theme.colors.textDim,
						fontSize: 13,
						fontWeight: isActive ? 600 : 400,
						whiteSpace: 'nowrap',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
					}}
				>
					{session.name}
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
					{session.toolType}
				</div>
			</div>

			{/* Close button (visible on hover via CSS, always in DOM) */}
			<button
				onClick={handleClose}
				style={{
					background: 'none',
					border: 'none',
					color: theme.colors.textDim,
					fontSize: 14,
					cursor: 'pointer',
					padding: '0 2px',
					lineHeight: 1,
					opacity: 0.5,
					flexShrink: 0,
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.opacity = '1';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.opacity = '0.5';
				}}
				title="Close session"
			>
				×
			</button>
		</div>
	);
});
