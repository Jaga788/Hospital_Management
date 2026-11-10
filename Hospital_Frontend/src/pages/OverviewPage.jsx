import AssignmentTable from '../components/AssignmentTable'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import LoadingRows from '../components/LoadingRows'
import StatCard from '../components/StatCard'
import Status from '../components/Status'
import { initials } from '../data/presentation'

export default function OverviewPage({
  patients,
  doctors,
  waitingPatients,
  availableDoctors,
  activeAssignments,
  loading,
  onNavigate,
  onRelease,
}) {
  return (
    <>
      <section className="welcome-banner">
        <div className="welcome-text">
          <span className="welcome-kicker"><span className="welcome-dot" /> YOUR CARE OVERVIEW</span>
          <h2>Every patient deserves<br />a little <em>extra care.</em></h2>
          <p>Your team is doing great work. Here’s the latest across your hospital.</p>
          <button className="welcome-link" onClick={() => onNavigate('assignments')}>
            View care assignments <Icon name="arrow" size={16} />
          </button>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-cross">+</div>
          <div className="art-pill">✦</div>
          <div className="art-heart"><Icon name="heart" size={46} /></div>
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
        </div>
      </section>

      <section className="stats-grid" aria-label="Hospital summary">
        <StatCard label="Total patients" value={patients.length} icon="users" tone="blue" note="Registered in the system" />
        <StatCard label="Waiting for care" value={waitingPatients.length} icon="clock" tone="amber" note="Ready to be assigned" />
        <StatCard label="Available doctors" value={availableDoctors.length} icon="doctor" tone="green" note={`of ${doctors.length} doctors on staff`} />
        <StatCard label="Active assignments" value={activeAssignments.length} icon="heart" tone="violet" note="Patients currently in care" />
      </section>

      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div><h2>Active care</h2><p>Patients currently under treatment</p></div>
            <button className="text-button" onClick={() => onNavigate('assignments')}>
              View all <Icon name="arrow" size={15} />
            </button>
          </div>
          <div className="table-scroll">
            <AssignmentTable
              assignments={activeAssignments.slice(0, 5)}
              patients={patients}
              doctors={doctors}
              onRelease={onRelease}
              compact
            />
          </div>
        </section>

        <section className="panel team-panel">
          <div className="panel-heading">
            <div><h2>Your care team</h2><p>Doctor availability at a glance</p></div>
            <button className="icon-button" aria-label="View all doctors" onClick={() => onNavigate('doctors')}>
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="team-list">
            {doctors.slice(0, 4).map((doctor, index) => (
              <div className="team-member" key={doctor.id}>
                <div className={`avatar avatar-color-${index % 4}`}>{initials(doctor.name)}</div>
                <div className="team-member-copy"><strong>{doctor.name}</strong><span>{doctor.specialization}</span></div>
                <Status value={doctor.status} />
              </div>
            ))}
            {!doctors.length && !loading && <EmptyState title="No doctors yet" detail="Add a doctor to see your care team here." />}
            {loading && <LoadingRows count={3} />}
          </div>
          <button className="team-footer" onClick={() => onNavigate('doctors')}>
            See all doctors <Icon name="arrow" size={15} />
          </button>
        </section>
      </div>
    </>
  )
}
