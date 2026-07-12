import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from '../components/ui/Accordion';
import { HelpCircle, Mail, MessageSquare, Phone, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/ui/RippleButton';
import { useToast } from '../components/Toast';
import api from '../api';

const HELP_TOPICS = [
  {
    title: 'What is Animate UI?',
    content: 'Animate UI is an open-source distribution of React components built with TypeScript, Tailwind CSS, and Motion.',
    category: 'general'
  },
  {
    title: 'How is it different from other libraries?',
    content: 'Instead of installing via NPM, you copy and paste the components directly. This gives you full control to modify or customize them as needed.',
    category: 'general'
  },
  {
    title: 'Is Animate UI free to use?',
    content: 'Absolutely! Animate UI is fully open-source. You can use, modify, and adapt it to fit your needs.',
    category: 'general'
  },
  {
    title: 'How do I request a new asset allocation?',
    content: 'To request an asset, navigate to the "Assets" tab, locate the desired asset, and click the "Request Allocation" button. Fill out the duration, purpose, and submit. The request will automatically be sent to your Department Head and the Asset Manager for review.',
    category: 'assets'
  },
  {
    title: 'What happens when an asset allocation is overdue?',
    content: 'If an allocated asset exceeds its expected return date, its status is flagged as "Overdue" automatically. You will receive real-time push notifications, and daily reminders will be active until you return the asset and the technician registers its condition.',
    category: 'assets'
  },
  {
    title: 'How does shared asset booking work?',
    content: 'Shared assets (like projectors, meeting rooms, or cameras) can be booked for specific time blocks. Go to the "Bookings" page, select a shared asset, and reserve a block. If a conflict occurs, the system will prevent the overlapping booking and suggest alternative times.',
    category: 'bookings'
  },
  {
    title: 'How do I report a damaged or faulty asset?',
    content: 'Under the "Maintenance" tab, click "Raise Request", select the asset tag, and write a description of the issue. You can set the priority (Low, Medium, High). A technician will be assigned, and the asset status will switch to "Under Maintenance" to prevent allocations.',
    category: 'maintenance'
  }
];

const Help = ({ user }) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketBody, setTicketBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredFaqs = HELP_TOPICS.filter(
    (item) => activeTab === 'all' || item.category === activeTab
  );

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketBody.trim()) {
      addToast("Please fill in both the subject and description fields.", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Create a support notification or activity log in backend to simulate contact
      await api.post('/notifications', {
        title: `Support Ticket: ${ticketSubject}`,
        message: `User ${user?.name || 'Employee'} raised support ticket: ${ticketBody}`,
        recipient_id: 1, // Notify admin (usually user 1)
        type: 'support'
      });
      addToast("Your support ticket has been raised successfully! Our team will contact you shortly.", "success");
      setTicketSubject('');
      setTicketBody('');
    } catch (err) {
      console.error(err);
      addToast("Failed to submit support ticket. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      {/* Premium Title Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-brand">
          <HelpCircle className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-wider">AssetFlow Support Hub</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Help & FAQ Center</h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Find answers to frequently asked questions, learn how to manage allocations, raise maintenance tickets, or reach out to our administration team.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-line pb-px overflow-x-auto whitespace-nowrap">
        {['all', 'general', 'assets', 'bookings', 'maintenance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all relative ${
              activeTab === tab
                ? 'border-brand text-brand font-bold'
                : 'border-transparent text-gray-400 hover:text-ink'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="active-faq-tab"
                className="absolute bottom-0 inset-x-0 h-0.5 bg-brand"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Accordion List */}
      <div className="bg-white border border-line rounded-2xl p-6 shadow-sm">
        {filteredFaqs.length > 0 ? (
          <Accordion multiple={true}>
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={faq.title} value={`faq-${index + 1}`}>
                <AccordionTrigger showArrow={true}>
                  {faq.title}
                </AccordionTrigger>
                <AccordionPanel keepRendered={false}>
                  {faq.content}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No FAQs matching your selection.</p>
          </div>
        )}
      </div>

      {/* Contact Support Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Support Channels Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-ink">Contact Admin Desk</h3>
            <p className="text-sm text-gray-500">
              Can't find the answer you need? Our IT support team is standing by to resolve any issue with your device allocation.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Mail className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">Email Desk</span>
                <span className="text-sm font-semibold text-ink">support@assetflow.com</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">Hotline</span>
                <span className="text-sm font-semibold text-ink">+1 (555) 234-5678</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-medium">Knowledge Base</span>
                <span className="text-sm font-semibold text-ink">docs.assetflow.internal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Raise Ticket Form */}
        <div className="md:col-span-2 bg-white border border-line rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div className="flex items-center gap-2 text-ink mb-2">
              <MessageSquare className="w-5 h-5 text-brand" />
              <h3 className="text-lg font-bold">Raise a Support Ticket</h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</label>
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="e.g., Dell Laptop AF-0114 charger missing"
                className="w-full text-sm border border-line rounded-xl px-4 py-2.5 outline-none focus:border-brand transition-colors"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description of the problem</label>
              <textarea
                value={ticketBody}
                onChange={(e) => setTicketBody(e.target.value)}
                placeholder="Please describe the issue with as many details as possible, including asset tag numbers and logs."
                rows={4}
                className="w-full text-sm border border-line rounded-xl px-4 py-2.5 outline-none focus:border-brand transition-colors resize-none"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <RippleButton
                variant="purple"
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider"
              >
                {submitting ? 'Submitting...' : 'Submit Support Ticket'}
              </RippleButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Help;
