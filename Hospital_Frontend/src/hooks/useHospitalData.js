import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../services/api'

export function useHospitalData() {
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [assignments, setAssignments] = useState([])
  const [activeAssignments, setActiveAssignments] = useState([])
  const [doctorRegistrations, setDoctorRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [toast, setToast] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setApiError('')
    try {
      const [patientData, doctorData, assignmentData, activeData, registrations] = await Promise.all([
        apiRequest('/patients/?limit=500'),
        apiRequest('/doctors/?limit=500'),
        apiRequest('/assignments/?limit=500'),
        apiRequest('/assignments/active'),
        apiRequest('/auth/admin/doctors'),
      ])
      setPatients(patientData)
      setDoctors(doctorData)
      setAssignments(assignmentData)
      setActiveAssignments(activeData)
      setDoctorRegistrations(registrations)
    } catch (error) {
      setApiError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => loadData(), 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const waitingPatients = useMemo(
    () => patients.filter((patient) => patient.status === 'WAITING'),
    [patients],
  )
  const availableDoctors = useMemo(
    () => doctors.filter((doctor) => doctor.status === 'AVAILABLE' && doctor.verification_status === 'APPROVED'),
    [doctors],
  )

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3200)
  }, [])

  const saveRecord = async (type, values, record) => {
    const path = type === 'patient' ? '/patients/' : '/doctors/'
    const payload = type === 'patient'
      ? {
          name: values.name.trim(),
          age: Number(values.age),
          gender: values.gender,
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          address: values.address.trim() || null,
          disease: values.disease.trim() || null,
        }
      : {
          name: values.name.trim(),
          specialization: values.specialization.trim(),
          phone: values.phone.trim(),
          email: values.email.trim() || null,
          experience: values.experience === '' ? null : Number(values.experience),
        }

    await apiRequest(record ? `${path}${record.id}` : path, {
      method: record ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    })
    notify(`${type === 'patient' ? 'Patient' : 'Doctor'} ${record ? 'updated' : 'added'} successfully`)
    await loadData()
  }

  const deleteRecord = async (type, record) => {
    const label = type === 'patient' ? 'patient' : 'doctor'
    if (!window.confirm(`Delete ${label} ${record.name}?`)) return
    try {
      await apiRequest(`/${type === 'patient' ? 'patients' : 'doctors'}/${record.id}`, { method: 'DELETE' })
      notify(`${label[0].toUpperCase()}${label.slice(1)} deleted`)
      await loadData()
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  const assignPatient = async (values) => {
    await apiRequest('/assignments/assign', {
      method: 'POST',
      body: JSON.stringify({
        patient_id: Number(values.patient_id),
        doctor_id: Number(values.doctor_id),
      }),
    })
    notify('Patient assigned to doctor')
    await loadData()
  }

  const releaseAssignment = async (assignment) => {
    try {
      await apiRequest(`/assignments/${assignment.id}/release`, { method: 'POST' })
      notify('Patient released successfully')
      await loadData()
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  const reviewDoctor = async (doctor, decision, reason) => {
    try {
      await apiRequest(`/auth/admin/doctors/${doctor.user_id}/${decision}`, {
        method: 'POST',
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      })
      notify(`Doctor registration ${decision === 'approve' ? 'approved' : 'rejected'}`)
      await loadData()
    } catch (error) {
      notify(error.message, 'error')
    }
  }

  return {
    patients,
    doctors,
    assignments,
    activeAssignments,
    doctorRegistrations,
    waitingPatients,
    availableDoctors,
    loading,
    apiError,
    toast,
    loadData,
    saveRecord,
    deleteRecord,
    assignPatient,
    releaseAssignment,
    reviewDoctor,
  }
}
