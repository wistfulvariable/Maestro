/**
 * ProjectSidebar - Left sidebar showing inbox + project list.
 * Replaces the old SessionList component with a project-centric layout.
 * Renders InboxSection (when items exist) + project list with session counts.
 * Handles navigation between projects and inbox item clicks.
 */

import React, { useCallback, useMemo } from 'react';
import { useProjectStore, selectAllProjects } from '../../stores/projectStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useInboxStore } from '../../stores/inboxStore';
import { InboxSection } from './InboxSection';
import { ProjectItem } from './ProjectItem';
import type { InboxItem } from '../../types';
import type { Theme } from '../../constants/themes';

interface ProjectSidebarProps {
	theme: Theme;
	onAddProject: () => void;
}

export const ProjectSidebar = React.memo(function ProjectSidebar({
	theme,
	onAddProject,
}: ProjectSidebarProps) {
	const projects = useProjectStore(selectAllProjects);
	const activeProjectId = useProjectStore((s) => s.activeProjectId);
	const setActiveProjectId = useProjectStore((s) => s.setActiveProjectId);
	const sessions = useSessionStore((s) => s.sessions);
	const setActiveSessionId = useSessionStore((s) => s.setActiveSessionId);
	const dismissItem = useInboxStore((s) => s.dismissItem);
	const dismissAllForSession = useInboxStore((s) => s.dismissAllForSession);

	// Count sessions per project
	const sessionCounts = useMemo(() => {
		const counts = new Map<string, number>();
		for (const session of sessions) {
			if (session.projectId) {
				counts.set(session.projectId, (counts.get(session.projectId) || 0) + 1);
			}
		}
		return counts;
	}, [sessions]);

	const handleSelectProject = useCallback(
		(projectId: string) => {
			setActiveProjectId(projectId);
			// When switching projects, select the first session in the new project
			const projectSessions = sessions.filter((s) => s.projectId === projectId);
			if (projectSessions.length > 0) {
				setActiveSessionId(projectSessions[0].id);
			}
		},
		[setActiveProjectId, setActiveSessionId, sessions]
	);

	const handleNavigateToInboxItem = useCallback(
		(item: InboxItem) => {
			// Switch to the project
			setActiveProjectId(item.projectId);
			// Switch to the session
			setActiveSessionId(item.sessionId);
			// Dismiss the item
			dismissItem(item.id);
			// Also dismiss any other items for this session
			dismissAllForSession(item.sessionId);
		},
		[setActiveProjectId, setActiveSessionId, dismissItem, dismissAllForSession]
	);

	const handleProjectContextMenu = useCallback(
		(e: React.MouseEvent, _projectId: string) => {
			e.preventDefault();
			// TODO: Implement context menu (rename, change color, delete)
		},
		[]
	);

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				overflow: 'hidden',
			}}
		>
			{/* Inbox Section */}
			<InboxSection theme={theme} onNavigateToItem={handleNavigateToInboxItem} />

			{/* Projects Header */}
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
					Projects
				</span>
				<button
					onClick={onAddProject}
					style={{
						background: 'none',
						border: 'none',
						color: theme.colors.textDim,
						fontSize: 16,
						cursor: 'pointer',
						padding: '0 4px',
						lineHeight: 1,
					}}
					title="New Project"
				>
					+
				</button>
			</div>

			{/* Project List */}
			<div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
				{projects.map((project) => (
					<ProjectItem
						key={project.id}
						project={project}
						isActive={project.id === activeProjectId}
						sessionCount={sessionCounts.get(project.id) || 0}
						theme={theme}
						onSelect={handleSelectProject}
						onContextMenu={handleProjectContextMenu}
					/>
				))}

				{projects.length === 0 && (
					<div
						style={{
							color: theme.colors.textDim,
							fontSize: 12,
							textAlign: 'center',
							padding: '20px 12px',
						}}
					>
						No projects yet. Click + to add a repo.
					</div>
				)}
			</div>
		</div>
	);
});
