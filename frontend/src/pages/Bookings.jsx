import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Trash2,
  CalendarCheck,
  X,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const Bookings = ({ user }) => {
  const [assets, setAssets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // Form states
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookAsset, setBookAsset] = useState('');
  const [bookStart, setBookStart] = useState('');
  const [bookEnd, setBookEnd] = useState('');
  const [bookPurpose, setBookPurpose] = useState('');
  
  // Cancel confirmation dialog state
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Shake animation trigger
  const [shake, setShake] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');

  const loadData = async () => {
    try {
      const [resAssets, resBookings, resEmps] = await Promise.all([
        api.get('/assets'),
        api.get('/bookings'),
        api.get('/employees')
      ]);

      // Only bookable resources
      setAssets(resAssets.data.filter(a => a.shared_flag === true));
      setBookings(resBookings.data);
      setEmployees(resEmps.data);
    } catch (err) {
      addToast("Failed to load booking schedule.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerShake = (msg) => {
    setConflictMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500); // Reset shake state after animation
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setConflictMsg('');

    const startDt = new Date(bookStart + "T00:00:00");
    const endDt = new Date(bookEnd + "T23:59:59");

    if (endDt < startDt) {
      triggerShake("End date must be after or equal to start date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDt < today) {
      triggerShake("Start date cannot be in the past.");
      return;
    }

    // Client-side overlap validation (to pre-empt server 409)
    const localOverlap = bookings.find(b => 
      b.asset_id === parseInt(bookAsset) &&
      b.status !== 'Cancelled' &&
      new Date(b.end_time) >= startDt &&
      new Date(b.start_time) <= endDt
    );

    if (localOverlap) {
      const conflictingEmp = employees.find(e => e.id === localOverlap.booked_by_id);
      triggerShake(`Conflict: Already booked by ${conflictingEmp?.name || "someone"} during this time.`);
      return;
    }

    try {
      await api.post('/bookings', {
        asset_id: parseInt(bookAsset),
        start_time: startDt.toISOString(),
        end_time: endDt.toISOString(),
        purpose: bookPurpose
      });
      addToast("Resource successfully booked!", "success");
      setShowBookModal(false);
      setBookAsset('');
      setBookStart('');
      setBookEnd('');
      setBookPurpose('');
      loadData();
    } catch (err) {
      if (err.response?.status === 409) {
        triggerShake(err.response.data.detail || "Time slot conflict.");
      } else {
        addToast(err.response?.data?.detail || "Booking failed.", "error");
      }
    }
  };

  const handleCancelClick = (book) => {
    const asset = assets.find(a => a.id === book.asset_id);
    setConfirmCancel({ ...book, asset_name: asset?.name || 'Resource' });
  };

  const executeCancel = async () => {
    if (!confirmCancel) return;
    try {
      await api.post(`/bookings/${confirmCancel.id}/cancel`);
      addToast("Booking cancelled successfully.", "success");
      loadData();
    } catch (err) {
      addToast(err.response?.data?.detail || "Cancel failed.", "error");
    } finally {
      setConfirmCancel(null);
    }
  };

  // Group bookings by date for the calendar view
  const groupedBookings = bookings
    .filter(b => b.status !== 'Cancelled') // Only show active/completed in calendar view usually, or all
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .reduce((acc, booking) => {
      const dateKey = new Date(booking.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      return acc;
    }, {});

  const shakeVariants = {
    shake: { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Resource Bookings</h2>
          <p className="text-sm text-slate-400 font-medium">Schedule shared rooms, equipment, or pool vehicles without overlap conflicts.</p>
        </div>
        <button 
          onClick={() => setShowBookModal(true)}
          className="btn btn-primary whitespace-nowrap relative z-10"
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          New Booking
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
            <CalendarCheck className="w-5 h-5 text-brand" />
            <h3 className="font-extrabold text-lg text-slate-900">Upcoming Schedule</h3>
          </div>
          
          {Object.keys(groupedBookings).length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
              <CalendarDays className="w-12 h-12 text-gray-200" />
              <p>No active bookings scheduled.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(groupedBookings).map(([date, dayBookings]) => (
                <div key={date} className="flex flex-col md:flex-row gap-4 md:gap-8">
                  {/* Left Column: Date */}
                  <div className="md:w-32 shrink-0">
                    <div className="sticky top-6 flex flex-col items-start md:items-end md:text-right">
                      <span className="text-xs font-bold text-brand uppercase tracking-wider">{date.split(',')[0]}</span>
                      <span className="text-lg font-bold text-ink">{date.split(',')[1]}</span>
                    </div>
                  </div>
                  
                  {/* Right Column: Events */}
                  <div className="flex-1 flex flex-col gap-3 border-l-2 border-line pl-4 md:pl-6 relative">
                    {/* Time indicator line */}
                    {dayBookings.map((book, idx) => {
                      const assetObj = assets.find(a => a.id === book.asset_id);
                      const empObj = employees.find(e => e.id === book.booked_by_id);
                      
                      const start = new Date(book.start_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      const end = new Date(book.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                      const dateRange = start === end ? start : `${start} - ${end}`;
                      
                      const isOngoing = book.status === 'Ongoing';
                      
                      return (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          key={book.id} 
                          className={`relative p-5 rounded-2xl border transition-all shadow-sm group
                            ${isOngoing 
                              ? 'bg-brand/[0.03] border-brand/30 shadow-brand/5' 
                              : 'bg-white border-line hover:border-gray-300 hover:shadow-md'
                            }
                          `}
                        >
                          {/* Dot marker */}
                          <div className={`absolute -left-[21px] md:-left-[29px] top-6 w-3 h-3 rounded-full ring-4 ring-white
                            ${isOngoing ? 'bg-brand' : 'bg-gray-300'}
                          `}></div>
                          
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-gray-50 border border-gray-200/60 ${isOngoing ? 'text-brand' : 'text-gray-500'}`}>
                                  {dateRange}
                                </span>
                                {isOngoing && <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
                                </span>}
                              </div>
                              <h4 className="font-bold text-ink text-lg tracking-tight">{assetObj?.name || `Resource ID ${book.asset_id}`}</h4>
                              <p className="text-sm text-gray-500 font-medium italic">"{book.purpose}"</p>
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                                <span>Reserved By:</span>
                                <span className="text-gray-700 font-bold">{empObj?.name || `User ${book.booked_by_id}`}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t border-line md:border-0 pt-3 md:pt-0 mt-2 md:mt-0">
                              <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border
                                ${book.status === 'Upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                ${book.status === 'Ongoing' ? 'bg-brand/10 text-brand border-brand/20' : ''}
                                ${book.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                              `}>
                                {book.status}
                              </span>
                              
                              {book.status !== 'Cancelled' && book.status !== 'Completed' && (
                                <button 
                                  onClick={() => handleCancelClick(book)}
                                  className="p-1.5 hover:bg-white text-gray-400 hover:text-rust rounded-lg transition"
                                  title="Cancel Booking"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL */}
      <AnimatePresence>
        {showBookModal && createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-ink/65 backdrop-blur-md"
              onClick={() => setShowBookModal(false)}
            />
            
            <motion.form 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              variants={shakeVariants}
              animate={shake ? "shake" : { opacity: 1, scale: 1, y: 0 }}
              onSubmit={handleBooking} 
              className="relative w-full max-w-md bg-white border border-line rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-10"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg text-ink flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-brand" /> Create Booking
                </h3>
                <button type="button" onClick={() => setShowBookModal(false)} className="text-gray-400 hover:text-ink"><X className="w-5 h-5"/></button>
              </div>

              <AnimatePresence>
                {conflictMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-rust text-sm font-medium flex gap-2 items-start"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{conflictMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="label">Select Shared Asset</label>
                <select 
                  required value={bookAsset} onChange={(e) => {setBookAsset(e.target.value); setConflictMsg('');}}
                  className="input-field"
                >
                  <option value="">Select Resource...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date</label>
                  <input 
                    type="date" required value={bookStart} onChange={(e) => {setBookStart(e.target.value); setConflictMsg('');}}
                    className="input-field px-3"
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input 
                    type="date" required value={bookEnd} onChange={(e) => {setBookEnd(e.target.value); setConflictMsg('');}}
                    className="input-field px-3"
                  />
                </div>
              </div>

              <div>
                <label className="label">Booking Purpose</label>
                <textarea 
                  required value={bookPurpose} onChange={(e) => {setBookPurpose(e.target.value); setConflictMsg('');}}
                  placeholder="e.g. Weekly Design Sprint Meeting..." rows="2"
                  className="input-field h-auto py-2"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-line mt-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Booking</button>
              </div>
            </motion.form>
          </div>,
          document.body
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!confirmCancel}
        title="Cancel Booking"
        message={`Are you sure you want to cancel your booking for ${confirmCancel?.asset_name}? This action cannot be undone.`}
        confirmText="Yes, Cancel Booking"
        cancelText="No, Keep It"
        onConfirm={executeCancel}
        onCancel={() => setConfirmCancel(null)}
        isDestructive={true}
      />
    </div>
  );
};

export default Bookings;
