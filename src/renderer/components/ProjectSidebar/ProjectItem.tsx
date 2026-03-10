/**
 * ProjectItem - A single project row in the left sidebar.
 * Shows name, session count, active highlight, and optional color accent.
 */

import React, { useCallback } from 'react';
import type { Project } from '../../../shared/types';
import type { Theme } from '../../constants/themes';

interface ProjectItemProps {
	project: Project;
	isActive: boolean;
	sessionCount: number;
	theme: Theme;
	onSelect: (projectId: string) => void;
	onContextMenu: (e: React.MouseEvent, projectId: string) => void;
}

export const ProjectItem = React.memo(function ProjectItem({
	project,
	isActive,
	sessionCount,
	theme,
	onSelect,
	onContextMenu,
}: ProjectItemProps) {
	const handleClick = useCallback(() => {
		onSelect(project.id);
	}, [project.id, onSelect]);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			onContextMenu(e, project.id);
		},
		[project.id, onContextMenu]
	);

	return (
		<div
			onClick={handleClick}
			onContextMenu={handleContextMenu}
			style={{
				display: 'flex',
				alignItems: 'center',
				padding: '8px 12px',
				cursor: 'pointer',
				borderRadius: 4,
				borderLeft: project.color ? `3px solid ${project.color}` : '3px solid transparent',
				backgroundColor: isActive ? `${theme.colors.accent}20` : 'transparent',
				boxShadow: isActive ? `inset 2px 0 0 ${theme.colors.accent}` : 'none',
				transition: 'background-color 0.1s',
				gap: 8,
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
					{project.name}
				</div>
			</div>
			{sessionCount > 0 && (
				<span
					style={{
						color: theme.colors.textDim,
						fontSize: 10,
						flexShrink: 0,
					}}
				>
					{sessionCount}
				</span>
			)}
		</div>
	);
});
