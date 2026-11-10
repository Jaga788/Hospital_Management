import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import LoadingRows from '../components/LoadingRows'
import RowActions from '../components/RowActions'
import Status from '../components/Status'
import { initials, matchesSearch } from '../data/presentation'

export default function DoctorsPage({ doctors, loading, search, setSearch, filter, setFilter, onEdit, onDelete }) {
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
          <thead><tr><th>Doctor</th><th>Specialization</th><th>Contact</th><th>Experience</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {filteredDoctors.map((doctor, index) => (
              <tr key={doctor.id}>
                <td><div className="person-cell"><div className={`avatar avatar-color-${index % 4}`}>{initials(doctor.name)}</div><div><strong>{doctor.name}</strong><span>Doctor #{doctor.id}</span></div></div></td>
                <td><span className="specialty-tag">{doctor.specialization}</span></td>
                <td><div className="cell-primary">{doctor.phone}</div><div className="cell-secondary">{doctor.email || 'No email provided'}</div></td>
                <td><div className="cell-primary">{doctor.experience == null ? '—' : `${doctor.experience} years`}</div></td>
                <td><Status value={doctor.status} /></td>
                <td><RowActions onEdit={() => onEdit(doctor)} onDelete={() => onDelete(doctor)} /></td>
              </tr>
            ))}
            {!loading && filteredDoctors.length === 0 && (
              <tr><td colSpan="6"><EmptyState title="No doctors found" detail={search ? 'Try another search or clear the status filter.' : 'Add a doctor to build your care team.'} /></td></tr>
            )}
            {loading && <tr><td colSpan="6"><LoadingRows count={4} /></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {filteredDoctors.length} of {doctors.length} doctors</span>
        <span>Doctor availability updates with care assignments</span>
      </div>
    </section>
  )
}
