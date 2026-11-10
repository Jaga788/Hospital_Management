import AssignmentTable from '../components/AssignmentTable'
import Icon from '../components/Icon'

export default function AssignmentsPage({
  assignments,
  patients,
  doctors,
  activeCount,
  waitingCount,
  loading,
  onRelease,
}) {
  return (
    <section className="panel data-panel">
      <div className="panel-heading panel-heading-wrap">
        <div><h2>Care assignments</h2><p>Review active treatment and assignment history</p></div>
        <div className="assignment-summary">
          <span><i className="summary-dot summary-active" /> {activeCount} active</span>
          <span><i className="summary-dot summary-waiting" /> {waitingCount} waiting</span>
        </div>
      </div>
      <div className="table-scroll">
        <AssignmentTable
          assignments={assignments}
          patients={patients}
          doctors={doctors}
          onRelease={onRelease}
          loading={loading}
        />
      </div>
      <div className="assignment-note">
        <Icon name="clock" size={17} />
        <span>When a patient is released, the doctor becomes available. The next patient must be assigned manually.</span>
      </div>
    </section>
  )
}
