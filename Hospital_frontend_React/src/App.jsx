import { useState } from 'react'
import Icon from './components/Icon'
import RecordModal from './components/RecordModal'
import { pageMeta } from './data/navigation'
import { useHospitalData } from './hooks/useHospitalData'
import AssignmentsPage from './pages/AssignmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import OverviewPage from './pages/OverviewPage'
import PatientsPage from './pages/PatientsPage'
import DashboardLayout from './layouts/DashboardLayout'
import './styles/App.css'

function App() {
  const [page, setPage] = useState('overview')
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const hospital = useHospitalData()

  const navigate = (nextPage) => {
    setPage(nextPage)
    setSearch('')
    setFilter('All')
  }

  const saveRecord = async (type, values, record) => {
    await hospital.saveRecord(type, values, record)
    setModal(null)
  }

  const assignPatient = async (values) => {
    await hospital.assignPatient(values)
    setModal(null)
  }

  const pageAction = page === 'patients'
    ? <button className="button button-primary" onClick={() => setModal({ type: 'patient' })}><Icon name="plus" size={17} /> Add patient</button>
    : page === 'doctors'
      ? <button className="button button-primary" onClick={() => setModal({ type: 'doctor' })}><Icon name="plus" size={17} /> Add doctor</button>
      : page === 'assignments'
        ? <button className="button button-primary" onClick={() => setModal({ type: 'assignment' })}><Icon name="plus" size={17} /> New assignment</button>
        : null

  return (
    <>
      <DashboardLayout
        page={page}
        title={pageMeta[page][0]}
        subtitle={pageMeta[page][1]}
        action={pageAction}
        waitingCount={hospital.waitingPatients.length}
        loading={hospital.loading}
        apiError={hospital.apiError}
        toast={hospital.toast}
        onNavigate={navigate}
        onRefresh={hospital.loadData}
      >
        {page === 'overview' && (
          <OverviewPage
            patients={hospital.patients}
            doctors={hospital.doctors}
            waitingPatients={hospital.waitingPatients}
            availableDoctors={hospital.availableDoctors}
            activeAssignments={hospital.activeAssignments}
            loading={hospital.loading}
            onNavigate={navigate}
            onRelease={hospital.releaseAssignment}
          />
        )}
        {page === 'patients' && (
          <PatientsPage
            patients={hospital.patients}
            loading={hospital.loading}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            onEdit={(record) => setModal({ type: 'patient', record })}
            onDelete={(record) => hospital.deleteRecord('patient', record)}
          />
        )}
        {page === 'doctors' && (
          <DoctorsPage
            doctors={hospital.doctors}
            loading={hospital.loading}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            onEdit={(record) => setModal({ type: 'doctor', record })}
            onDelete={(record) => hospital.deleteRecord('doctor', record)}
          />
        )}
        {page === 'assignments' && (
          <AssignmentsPage
            assignments={hospital.assignments}
            patients={hospital.patients}
            doctors={hospital.doctors}
            activeCount={hospital.activeAssignments.length}
            waitingCount={hospital.waitingPatients.length}
            loading={hospital.loading}
            onRelease={hospital.releaseAssignment}
          />
        )}
      </DashboardLayout>
      {modal && (
        <RecordModal
          modal={modal}
          patients={hospital.waitingPatients}
          doctors={hospital.availableDoctors}
          onClose={() => setModal(null)}
          onSave={saveRecord}
          onAssign={assignPatient}
        />
      )}
    </>
  )
}

export default App
