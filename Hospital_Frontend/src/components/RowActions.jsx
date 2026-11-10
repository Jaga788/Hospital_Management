export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="row-actions">
      <button onClick={onEdit} aria-label="Edit record">Edit</button>
      <button className="delete-action" onClick={onDelete} aria-label="Delete record">Delete</button>
    </div>
  )
}
