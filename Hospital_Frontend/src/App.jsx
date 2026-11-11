import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/useAuth'
import { DoctorRegistrationPage, LoginPage, PatientRegistrationPage } from './pages/AuthPages'
import Icon from './components/Icon'
import RecordModal from './components/RecordModal'
import { pageMeta } from './data/navigation'
import { useHospitalData } from './hooks/useHospitalData'
import AssignmentsPage from './pages/AssignmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import LandingPage from './pages/LandingPage'
import OverviewPage from './pages/OverviewPage'
import PatientsPage from './pages/PatientsPage'
import DoctorDashboard from './pages/DoctorDashboard'
import PatientDashboard from './pages/PatientDashboard'
import DashboardLayout from './layouts/DashboardLayout'
import './styles/App.css'

function AdminDashboard() {
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
            registrations={hospital.doctorRegistrations}
            loading={hospital.loading}
            search={search}
            setSearch={setSearch}
            filter={filter}
            setFilter={setFilter}
            onEdit={(record) => setModal({ type: 'doctor', record })}
            onDelete={(record) => hospital.deleteRecord('doctor', record)}
            onReview={hospital.reviewDoctor}
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

function roleHome(role) {
  if (role === 'ADMIN') return '/admin'
  if (role === 'DOCTOR') return '/doctor'
  if (role === 'PATIENT') return '/patient'
  return '/login'
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading">Loading your secure session…</div>
  return <Navigate to={roleHome(user?.role)} replace />
}

function ProtectedRole({ role, children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="auth-loading">Loading your secure session…</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={roleHome(user.role)} replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/patient" element={<PatientRegistrationPage />} />
      <Route path="/register/doctor" element={<DoctorRegistrationPage />} />
      <Route path="/admin/*" element={<ProtectedRole role="ADMIN"><AdminDashboard /></ProtectedRole>} />
      <Route path="/patient/*" element={<ProtectedRole role="PATIENT"><PatientDashboard /></ProtectedRole>} />
      <Route path="/doctor/*" element={<ProtectedRole role="DOCTOR"><DoctorDashboard /></ProtectedRole>} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}

export default App
