import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import LoadingRows from '../components/LoadingRows'
import RowActions from '../components/RowActions'
import Status from '../components/Status'
import { initials, matchesSearch } from '../data/presentation'

export default function DoctorsPage({ doctors, registrations, loading, search, setSearch, filter, setFilter, onEdit, onDelete, onReview }) {
  const filteredDoctors = doctors.filter((doctor) => {
    const text = `${doctor.name} ${doctor.specialization} ${doctor.phone}`
    return matchesSearch(text, search) && (filter === 'All' || doctor.status === filter)
  })

  return (
    <section className="panel data-panel">
      <div className="panel-heading panel-heading-wrap">
        <div><h2>Medical team</h2><p>{doctors.length} doctors registered at your hospital</p></div>
        <div className="table-controls">
          <label className="search-field">
            <Icon name="search" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctors" />
          </label>
          <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter doctors by status">
            <option>All</option><option>AVAILABLE</option><option>BUSY</option>
          </select>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Doctor</th><th>Specialization</th><th>Contact</th><th>Experience</th><th>Status</th><th>Account</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {filteredDoctors.map((doctor, index) => (
              <tr key={doctor.id}>
                <td><div className="person-cell"><div className={`avatar avatar-color-${index % 4}`}>{initials(doctor.name)}</div><div><strong>{doctor.name}</strong><span>Doctor #{doctor.id}</span></div></div></td>
                <td><span className="specialty-tag">{doctor.specialization}</span></td>
                <td><div className="cell-primary">{doctor.phone}</div><div className="cell-secondary">{doctor.email || 'No email provided'}</div></td>
                <td><div className="cell-primary">{doctor.experience == null ? '—' : `${doctor.experience} years`}</div></td>
                <td><Status value={doctor.status} /></td>
                <td><Status value={doctor.verification_status} /></td>
                <td><RowActions onEdit={() => onEdit(doctor)} onDelete={() => onDelete(doctor)} /></td>
              </tr>
            ))}
            {!loading && filteredDoctors.length === 0 && (
              <tr><td colSpan="7"><EmptyState title="No doctors found" detail={search ? 'Try another search or clear the status filter.' : 'Add a doctor to build your care team.'} /></td></tr>
            )}
            {loading && <tr><td colSpan="7"><LoadingRows count={4} /></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {filteredDoctors.length} of {doctors.length} doctors</span>
        <span>Doctor availability updates with care assignments</span>
      </div>
      <div className="verification-panel">
        <div className="panel-heading">
          <div><h2>Doctor account verification</h2><p>Only approved doctor accounts can access the doctor portal or receive assignments.</p></div>
        </div>
        {registrations.length ? (
          <div className="table-scroll">
            <table>
              <thead><tr><th>Doctor</th><th>Specialization</th><th>Email / license</th><th>Verification</th><th>Review</th></tr></thead>
              <tbody>
                {registrations.map((doctor) => (
                  <tr key={doctor.user_id}>
                    <td><div className="cell-primary">{doctor.name}</div><div className="cell-secondary">Doctor #{doctor.doctor_id}</div></td>
                    <td>{doctor.specialization}</td>
                    <td><div className="cell-primary">{doctor.email}</div><div className="cell-secondary">License: {doctor.license_number}</div></td>
                    <td><Status value={doctor.verification_status} /></td>
                    <td>
                      {doctor.verification_status === 'PENDING' ? (
                        <div className="verification-actions">
                          <button className="button button-primary" onClick={() => onReview(doctor, 'approve')}>Approve</button>
                          <button className="button button-secondary" onClick={() => {
                            const reason = window.prompt('Reason for rejecting this registration:')
                            if (reason?.trim()) onReview(doctor, 'reject', reason.trim())
                          }}>Reject</button>
                        </div>
                      ) : <span className="cell-secondary">{doctor.verification_status === 'APPROVED' ? 'Verified' : 'Rejected'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="verification-empty">No doctor registrations to review.</p>}
      </div>
    </section>
  )
}
