import { initials } from '../data/presentation'
import EmptyState from './EmptyState'
import Icon from './Icon'
import LoadingRows from './LoadingRows'
import Status from './Status'

export default function AssignmentTable({
  assignments,
  patients,
  doctors,
  onRelease,
  loading = false,
  compact = false,
}) {
  return (
    <table className={compact ? 'compact-table' : ''}>
      <thead>
        <tr>
          <th>Patient</th>
          <th>Doctor</th>
          <th>Assigned</th>
          <th>Status</th>
          <th><span className="sr-only">Action</span></th>
        </tr>
      </thead>
      <tbody>
        {assignments.map((assignment, index) => {
          const patient = patients.find((item) => item.id === assignment.patient_id)
          const doctor = doctors.find((item) => item.id === assignment.doctor_id)
          return (
            <tr key={assignment.id}>
              <td>
                <div className="person-cell">
                  <div className={`avatar avatar-small avatar-color-${index % 4}`}>
                    {initials(patient?.name || `P${assignment.patient_id}`)}
                  </div>
                  <div>
                    <strong>{patient?.name || `Patient #${assignment.patient_id}`}</strong>
                    <span>Record #{assignment.patient_id}</span>
                  </div>
                </div>
              </td>
              <td>
                <div className="cell-primary">{doctor?.name || `Doctor #${assignment.doctor_id}`}</div>
                <div className="cell-secondary">{doctor?.specialization || 'Care provider'}</div>
              </td>
              <td>
                <span className="cell-primary">
                  {new Date(assignment.assigned_at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              </td>
              <td><Status value={assignment.status} /></td>
              <td>
                {assignment.status === 'ACTIVE' && (
                  compact
                    ? <button className="release-icon" aria-label={`Release ${patient?.name || 'patient'}`} onClick={() => onRelease(assignment)}><Icon name="check" size={16} /></button>
                    : <button className="release-button" onClick={() => onRelease(assignment)}>Release patient</button>
                )}
              </td>
            </tr>
          )
        })}
        {!loading && assignments.length === 0 && (
          <tr><td colSpan="5"><EmptyState title="No assignments yet" detail="Assign a waiting patient to an available doctor to begin." /></td></tr>
        )}
        {loading && <tr><td colSpan="5"><LoadingRows count={3} /></td></tr>}
      </tbody>
    </table>
  )
}
