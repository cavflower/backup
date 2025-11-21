import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../store/AuthContext';
import './ScheduleManagementPage.css';

const shiftPresets = {
  morning: {
    label: '早班',
    defaultStart: { hour: 8, minute: 0 },
    defaultEnd: { hour: 12, minute: 0 },
  },
  noon: {
    label: '午班',
    defaultStart: { hour: 12, minute: 0 },
    defaultEnd: { hour: 17, minute: 0 },
  },
  evening: {
    label: '晚班',
    defaultStart: { hour: 17, minute: 0 },
    defaultEnd: { hour: 22, minute: 0 },
  },
};

const formatTwoDigits = (value) => String(value).padStart(2, '0');

const defaultShiftForm = {
  date: '',
  shiftType: 'morning',
  role: '',
  staffNeeded: 1,
  startHour: shiftPresets.morning.defaultStart.hour,
  startMinute: shiftPresets.morning.defaultStart.minute,
  endHour: shiftPresets.morning.defaultEnd.hour,
  endMinute: shiftPresets.morning.defaultEnd.minute,
  assignedStaffIds: [],
  status: 'pending',
};

const defaultStaffForm = {
  name: '',
  role: '',
  status: '',
};

const initialStaff = [
  { id: 1, name: '小美', role: '外場', status: '本週可排' },
  { id: 2, name: '阿強', role: '外場', status: '可支援午班' },
  { id: 3, name: '庭瑜', role: '吧台', status: '夜班首選' },
  { id: 4, name: '阿傑', role: '主廚', status: '午班固定' },
  { id: 5, name: '心怡', role: '甜點', status: '可支援任何時段' },
];

const buildShiftName = ({ shiftType, startHour, startMinute, endHour, endMinute }) => {
  const presetLabel = shiftPresets[shiftType]?.label || '';
  return `${presetLabel} (${formatTwoDigits(startHour)}:${formatTwoDigits(startMinute)} - ${formatTwoDigits(
    endHour
  )}:${formatTwoDigits(endMinute)})`;
};

const initialShifts = [
  {
    id: 1,
    date: '2025-11-21',
    shiftType: 'morning',
    role: '外場服務',
    staffNeeded: 3,
    startHour: shiftPresets.morning.defaultStart.hour,
    startMinute: shiftPresets.morning.defaultStart.minute,
    endHour: shiftPresets.morning.defaultEnd.hour,
    endMinute: shiftPresets.morning.defaultEnd.minute,
    assignedStaffIds: [],
    status: 'pending',
    shiftName: buildShiftName({
      shiftType: 'morning',
      startHour: shiftPresets.morning.defaultStart.hour,
      startMinute: shiftPresets.morning.defaultStart.minute,
      endHour: shiftPresets.morning.defaultEnd.hour,
      endMinute: shiftPresets.morning.defaultEnd.minute,
    }),
  },
  {
    id: 2,
    date: '2025-11-21',
    shiftType: 'evening',
    role: '內場廚房',
    staffNeeded: 2,
    startHour: shiftPresets.evening.defaultStart.hour,
    startMinute: shiftPresets.evening.defaultStart.minute,
    endHour: shiftPresets.evening.defaultEnd.hour,
    endMinute: shiftPresets.evening.defaultEnd.minute,
    assignedStaffIds: [],
    status: 'pending',
    shiftName: buildShiftName({
      shiftType: 'evening',
      startHour: shiftPresets.evening.defaultStart.hour,
      startMinute: shiftPresets.evening.defaultStart.minute,
      endHour: shiftPresets.evening.defaultEnd.hour,
      endMinute: shiftPresets.evening.defaultEnd.minute,
    }),
  },
];

const statusOptions = [
  { value: 'ready', label: '準備就緒' },
  { value: 'ongoing', label: '進行中' },
  { value: 'pending', label: '待排班' },
];

const ScheduleManagementPage = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shiftForm, setShiftForm] = useState(defaultShiftForm);
  const [staffForm, setStaffForm] = useState(defaultStaffForm);
  const [editingShiftId, setEditingShiftId] = useState(null);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');

  // 取得店家特定的 localStorage key
  const getStorageKey = () => {
    if (!user) return null;
    const merchantId = user.id || user.firebase_uid || user.username;
    return `merchantScheduleData_${merchantId}`;
  };

  // 當用戶改變時，載入該店家的資料
  useEffect(() => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      // 如果沒有用戶，重置為空值
      setShifts([]);
      setStaff([]);
      setShiftForm(defaultShiftForm);
      setStaffForm(defaultStaffForm);
      setEditingShiftId(null);
      setEditingStaffId(null);
      return;
    }

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.shifts) setShifts(parsed.shifts);
        if (parsed?.staff) setStaff(parsed.staff);
      } catch (error) {
        console.error('Failed to parse stored schedule data', error);
        // 如果解析失敗，重置為空值
        setShifts([]);
        setStaff([]);
      }
    } else {
      // 如果沒有儲存的資料，顯示空值
      setShifts([]);
      setStaff([]);
    }
    // 重置編輯狀態
    setShiftForm(defaultShiftForm);
    setStaffForm(defaultStaffForm);
    setEditingShiftId(null);
    setEditingStaffId(null);
  }, [user]);

  const staffIdSet = useMemo(() => new Set(staff.map((member) => member.id)), [staff]);

  const summary = useMemo(() => {
    const totalNeeded = shifts.reduce((sum, shift) => sum + shift.staffNeeded, 0);
    const totalAssigned = shifts.reduce(
      (sum, shift) => sum + shift.assignedStaffIds.filter((id) => staffIdSet.has(id)).length,
      0
    );
    return {
      totalNeeded,
      totalAssigned,
      shortage: Math.max(totalNeeded - totalAssigned, 0),
    };
  }, [shifts, staffIdSet]);

  const handleShiftFormChange = (event) => {
    const { name, value } = event.target;
    setShiftForm((prev) => ({
      ...prev,
      [name]:
        name === 'staffNeeded' ||
        name === 'startHour' ||
        name === 'startMinute' ||
        name === 'endHour' ||
        name === 'endMinute'
          ? Number(value)
          : value,
    }));
  };

  const handleStaffFormChange = (event) => {
    const { name, value } = event.target;
    setStaffForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTimeInputChange = (field, value, max) => {
    const sanitized = value.replace(/[^\d]/g, '');
    const numeric = sanitized === '' ? 0 : Math.min(max, Math.max(0, Number(sanitized)));
    setShiftForm((prev) => ({
      ...prev,
      [field]: numeric,
    }));
  };

  const handleShiftSubmit = (event) => {
    event.preventDefault();
    if (!shiftForm.date || !shiftForm.role) return;

    const shiftName = buildShiftName(shiftForm);

    if (editingShiftId) {
      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === editingShiftId
            ? { ...shift, ...shiftForm, shiftName, assignedStaffIds: shiftForm.assignedStaffIds }
            : shift
        )
      );
    } else {
      setShifts((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...shiftForm,
          shiftName,
        },
      ]);
    }

    setShiftForm(defaultShiftForm);
    setEditingShiftId(null);
  };

  const handleStaffSubmit = (event) => {
    event.preventDefault();
    if (!staffForm.name || !staffForm.role) return;

    if (editingStaffId) {
      setStaff((prev) =>
        prev.map((member) =>
          member.id === editingStaffId ? { ...member, ...staffForm } : member
        )
      );
    } else {
      setStaff((prev) => [
        ...prev,
        { id: Date.now(), ...staffForm },
      ]);
    }

    setStaffForm(defaultStaffForm);
    setEditingStaffId(null);
  };

  const handleShiftEdit = (shift) => {
    setShiftForm({
      date: shift.date,
      shiftType: shift.shiftType,
      role: shift.role,
      staffNeeded: shift.staffNeeded,
      startHour: shift.startHour,
      startMinute: shift.startMinute,
      endHour: shift.endHour,
      endMinute: shift.endMinute,
      assignedStaffIds: shift.assignedStaffIds,
      status: shift.status,
    });
    setEditingShiftId(shift.id);
  };

  const handleStaffEdit = (member) => {
    setStaffForm({
      name: member.name,
      role: member.role,
      status: member.status,
    });
    setEditingStaffId(member.id);
  };

  const handleShiftDelete = (id) => {
    setShifts((prev) => prev.filter((shift) => shift.id !== id));
    if (editingShiftId === id) {
      setShiftForm(defaultShiftForm);
      setEditingShiftId(null);
    }
  };

  const handleStaffDelete = (id) => {
    setStaff((prev) => prev.filter((member) => member.id !== id));
    setShifts((prev) =>
      prev.map((shift) => ({
        ...shift,
        assignedStaffIds: shift.assignedStaffIds.filter((staffId) => staffId !== id),
      }))
    );
    if (editingStaffId === id) {
      setStaffForm(defaultStaffForm);
      setEditingStaffId(null);
    }
  };

  const handleExport = () => {
    if (!shifts.length) return;
    const rows = [
      ['日期', '時段', '職務', '需求人數', '已排人員', '狀態'],
      ...shifts.map((shift) => [
        shift.date,
        shift.shiftName,
        shift.role,
        shift.staffNeeded,
        shift.assignedStaffIds
          .map((id) => staff.find((member) => member.id === id)?.name || '')
          .filter(Boolean)
          .join(' / '),
        statusOptions.find((opt) => opt.value === shift.status)?.label || shift.status,
      ]),
    ];
    const csvContent = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `排班表_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const assignedIdsExceptCurrent = useMemo(() => {
    const ids = new Set();
    shifts.forEach((shift) => {
      if (shift.id === editingShiftId) return;
      shift.assignedStaffIds.forEach((id) => ids.add(id));
    });
    return ids;
  }, [shifts, editingShiftId]);

  const availableStaffForForm = staff.filter(
    (member) => !assignedIdsExceptCurrent.has(member.id) || shiftForm.assignedStaffIds.includes(member.id)
  );

  const handleStaffSelectChange = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => Number(option.value));
    setShiftForm((prev) => ({
      ...prev,
      assignedStaffIds: values,
    }));
  };

  const formatTimeRange = (shift) =>
    `${formatTwoDigits(shift.startHour)}:${formatTwoDigits(shift.startMinute)} - ${formatTwoDigits(
      shift.endHour
    )}:${formatTwoDigits(shift.endMinute)}`;

  const handleSaveAll = () => {
    const storageKey = getStorageKey();
    if (!storageKey) {
      setSaveStatus('請先登入店家帳號');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    const payload = { shifts, staff };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    setSaveStatus('已儲存最新資料');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  return (
    <div className="schedule-page">
      <header className="schedule-header">
        <div>
          <p className="page-subtitle">店家管理 / 排班管理</p>
          <h1>排班管理</h1>
          <p className="page-description">規劃日常班表、管理員工資料並可匯出班表。</p>
        </div>
        <div className="header-actions">
          <button className="ghost-btn" onClick={handleSaveAll}>
            儲存最新資料
          </button>
          <button className="primary-btn" onClick={handleExport}>
            匯出班表 (CSV)
          </button>
        </div>
      </header>
      {saveStatus && <p className="save-status">{saveStatus}</p>}

      <section className="summary-grid">
        <div className="summary-card">
          <p className="summary-label">需求人數</p>
          <h2>{summary.totalNeeded} 位</h2>
        </div>
        <div className="summary-card">
          <p className="summary-label">已排人數</p>
          <h2>{summary.totalAssigned} 位</h2>
        </div>
        <div className="summary-card">
          <p className="summary-label">缺口</p>
          <h2 className={summary.shortage ? 'text-warning' : ''}>
            {summary.shortage ? `缺 ${summary.shortage} 位` : '0'}
          </h2>
        </div>
      </section>

      <section className="manage-grid">
        <div className="schedule-card">
          <div className="card-header">
            <h3>{editingShiftId ? '編輯排班時段' : '新增排班時段'}</h3>
          </div>
          <form className="shift-form" onSubmit={handleShiftSubmit}>
            <label>
              日期
              <input type="date" name="date" value={shiftForm.date} onChange={handleShiftFormChange} />
            </label>
            <label>
              時段名稱
              <select
                name="shiftType"
                value={shiftForm.shiftType}
                onChange={(e) => {
                  const type = e.target.value;
                  setShiftForm((prev) => ({
                    ...prev,
                    shiftType: type,
                    startHour: shiftPresets[type].defaultStart.hour,
                    startMinute: shiftPresets[type].defaultStart.minute,
                    endHour: shiftPresets[type].defaultEnd.hour,
                    endMinute: shiftPresets[type].defaultEnd.minute,
                  }));
                }}
              >
                {Object.entries(shiftPresets).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              需求職務
              <input
                type="text"
                name="role"
                value={shiftForm.role}
                placeholder="外場／內場／外送"
                onChange={handleShiftFormChange}
              />
            </label>
            <label className="time-inputs">
              開始時間
              <div className="time-pickers">
                <input
                  type="text"
                  inputMode="numeric"
                  min="0"
                  max="23"
                  name="startHour"
                  value={formatTwoDigits(shiftForm.startHour)}
                  onChange={(e) => handleTimeInputChange('startHour', e.target.value, 23)}
                />
                <span>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  name="startMinute"
                  value={formatTwoDigits(shiftForm.startMinute)}
                  onChange={(e) => handleTimeInputChange('startMinute', e.target.value, 59)}
                />
              </div>
            </label>
            <label className="time-inputs">
              結束時間
              <div className="time-pickers">
                <input
                  type="text"
                  inputMode="numeric"
                  min="0"
                  max="23"
                  name="endHour"
                  value={formatTwoDigits(shiftForm.endHour)}
                  onChange={(e) => handleTimeInputChange('endHour', e.target.value, 23)}
                />
                <span>:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  name="endMinute"
                  value={formatTwoDigits(shiftForm.endMinute)}
                  onChange={(e) => handleTimeInputChange('endMinute', e.target.value, 59)}
                />
              </div>
            </label>
            <label>
              需求人數
              <input
                type="number"
                min="1"
                name="staffNeeded"
                value={shiftForm.staffNeeded}
                onChange={handleShiftFormChange}
              />
            </label>
            <label>
              已指派員工
              {availableStaffForForm.length === 0 && shiftForm.assignedStaffIds.length === 0 ? (
                <div className="no-staff-box">目前沒有可指派員工</div>
              ) : (
                <>
                  <select
                    multiple
                    className="staff-multi-select"
                    value={shiftForm.assignedStaffIds.map(String)}
                    onChange={handleStaffSelectChange}
                  >
                    {availableStaffForForm.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}（{member.role}）
                      </option>
                    ))}
                  </select>
                  <p className="helper-text">提示：按住 Ctrl 或 ⌘ 可多選員工</p>
                </>
              )}
              {shiftForm.assignedStaffIds.length > 0 && (
                <div className="selected-staff">
                  {shiftForm.assignedStaffIds.map((staffId) => {
                    const member = staff.find((item) => item.id === staffId);
                    if (!member) return null;
                    return (
                      <span key={member.id} className="staff-chip selected">
                        {member.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </label>
            <label>
              狀態
              <select name="status" value={shiftForm.status} onChange={handleShiftFormChange}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              {editingShiftId && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setShiftForm(defaultShiftForm);
                    setEditingShiftId(null);
                  }}
                >
                  取消編輯
                </button>
              )}
              <button type="submit" className="primary-btn fill">
                {editingShiftId ? '更新時段' : '新增時段'}
              </button>
            </div>
          </form>
        </div>

        <div className="schedule-card">
          <div className="card-header">
            <h3>{editingStaffId ? '編輯員工' : '新增員工'}</h3>
          </div>
          <form className="staff-form" onSubmit={handleStaffSubmit}>
            <label>
              姓名
              <input type="text" name="name" value={staffForm.name} onChange={handleStaffFormChange} />
            </label>
            <label>
              職務
              <input type="text" name="role" value={staffForm.role} onChange={handleStaffFormChange} />
            </label>
            <label>
              備註／出勤狀態
              <input type="text" name="status" value={staffForm.status} onChange={handleStaffFormChange} />
            </label>
            <div className="form-actions">
              {editingStaffId && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setStaffForm(defaultStaffForm);
                    setEditingStaffId(null);
                  }}
                >
                  取消編輯
                </button>
              )}
              <button type="submit" className="primary-btn fill">
                {editingStaffId ? '更新員工' : '新增員工'}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="schedule-card full-width">
        <div className="card-header">
          <h3>排班列表</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>時段</th>
                <th>職務 / 時間</th>
                <th>需求人數</th>
                <th>已排人員</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {shifts.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">
                    尚未建立任何班表
                  </td>
                </tr>
              )}
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{shift.date}</td>
                  <td>
                    <p className="table-shift-name">{shiftPresets[shift.shiftType].label}</p>
                    <p className="table-shift-time">{formatTimeRange(shift)}</p>
                  </td>
                  <td>{shift.role}</td>
                  <td>{shift.staffNeeded}</td>
                  <td>
                    {shift.assignedStaffIds
                      .map((id) => staff.find((member) => member.id === id)?.name)
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </td>
                  <td>{statusOptions.find((opt) => opt.value === shift.status)?.label || shift.status}</td>
                  <td className="table-actions">
                    <button className="text-btn" onClick={() => handleShiftEdit(shift)}>
                      編輯
                    </button>
                    <button className="text-btn danger" onClick={() => handleShiftDelete(shift.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="schedule-card full-width">
        <div className="card-header">
          <h3>員工列表</h3>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>職務</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty">
                    尚未新增員工
                  </td>
                </tr>
              )}
              {staff.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.role}</td>
                  <td>{member.status || '-'}</td>
                  <td className="table-actions">
                    <button className="text-btn" onClick={() => handleStaffEdit(member)}>
                      編輯
                    </button>
                    <button className="text-btn danger" onClick={() => handleStaffDelete(member.id)}>
                      刪除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ScheduleManagementPage;

