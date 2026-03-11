/**
 * SessionSidebar - Column 2 of the left sidebar.
 * Shows sessions belonging to the active project with status indicators.
 * Provides new-session button and session selection.
 */

import React from 'react';
import { SessionItem } from './SessionItem';
import type { Session } from '../../types';
import type { Theme } from '../../constants/themes';

interface SessionSidebarProps {
	theme: Theme;
	sessions: Session[];
	activeSessionId: string;
	onSessionSelect: (id: string) => void;
	onSessionClose: (id: string) => void;
	onNewSession: () => void;
}

export const SessionSidebar = React.memo(function SessionSidebar({
	theme,
	sessions,
	activeSessionId,
	onSessionSelect,
	onSessionClose,
	onNewSession,
}: SessionSidebarProps) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				overflow: 'hidden',
			}}
		>
			{/* Pulse animation for connecting state */}
			<style>{`
				@keyframes sessionPulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.3; }
				}
			`}</style>

			{/* Sessions Header */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '8px 12px',
				}}
			>
				<span
					style={{
						color: theme.colors.textDim,
						fontSize: 11,
						fontWeight: 600,
						textTransform: 'uppercase',
						letterSpacing: '0.05em',
					}}
				>
					Sessions
				</span>
				<button
					onClick={onNewSession}
					style={{
						background: 'none',
						border: 'none',
						color: theme.colors.textDim,
						fontSize: 16,
						cursor: 'pointer',
						padding: '0 4px',
						lineHeight: 1,
					}}
					title="New Session"
				>
					+
				</button>
			</div>

			{/* Session List */}
			<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
				{sessions.map((session) => (
					<SessionItem
						key={session.id}
						session={session}
						isActive={session.id === activeSessionId}
						theme={theme}
						onSelect={onSessionSelect}
						onClose={onSessionClose}
					/>
				))}

				{sessions.length === 0 && (
					<div
						style={{
							color: theme.colors.textDim,
							fontSize: 12,
							textAlign: 'center',
							padding: '20px 12px',
						}}
					>
						No sessions yet. Click + to start.
					</div>
				)}
			</div>
		</div>
	);
});
