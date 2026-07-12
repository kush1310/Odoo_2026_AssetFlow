import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CalendarDays, 
  CalendarCheck, 
  ShieldAlert, 
  ShieldCheck, 
  Plus, 
  Clock, 
  Trash2 
} from 'lucide-react';

const Bookings = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookAsset, setBookAsset] = useState('');
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [resAssets, resBookings, resEmps] = await Promise.all([
        axios.get('http://localhost:8000/api/assets', { headers }),
        axios.get('http://localhost:8000/api/bookings', { headers }),
        axios.get('http://localhost:8000/api/employees', { headers })
      ]);

      // Only bookable resources
      setAssets(resAssets.data.filter(a => a.shared_flag === true));
      setBookings(resBookings.data);
      setEmployees(resEmps.data);
    } catch (err) {
      setError("Failed to load booking schedule.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const startDt = new Date(bookStart);
    const endDt = new Date(bookEnd);

    if (endDt <= startDt) {
      setError("End datetime must be strictly after start datetime.");
      return;
    }

    if (startDt < new Date()) {
      setError("Start datetime cannot be in the past.");
      return;
    }

    // Client-side overlap validation
    const localOverlap = bookings.find(b => 
      b.asset_id === parseInt(bookAsset) &&
      b.status !== 'Cancelled' &&
      new Date(b.end_time) > startDt &&
      new Date(b.start_time) < endDt
    );

    if (localOverlap) {
      const conflictingEmp = employees.find(e => e.id === localOverlap.booked_by_id);
      setError(`Overlap Collision: This resource is already booked by ${conflictingEmp?.name || "another custodian"} from ${new Date(localOverlap.start_time).toLocaleString()} to ${new Date(localOverlap.end_time).toLocaleString()}.`);
      setShowBookModal(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8000/api/bookings', {
        asset_id: parseInt(bookAsset),
        start_time: startDt.toISOString(),
        end_time: endDt.toISOString(),
        purpose: bookPurpose
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Resource successfully booked!");
      setShowBookModal(false);
      setBookAsset('');
      setBookStart('');
      setBookEnd('');
      setBookPurpose('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Booking failed.");
    }
  };

  const cancelBooking = async (id) => {
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8000/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Booking cancelled. Slot released.");
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Cancellation failed.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-white">Resource Bookings</h2>
          <p className="text-xs text-slate-400">Schedule shared rooms, equipment, or pool vehicles without overlap conflicts.</p>
        </div>
        <button 
          onClick={() => setShowBookModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-md shadow-indigo-600/10"
        >
          <CalendarDays className="w-4 h-4" />
          <span>New Booking</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/45 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-950/45 border border-emerald-800 text-emerald-200 text-xs rounded-xl flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Booking schedule list */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl shadow-xl flex flex-col gap-6">
        <h3 className="font-bold text-sm text-slate-200">Active Schedules</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Scheduled By</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">No scheduled bookings.</td>
                </tr>
              ) : (
                bookings.map(book => {
                  const assetObj = assets.find(a => a.id === book.asset_id);
                  const empObj = employees.find(e => e.id === book.booked_by_id);
                  return (
                    <tr key={book.id} className="hover:bg-slate-850/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {assetObj?.name || `Resource ID ${book.asset_id}`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">{empObj?.name || `User ID ${book.booked_by_id}`}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(book.start_time).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-400">{new Date(book.end_time).toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-slate-450 italic">"{book.purpose}"</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border
                          ${book.status === 'Upcoming' ? 'bg-blue-950/40 text-blue-300 border-blue-800' : ''}
                          ${book.status === 'Ongoing' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800' : ''}
                          ${book.status === 'Completed' ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : ''}
                          ${book.status === 'Cancelled' ? 'bg-slate-950/40 text-slate-400 border-slate-850' : ''}
                        `}>
                          {book.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {book.status !== 'Cancelled' && (
                          <button 
                            onClick={() => cancelBooking(book.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Cancel Booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <form onSubmit={handleBooking} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Resource Booking</h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Select Shared Asset</label>
              <select 
                required
                value={bookAsset} 
                onChange={(e) => setBookAsset(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              >
                <option value="">Select Resource</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Start Time</label>
              <input 
                type="datetime-local" 
                required
                value={bookStart} 
                onChange={(e) => setBookStart(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">End Time</label>
              <input 
                type="datetime-local" 
                required
                value={bookEnd} 
                onChange={(e) => setBookEnd(e.target.value)}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-300"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400">Booking Purpose</label>
              <textarea 
                required
                value={bookPurpose} 
                onChange={(e) => setBookPurpose(e.target.value)}
                placeholder="e.g. Weekly Design Sprint Meeting..."
                rows="3"
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button 
                type="button" 
                onClick={() => setShowBookModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold rounded-lg transition"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Bookings;
