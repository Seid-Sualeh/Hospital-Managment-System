import React, { useState, useEffect } from 'react';
import { 
  Heart, Thermometer, Activity, Scale, Info, CheckCircle, 
  Search, Eye, Sparkles, User, RefreshCw, AlertTriangle, Plus, Clipboard
} from 'lucide-react';
import api from '../../services/api';

const TriageDesk = () => {
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Triage input states
  const [temp, setTemp] = useState('');
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [pulse, setPulse] = useState('');
  const [respRate, setRespRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [triageLevel, setTriageLevel] = useState('green');
  
  const [triageHistory, setTriageHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  
  const [alert, setAlert] = useState({ type: '', text: '' });
  const [saveLoading, setSaveLoading] = useState(false);

  // Fetch patients on mount/refresh
  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients');
      if (response.data?.success) {
        setPatients(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'danger', text: 'Failed to fetch patients list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Fetch triage history when patient selection changes
  useEffect(() => {
    if (selectedPatient) {
      fetchHistory(selectedPatient.id);
      // Reset input fields
      setTemp('');
      setBpSys('');
      setBpDia('');
      setPulse('');
      setRespRate('');
      setSpo2('');
      setWeight('');
      setHeight('');
      setTriageLevel('green');
    } else {
      setTriageHistory([]);
    }
  }, [selectedPatient]);

  const fetchHistory = async (patientId) => {
    setHistLoading(true);
    try {
      const response = await api.get(`/triage/patient/${patientId}`);
      if (response.data?.success) {
        setTriageHistory(response.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistLoading(false);
    }
  };

  // Compute BMI dynamically
  const calculateBMI = () => {
    if (weight && height) {
      const heightM = parseFloat(height) / 100;
      return (parseFloat(weight) / (heightM * heightM)).toFixed(1);
    }
    return '-';
  };

  const handleSaveTriage = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setSaveLoading(true);
    setAlert({ type: '', text: '' });

    const payload = {
      patient_id: selectedPatient.id,
      temperature: temp ? parseFloat(temp) : null,
      blood_pressure_sys: bpSys ? parseInt(bpSys, 10) : null,
      blood_pressure_dia: bpDia ? parseInt(bpDia, 10) : null,
      pulse_rate: pulse ? parseInt(pulse, 10) : null,
      respiratory_rate: respRate ? parseInt(respRate, 10) : null,
      oxygen_saturation: spo2 ? parseFloat(spo2) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseFloat(height) : null,
      triage_level: triageLevel
    };

    try {
      const response = await api.post('/triage', payload);
      if (response.data?.success) {
        setAlert({ type: 'success', text: 'Triage vitals recorded and queued successfully.' });
        fetchHistory(selectedPatient.id);
        
        // Reset form
        setTemp('');
        setBpSys('');
        setBpDia('');
        setPulse('');
        setRespRate('');
        setSpo2('');
        setWeight('');
        setHeight('');
        setTriageLevel('green');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'danger', text: err.response?.data?.error?.message || 'Failed to save triage details.' });
    } finally {
      setSaveLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mrn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get color for triage levels
  const getTriageColor = (level) => {
    switch (level) {
      case 'red': return 'bg-danger text-white';
      case 'orange': return 'bg-warning text-dark';
      case 'yellow': return 'bg-info text-dark';
      case 'green': return 'bg-success text-white';
      case 'blue': return 'bg-primary text-white';
      default: return 'bg-secondary text-white';
    }
  };

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.5px' }}>
            Nurse Triage & Intake Desk
          </h2>
          <p className="text-muted mb-0">Assess patient clinical priority, measure vital parameters, and queue to active doctor lists.</p>
        </div>
        <button onClick={loadPatients} className="btn btn-light d-flex align-items-center gap-2 border">
          <RefreshCw size={16} />
          <span>Refresh Lists</span>
        </button>
      </div>

      {alert.text && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show py-2 px-3 small d-flex align-items-center justify-content-between mb-4`} role="alert">
          <span>{alert.text}</span>
          <button type="button" className="btn-close shadow-none small" style={{ padding: '0.75rem 1rem' }} onClick={() => setAlert({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row g-4">
        {/* Left column: Patient Selection List */}
        <div className="col-lg-5">
          <div className="card premium-card p-4 border-0 h-100">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <User size={18} className="text-primary" />
              <span>Checked-In Waiting List</span>
            </h5>
            
            <div className="input-group mb-3">
              <span className="input-group-text bg-light border-end-0 text-muted"><Search size={18} /></span>
              <input 
                type="text" 
                className="form-control border-start-0" 
                placeholder="Search patient name or MRN..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="overflow-auto" style={{ maxHeight: '520px' }}>
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border spinner-border-sm text-primary mb-2" role="status"></div>
                  <p className="small mb-0">Loading patient register...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  <Clipboard size={30} className="mb-2 text-opacity-35" />
                  <p className="mb-0">No patients waiting in queue.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredPatients.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`list-group-item list-group-item-action text-start border-0 rounded-3 mb-2 p-3 ${selectedPatient && selectedPatient.id === p.id ? 'bg-primary bg-opacity-10 border-start border-primary border-3' : 'bg-light bg-opacity-50'}`}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="fw-bold mb-1 text-dark">{p.first_name} {p.middle_name} {p.last_name}</h6>
                        <span className="badge bg-secondary text-wrap font-monospace small">{p.mrn}</span>
                      </div>
                      <p className="mb-0 small text-muted">Gender: {p.gender} | Age: {p.dob_ethiopian} E.C. ({p.dob_gregorian})</p>
                      <p className="mb-0 small text-muted font-monospace">{p.phone_number}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Triage Entry Desk */}
        <div className="col-lg-7">
          {selectedPatient ? (
            <div className="d-flex flex-column gap-4 h-100">
              {/* Triage Registration Form */}
              <div className="card premium-card p-4 border-0">
                <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-light">
                  <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
                    <Heart className="text-danger animate-pulse" size={20} />
                    <span>Intake Vital Signs Logging</span>
                  </h5>
                  <span className="badge bg-primary px-3 py-1.5 fw-bold">{selectedPatient.first_name} {selectedPatient.last_name}</span>
                </div>

                <form onSubmit={handleSaveTriage}>
                  {/* Row 1: Temperature & Oxygen */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Temperature (°C)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted"><Thermometer size={16} /></span>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="form-control" 
                          placeholder="36.5" 
                          value={temp}
                          onChange={e => setTemp(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Oxygen Saturation (SpO2 %)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted"><Activity size={16} /></span>
                        <input 
                          type="number" 
                          className="form-control" 
                          placeholder="98" 
                          value={spo2} 
                          onChange={e => setSpo2(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Triage Urgency Level</label>
                      <select 
                        className="form-select fw-bold text-dark" 
                        value={triageLevel} 
                        onChange={e => setTriageLevel(e.target.value)}
                      >
                        <option value="red" className="text-danger fw-bold">🔴 RED - Resuscitation</option>
                        <option value="orange" className="text-warning fw-bold">🟠 ORANGE - Very Urgent</option>
                        <option value="yellow" className="text-info fw-bold">🟡 YELLOW - Urgent</option>
                        <option value="green" className="text-success fw-bold">🟢 GREEN - Delayed</option>
                        <option value="blue" className="text-primary fw-bold">🔵 BLUE - Non-Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: BP & Pulse */}
                  <div className="row g-3 mb-3">
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Blood Pressure (Systolic)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="120 mmHg" 
                        value={bpSys} 
                        onChange={e => setBpSys(e.target.value)} 
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Blood Pressure (Diastolic)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="80 mmHg" 
                        value={bpDia} 
                        onChange={e => setBpDia(e.target.value)} 
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Pulse Rate (bpm)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="72 bpm" 
                        value={pulse} 
                        onChange={e => setPulse(e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Row 3: Weight, Height, BMI */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Weight (kg)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted"><Scale size={16} /></span>
                        <input 
                          type="number" 
                          step="0.1" 
                          className="form-control" 
                          placeholder="70 kg" 
                          value={weight} 
                          onChange={e => setWeight(e.target.value)} 
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Height (cm)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="175 cm" 
                        value={height} 
                        onChange={e => setHeight(e.target.value)} 
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-muted small fw-semibold">Calculated BMI</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-warning"><Sparkles size={16} /></span>
                        <input 
                          type="text" 
                          className="form-control bg-light fw-bold text-primary" 
                          value={calculateBMI()} 
                          readOnly 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="d-grid">
                    <button 
                      type="submit" 
                      disabled={saveLoading}
                      className="btn btn-primary fw-bold py-2.5 d-flex align-items-center justify-content-center gap-2"
                    >
                      {saveLoading ? 'Saving Triage Logs...' : 'Queue Vitals to Waitlist'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Triage History Log */}
              <div className="card premium-card p-4 border-0 flex-grow-1 overflow-auto" style={{ maxHeight: '300px' }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                  <Clipboard size={18} className="text-secondary" />
                  <span>Historical Vitals Records</span>
                </h5>

                {histLoading ? (
                  <div className="text-center py-4 text-muted small">Loading history...</div>
                ) : triageHistory.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No past vital records logged.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover table-sm small align-middle">
                      <thead className="table-light text-secondary">
                        <tr>
                          <th>Date</th>
                          <th>Triage Priority</th>
                          <th>BP (sys/dia)</th>
                          <th>Temp</th>
                          <th>Pulse / Resp</th>
                          <th>Weight / BMI</th>
                          <th>Logged By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {triageHistory.map(h => (
                          <tr key={h.id}>
                            <td className="text-nowrap">{new Date(h.created_at).toLocaleDateString()}</td>
                            <td>
                              <span className={`badge ${getTriageColor(h.triage_level)}`}>
                                {h.triage_level.toUpperCase()}
                              </span>
                            </td>
                            <td>{h.blood_pressure_sys && h.blood_pressure_dia ? `${h.blood_pressure_sys}/${h.blood_pressure_dia}` : '-'}</td>
                            <td>{h.temperature ? `${h.temperature} °C` : '-'}</td>
                            <td>{h.pulse_rate || '-'}/{h.respiratory_rate || '-'}</td>
                            <td>{h.weight || '-'}/{h.bmi || '-'}</td>
                            <td>Nurse {h.nurse_first}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card premium-card p-5 text-center py-5 text-muted justify-content-center h-100">
              <Clipboard size={40} className="mx-auto mb-3 text-opacity-50" />
              <p className="mb-0">Select a patient from thewaiting queue on the left to begin checking their vitals and logging triage priority levels.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriageDesk;
