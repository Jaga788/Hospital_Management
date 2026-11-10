import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import LoadingRows from '../components/LoadingRows'
import RowActions from '../components/RowActions'
import Status from '../components/Status'
import { initials, matchesSearch } from '../data/presentation'

export default function PatientsPage({ patients, loading, search, setSearch, filter, setFilter, onEdit, onDelete }) {
  const filteredPatients = patients.filter((patient) => {
    const text = `${patient.name} ${patient.disease || ''} ${patient.phone}`
    return matchesSearch(text, search) && (filter === 'All' || patient.status === filter)
  })

  return (
    <section className="panel data-panel">
      <div className="panel-heading panel-heading-wrap">
        <div><h2>Patient directory</h2><p>{patients.length} patient records in your hospital</p></div>
        <div className="table-controls">
          <label className="search-field">
            <Icon name="search" size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patients" />
          </label>
          <select className="filter-select" value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter patients by status">
            <option>All</option><option>WAITING</option><option>UNDER_TREATMENT</option><option>COMPLETED</option>
          </select>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Patient</th><th>Contact</th><th>Age / gender</th><th>Condition</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {filteredPatients.map((patient, index) => (
              <tr key={patient.id}>
                <td><div className="person-cell"><div className={`avatar avatar-color-${index % 4}`}>{initials(patient.name)}</div><div><strong>{patient.name}</strong><span>Patient #{patient.id}</span></div></div></td>
                <td><div className="cell-primary">{patient.phone}</div><div className="cell-secondary">{patient.email || 'No email provided'}</div></td>
                <td><div className="cell-primary">{patient.age} years</div><div className="cell-secondary">{patient.gender}</div></td>
                <td><span className="condition-tag">{patient.disease || 'Not specified'}</span></td>
                <td><Status value={patient.status} /></td>
                <td><RowActions onEdit={() => onEdit(patient)} onDelete={() => onDelete(patient)} /></td>
              </tr>
            ))}
            {!loading && filteredPatients.length === 0 && (
              <tr><td colSpan="6"><EmptyState title="No patients found" detail={search ? 'Try another search or clear the status filter.' : 'Add your first patient to get started.'} /></td></tr>
            )}
            {loading && <tr><td colSpan="6"><LoadingRows count={4} /></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {filteredPatients.length} of {patients.length} patients</span>
        <span>Patient data is stored securely in your hospital database</span>
      </div>
    </section>
  )
}
