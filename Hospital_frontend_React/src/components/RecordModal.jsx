import { useState } from 'react'
import Icon from './Icon'

export default function RecordModal({ modal, patients, doctors, onClose, onSave, onAssign }) {
  const isAssignment = modal.type === 'assignment'
  const record = modal.record
  const [values, setValues] = useState(() => isAssignment
    ? { patient_id: patients[0]?.id || '', doctor_id: doctors[0]?.id || '' }
    : modal.type === 'patient'
      ? {
          name: record?.name || '',
          age: record?.age ?? '',
          gender: record?.gender || 'Female',
          phone: record?.phone || '',
          email: record?.email || '',
          address: record?.address || '',
          disease: record?.disease || '',
        }
      : {
          name: record?.name || '',
          specialization: record?.specialization || '',
          phone: record?.phone || '',
          email: record?.email || '',
          experience: record?.experience ?? '',
        })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isAssignment) await onAssign(values)
      else await onSave(modal.type, values, record)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div>
            <span className="modal-icon">
              <Icon name={isAssignment ? 'clipboard' : modal.type === 'patient' ? 'users' : 'doctor'} size={19} />
            </span>
            <div>
              <h2 id="modal-title">{isAssignment ? 'New assignment' : `${record ? 'Edit' : 'Add'} ${modal.type}`}</h2>
              <p>{isAssignment ? 'Connect a waiting patient with an available doctor.' : 'Enter the details below to update your records.'}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" size={20} /></button>
        </div>
        <form onSubmit={submit}>
          {isAssignment ? (
            <div className="form-grid">
              <label className="form-field form-full">
                <span>Waiting patient <b>*</b></span>
                <select value={values.patient_id} onChange={update('patient_id')} required disabled={!patients.length}>
                  <option value="">Select a patient</option>
                  {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name} · #{patient.id} · {patient.disease || 'No condition noted'}</option>)}
                </select>
                {!patients.length && <small>No waiting patients are available. Add a patient first.</small>}
              </label>
              <label className="form-field form-full">
                <span>Available doctor <b>*</b></span>
                <select value={values.doctor_id} onChange={update('doctor_id')} required disabled={!doctors.length}>
                  <option value="">Select a doctor</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} · {doctor.specialization}</option>)}
                </select>
                {!doctors.length && <small>No available doctors. Add or release a doctor first.</small>}
              </label>
            </div>
          ) : modal.type === 'patient' ? (
            <div className="form-grid">
              <label className="form-field form-full"><span>Full name <b>*</b></span><input value={values.name} onChange={update('name')} maxLength="100" required placeholder="e.g. Maya Johnson" /></label>
              <label className="form-field"><span>Age <b>*</b></span><input type="number" value={values.age} onChange={update('age')} min="0" max="130" required placeholder="Age" /></label>
              <label className="form-field"><span>Gender <b>*</b></span><select value={values.gender} onChange={update('gender')} required><option>Female</option><option>Male</option><option>Non-binary</option><option>Other</option><option>Prefer not to say</option></select></label>
              <label className="form-field"><span>Phone number <b>*</b></span><input value={values.phone} onChange={update('phone')} maxLength="20" required placeholder="+1 (555) 000-0000" /></label>
              <label className="form-field"><span>Email address</span><input type="email" value={values.email} onChange={update('email')} placeholder="patient@email.com" /></label>
              <label className="form-field form-full"><span>Condition / disease</span><input value={values.disease} onChange={update('disease')} maxLength="255" placeholder="e.g. General check-up" /></label>
              <label className="form-field form-full"><span>Address</span><input value={values.address} onChange={update('address')} maxLength="255" placeholder="Street address" /></label>
            </div>
          ) : (
            <div className="form-grid">
              <label className="form-field form-full"><span>Full name <b>*</b></span><input value={values.name} onChange={update('name')} maxLength="100" required placeholder="e.g. Dr. Alex Morgan" /></label>
              <label className="form-field form-full"><span>Specialization <b>*</b></span><input value={values.specialization} onChange={update('specialization')} maxLength="100" required placeholder="e.g. Cardiology" /></label>
              <label className="form-field"><span>Phone number <b>*</b></span><input value={values.phone} onChange={update('phone')} maxLength="20" required placeholder="+1 (555) 000-0000" /></label>
              <label className="form-field"><span>Email address</span><input type="email" value={values.email} onChange={update('email')} placeholder="doctor@hospital.com" /></label>
              <label className="form-field"><span>Years of experience</span><input type="number" value={values.experience} onChange={update('experience')} min="0" max="80" placeholder="e.g. 8" /></label>
            </div>
          )}
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modal-actions">
            <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="button button-primary" disabled={saving || (isAssignment && (!patients.length || !doctors.length))}>
              {saving ? 'Saving…' : isAssignment ? 'Create assignment' : record ? 'Save changes' : `Add ${modal.type}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
