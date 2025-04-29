import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export default function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.item.id, data: { ...props.item } });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    display: 'flex',
    alignItems: 'center'
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DragIndicatorIcon {...listeners} style={{ cursor: 'grab' }} />
      {props.children}
    </div>
  );
}