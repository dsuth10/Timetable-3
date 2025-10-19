import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Edit,
  Delete,
  ContentCopy,
  CheckCircle,
  PlayArrow,
  Info,
} from '@mui/icons-material';
import type { Assignment } from '../../types';

type TaskContextMenuProps = {
  anchorPosition: { top: number; left: number } | null;
  onClose: () => void;
  assignment: Assignment | null;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignment: Assignment) => void;
  onDuplicate?: (assignment: Assignment) => void;
  onMarkComplete?: (assignment: Assignment) => void;
  onMarkInProgress?: (assignment: Assignment) => void;
  onViewDetails?: (assignment: Assignment) => void;
};

export default function TaskContextMenu({
  anchorPosition,
  onClose,
  assignment,
  onEdit,
  onDelete,
  onDuplicate,
  onMarkComplete,
  onMarkInProgress,
  onViewDetails,
}: TaskContextMenuProps) {
  if (!assignment) return null;

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu
      open={Boolean(anchorPosition)}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition || undefined}
    >
      {onViewDetails && (
        <MenuItem onClick={() => handleAction(() => onViewDetails(assignment))}>
          <ListItemIcon>
            <Info fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
      )}
      
      {onEdit && (
        <MenuItem onClick={() => handleAction(() => onEdit(assignment))}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}

      {onDuplicate && (
        <MenuItem onClick={() => handleAction(() => onDuplicate(assignment))}>
          <ListItemIcon>
            <ContentCopy fontSize="small" />
          </ListItemIcon>
          <ListItemText>Duplicate</ListItemText>
        </MenuItem>
      )}

      <Divider />

      {onMarkInProgress && assignment.status !== 'IN_PROGRESS' && (
        <MenuItem onClick={() => handleAction(() => onMarkInProgress(assignment))}>
          <ListItemIcon>
            <PlayArrow fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark In Progress</ListItemText>
        </MenuItem>
      )}

      {onMarkComplete && assignment.status !== 'COMPLETE' && (
        <MenuItem onClick={() => handleAction(() => onMarkComplete(assignment))}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Mark Complete</ListItemText>
        </MenuItem>
      )}

      <Divider />

      {onDelete && (
        <MenuItem 
          onClick={() => handleAction(() => onDelete(assignment))}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}

