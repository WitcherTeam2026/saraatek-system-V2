import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { useAppStore } from '../stores/app'
import { StatusBadge } from '../components/StatusBadge'
import { Card } from '../components/Card'
import { Input, Select, Textarea } from '../components/Input'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { PaymentModal } from '../components/PaymentModal'
import { open } from '@tauri-apps/plugin-dialog'
import { VALID_STATUS_TRANSITIONS, STATUS_CONFIG } from '../types'
import type { RepairWithCustomer, RepairHistory, QuotationWithItems, QuotationItem, Payment, Photo, Notification, Warranty, FieldAuditEntry } from '../types'
import { displayPhone } from '../lib/phone'

export function RepairDetail() {
  const repairId = useAppStore((s) => s.selectedRepairId)
  const navigate = useAppStore((s) => s.navigate)

  const [data, setData] = useState<RepairWithCustomer | null>(null)
  const [history, setHistory] = useState<RepairHistory[]>([])

  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')

  const [quotation, setQuotation] = useState<QuotationWithItems | null>(null)
  const [invoiceItems, setInvoiceItems] = useState<QuotationItem[]>([])
  const [payment, setPayment] = useState<Payment | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [responseNote, setResponseNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const [photos, setPhotos] = useState<Photo[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const [warranty, setWarranty] = useState<Warranty | null>(null)
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([])
  const [sendingNotif, setSendingNotif] = useState(false)

  const [auditLog, setAuditLog] = useState<FieldAuditEntry[]>([])
  const [showAuditLog, setShowAuditLog] = useState(false)

  const [showWarrantyReopenModal, setShowWarrantyReopenModal] = useState(false)

  const [showAiComposer, setShowAiComposer] = useState(false)
  const [aiGoal, setAiGoal] = useState('')
  const [aiDraft, setAiDraft] = useState('')
  const [aiSubject, setAiSubject] = useState('')
  const [aiDrafting, setAiDrafting] = useState(false)
  const [aiMode, setAiMode] = useState<'template' | 'freeform'>('template')
  const [aiSending, setAiSending] = useState(false)

  const [customerHistory, setCustomerHistory] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [repairCount, setRepairCount] = useState(0)

  const loadDataRef = useRef<() => Promise<void>>(async () => {})

  useEffect(() => {
    let cancelled = false
    const loadData = async () => {
      if (!repairId) return
      try {
        const r = await api.repairs.get(repairId)
        if (cancelled) return
        if (r) {
          setData(r)
        }
        const h = await api.repairs.history(repairId)
        if (cancelled) return; setHistory(h)

        const q = await api.quotations.getByRepair(repairId)
        if (cancelled) return; setQuotation(q)

        const inv = await api.quotations.getInvoiceItems(repairId)
        if (cancelled) return; setInvoiceItems(inv)

        const p = await api.payments.get(repairId)
        if (cancelled) return; setPayment(p)

        const ph = await api.photos.get(repairId)
        if (cancelled) return; setPhotos(ph)

        const w = await api.warranties.get(repairId)
        if (cancelled) return; setWarranty(w)

        const nh = await api.notifications.history(repairId)
        if (cancelled) return; setNotificationHistory(nh)

        const al = await api.audit.getLog(repairId)
        if (cancelled) return; setAuditLog(al)

        if (r) {
          const allRepairs = await api.repairs.list({ search: r.customer_phone })
          if (cancelled) return; setRepairCount(allRepairs.length)
        }
      } catch (e) {
        console.error('Failed to load repair data:', e)
      }
    }
    loadDataRef.current = loadData
    loadData()
    return () => { cancelled = true }
  }, [repairId])

  // Stable wrapper so handlers defined outside the effect can trigger a reload
  // without depending on the effect's internal closure.
  const loadData = () => loadDataRef.current?.()

  // Individual customers get WhatsApp drafts, Business customers get Email drafts.
  const messageChannel: 'whatsapp' | 'email' = data?.customer_type === 'business' ? 'email' : 'whatsapp'

  // The AI is asked to format email drafts as "Subject: ...\n\n<body>".
  // Split that out so we can show/send a separate subject field.
  const parseDraft = (raw: string, channel: 'whatsapp' | 'email') => {
    if (channel !== 'email') return { subject: '', body: raw }
    const match = raw.match(/^Subject:\s*(.+?)\n+([\s\S]*)$/i)
    if (match) return { subject: match[1].trim(), body: match[2].trim() }
    return { subject: '', body: raw }
  }

  const handleDraftWithAI = async () => {
    setAiMode('template')
    setAiGoal('')
    setAiDraft('')
    setAiSubject('')
    setShowAiComposer(true)
    if (!repairId) return
    setAiDrafting(true)
    try {
      const draft = await api.ai.draftMessage(repairId, 'template', messageChannel)
      const { subject, body } = parseDraft(draft, messageChannel)
      setAiSubject(subject)
      setAiDraft(body)
    } catch (e: any) {
      setAiDraft(`Error: ${e}`)
    } finally {
      setAiDrafting(false)
    }
  }

  const handleAiDraftFreeform = async () => {
    if (!repairId) return
    setAiDrafting(true)
    try {
      const draft = await api.ai.draftMessage(repairId, 'freeform', messageChannel, aiGoal)
      const { subject, body } = parseDraft(draft, messageChannel)
      setAiSubject(subject)
      setAiDraft(body)
    } catch (e: any) {
      setAiDraft(`Error: ${e}`)
    } finally {
      setAiDrafting(false)
    }
  }

  const handleAiSend = async () => {
    if (!repairId || !aiDraft.trim()) return
    setAiSending(true)
    try {
      if (messageChannel === 'email') {
        const subject = aiSubject.trim() || `Update on your repair — ${repairId}`
        await api.ai.sendCustomEmail(repairId, subject, aiDraft)
      } else {
        await api.ai.sendCustom(repairId, aiDraft)
      }
      setShowAiComposer(false)
      loadData()
    } catch (e) {
      alert('Failed to send: ' + String(e))
    } finally {
      setAiSending(false)
    }
  }

  const handleSummarizeHistory = async () => {
    if (!data) return
    setHistoryLoading(true)
    try {
      const summary = await api.ai.summarizeHistory(data.repair.customer_id)
      setCustomerHistory(summary)
    } catch (e: any) {
      setCustomerHistory(`Error: ${e}`)
    } finally {
      setHistoryLoading(false)
    }
  }

  const updateStatus = async () => {
    if (!repairId) {
      alert('No repair ID found')
      return
    }
    if (!selectedStatus) {
      alert('Please select a status')
      return
    }
    console.log('Updating status:', { repairId, selectedStatus, statusNote })
    try {
      await api.repairs.updateStatus(repairId, selectedStatus, statusNote || undefined)
      console.log('Status updated successfully')
      setShowStatusModal(false)
      setSelectedStatus('')
      setStatusNote('')
      loadData()
    } catch (e) {
      console.error('Failed to update status:', e)
      alert('Failed to update status: ' + String(e))
    }
  }

  const handleApprove = async () => {
    if (!quotation) return
    setActionLoading(true)
    try {
      await api.quotations.approve(quotation.quotation.id, responseNote || undefined)
      setShowApproveModal(false)
      setResponseNote('')
      await loadData()
    } catch (e) {
      alert('Failed to approve: ' + String(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!quotation) return
    setActionLoading(true)
    try {
      await api.quotations.decline(quotation.quotation.id, responseNote || undefined)
      setShowDeclineModal(false)
      setResponseNote('')
      await loadData()
    } catch (e) {
      alert('Failed to decline: ' + String(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleBrowsePhotos = async () => {
    if (!repairId) return
    try {
      const selected = await open({ multiple: true, filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'] }] })
      if (!selected) return
      const paths = Array.isArray(selected) ? selected : [selected]
      await api.photos.add(repairId, paths)
      loadData()
    } catch (e) {
      alert('Failed to add photos: ' + String(e))
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    if (!repairId || !e.dataTransfer.files.length) return
    try {
      const fileNames = Array.from(e.dataTransfer.files).map((f) => f.name)
      await api.photos.add(repairId, fileNames)
      loadData()
    } catch (e) {
      alert('Failed to add photos: ' + String(e))
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    try {
      await api.photos.delete(photoId)
      if (lightboxIndex !== null) setLightboxIndex(null)
      loadData()
    } catch (e) {
      alert('Failed to delete photo: ' + String(e))
    }
  }

  const handleOpenPhotosFolder = async () => {
    if (!repairId) return
    try {
      await api.photos.openFolder(repairId)
    } catch (e) {
      alert('Failed to open folder: ' + String(e))
    }
  }

  const handleSendNotification = async () => {
    if (!repairId) return
    setSendingNotif(true)
    try {
      if (messageChannel === 'email') {
        await api.notifications.sendReadyEmail(repairId)
      } else {
        await api.notifications.sendReady(repairId)
      }
      loadData()
    } catch (e) {
      alert('Failed to send notification: ' + String(e))
    } finally {
      setSendingNotif(false)
    }
  }

  const handleWarrantyReopen = async () => {
    if (!repairId) return
    setActionLoading(true)
    try {
      await api.warranties.reopen(repairId)
      setShowWarrantyReopenModal(false)
      loadData()
    } catch (e) {
      alert('Failed to reopen: ' + String(e))
    } finally {
      setActionLoading(false)
    }
  }

  const handleViewQuotation = async () => {
    if (!repairId) return
    try {
      const path = await api.pdf.generateQuotationPdfHtml(repairId, false)
      await api.pdf.openFile(path)
    } catch (e) {
      alert(String(e))
    }
  }

  const handleViewInvoice = async () => {
    if (!repairId) return
    try {
      const path = await api.pdf.generateInvoicePdfHtml(repairId, false)
      await api.pdf.openFile(path)
    } catch (e) {
      alert(String(e))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  if (!data || !repairId) {
    return <div className="text-text-muted text-center py-12">Repair not found.</div>
  }

  const transitions = VALID_STATUS_TRANSITIONS[data.repair.status] || []
  const grandTotal = quotation?.quotation.grand_total || invoiceItems.reduce((s, i) => s + i.total, 0)
  const lastNotif = notificationHistory.length > 0 ? notificationHistory[0] : null
  const isExpired = warranty ? new Date(warranty.expiry_date) < new Date() : false
  const isReturning = repairCount > 1

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('repairs-list')} className="text-sm text-text-muted hover:text-text-primary mb-1">&larr; Back to Repairs</button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">{data.repair.id}</h1>
            <StatusBadge status={data.repair.status} />
          </div>
          <div className="text-sm text-text-muted mt-1">Received: {data.repair.received_at}</div>
        </div>
        {transitions.length > 0 && (
          <Button onClick={() => setShowStatusModal(true)}>Update Status</Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Customer</h2>
          <div className="space-y-1 text-sm">
            <div className="text-text-primary font-medium">{data.customer_name}</div>
            <div className="text-text-secondary">{displayPhone(data.customer_phone)}</div>
            <div className="text-text-muted text-xs capitalize">{data.customer_type}</div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Device Info</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-text-secondary">Type:</span><span className="text-text-primary">{data.repair.device_type || '-'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Brand:</span><span className="text-text-primary">{data.repair.brand}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Model:</span><span className="text-text-primary">{data.repair.model || '-'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Serial:</span><span className="text-text-primary">{data.repair.serial_number || '-'}</span></div>
            <div className="flex justify-between"><span className="text-text-secondary">Colour:</span><span className="text-text-primary">{data.repair.color_desc || '-'}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-border-default">
            <div className="text-xs text-text-muted mb-1">Reported Problem</div>
            <div className="text-sm text-text-primary">{data.repair.reported_problem}</div>
          </div>
        </Card>
      </div>

      {/* Documents & Payment section */}

      {!quotation && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Quotation</h2>
          <p className="text-sm text-text-muted mb-4">Generate a formal quotation for this repair.</p>
          <Button onClick={() => navigate('quotation-builder', { repairId })}>
            Generate Quotation
          </Button>
        </Card>
      )}

      {quotation && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Quotation #{quotation.quotation.id}</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={quotation.quotation.status === 'pending' ? 'Awaiting Approval' : quotation.quotation.status === 'approved' ? 'Repairing' : 'Declined'} />
              {quotation.quotation.responded_at && (
                <span className="text-xs text-text-muted">Responded: {quotation.quotation.responded_at}</span>
              )}
            </div>
            {quotation.quotation.response_note && (
              <div className="text-xs text-text-muted">Note: {quotation.quotation.response_note}</div>
            )}
            <div className="text-2xl font-bold text-[#6B46C1]">LKR {quotation.quotation.grand_total.toFixed(2)}</div>
            <div className="text-xs text-text-muted">{quotation.items.length} item(s)</div>

            <div className="mt-3 flex gap-3">
              {quotation.quotation.status === 'pending' && (
                <>
                  <Button onClick={() => { setResponseNote(''); setShowApproveModal(true) }}>
                    Approve
                  </Button>
                  <Button variant="secondary" onClick={() => { setResponseNote(''); setShowDeclineModal(true) }}>
                    Decline
                  </Button>
                </>
              )}
              <Button variant="secondary" onClick={handleViewQuotation}>
                View Quotation
              </Button>
            </div>
          </div>
        </Card>
      )}

      {invoiceItems.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Invoice</h2>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-[#6B46C1]">LKR {grandTotal.toFixed(2)}</div>
            <div className="text-xs text-text-muted">{invoiceItems.length} item(s)</div>

            {payment ? (
              <div className="mt-3 pt-3 border-t border-border-default">
                <div className="text-sm font-medium text-text-primary mb-2">Payment</div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{payment.method === 'bank_transfer' ? 'Bank Transfer' : 'Cash'}</span>
                  <span className="text-text-primary font-medium">LKR {payment.amount.toFixed(2)}</span>
                </div>
                {payment.note && (
                  <div className="text-xs text-text-muted mt-1">{payment.note}</div>
                )}
                <div className="text-xs text-text-muted">Paid: {payment.paid_at}</div>
              </div>
            ) : (
              <div className="mt-3">
                <Button onClick={() => setShowPaymentModal(true)}>Record Payment</Button>
              </div>
            )}

            <div className="mt-2">
              <Button variant="secondary" onClick={handleViewInvoice}>
                View Invoice
              </Button>
            </div>
          </div>
        </Card>
      )}

      {invoiceItems.length === 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Invoice</h2>
          <p className="text-sm text-text-muted mb-4">Generate an invoice for this repair.</p>
          <div className="flex gap-3">
            <Button onClick={() => navigate('invoice-builder', { repairId })}>
              Generate Invoice
            </Button>
            {!payment && (
              <Button variant="secondary" onClick={() => setShowPaymentModal(true)}>
                Record Payment
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Phase 3: Photos Section */}
      <Card>
        <h2 className="text-lg font-semibold text-text-primary mb-4">Photos</h2>
        <div
          className="border-2 border-dashed border-border-default rounded-xl p-6 text-center cursor-pointer hover:border-brand-purple/50 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={handleBrowsePhotos}
        >
          <p className="text-sm text-text-muted">Drop photos here or click to browse</p>
        </div>

        {photos.length > 0 && (
          <>
            <div className="grid grid-cols-4 gap-3 mt-4">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={`file://${photo.file_path}`}
                    alt={photo.filename}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer border border-border-default hover:border-brand-purple transition-colors"
                    onClick={() => setLightboxIndex(idx)}
                  />
                  <button
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500/80 text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id) }}
                  >x</button>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button variant="secondary" onClick={handleOpenPhotosFolder}>
                Open Photos Folder
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Phase 3+4: Notification Section */}
      {data.repair.status === 'Ready for Collection' && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">
            Notification ({messageChannel === 'email' ? 'Email' : 'WhatsApp'})
          </h2>
          {lastNotif ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {lastNotif.status === 'sent' ? (
                  <span className="text-green-400">Sent &#10003; {lastNotif.sent_at}</span>
                ) : (
                  <span className="text-red-400">Failed — {lastNotif.fonnte_response}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleSendNotification} loading={sendingNotif}>
                  Resend Fixed Template
                </Button>
                <Button variant="secondary" onClick={handleDraftWithAI}>Draft with AI</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">
                {messageChannel === 'email'
                  ? 'Notify this business customer by email.'
                  : 'Notify the customer via WhatsApp.'}
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSendNotification} loading={sendingNotif}>
                  Send Fixed Template
                </Button>
                <Button variant="secondary" onClick={handleDraftWithAI}>Draft with AI</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Phase 4: Draft a Message with AI (always visible) */}
      {data.repair.status !== 'Ready for Collection' && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Draft Message to Customer</h2>
          <p className="text-sm text-text-muted mb-4">
            {messageChannel === 'email'
              ? 'AI will draft a professional email for this customer.'
              : 'AI will draft a WhatsApp message for this customer.'}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => { setAiMode('template'); setAiGoal(''); setAiDraft(''); setAiSubject(''); setShowAiComposer(true); handleDraftWithAI() }}>
              Draft with AI
            </Button>
            <Button variant="secondary" onClick={() => { setAiMode('freeform'); setAiGoal(''); setAiDraft(''); setAiSubject(''); setShowAiComposer(true) }}>
              Custom Message
            </Button>
          </div>
        </Card>
      )}

      {/* Phase 4: Customer History Section */}
      {isReturning && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Customer History</h2>
          {customerHistory ? (
            <div className="text-sm text-text-primary bg-bg-elevated rounded-lg p-3">
              {customerHistory}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-text-muted">This customer has {repairCount} repair(s) on record. Summarize their history for context.</p>
              <Button variant="secondary" onClick={handleSummarizeHistory} loading={historyLoading}>
                Summarize History
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Phase 3: Warranty Section */}
      {warranty && (
        <Card>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Warranty</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-text-secondary">Duration:</span> <span className="text-text-primary">{warranty.duration_label}</span></div>
            <div><span className="text-text-secondary">Start:</span> <span className="text-text-primary">{warranty.start_date}</span></div>
            <div><span className="text-text-secondary">Expires:</span> <span className={`font-medium ${isExpired ? 'text-red-400' : 'text-text-primary'}`}>{warranty.expiry_date}</span></div>
            <div><span className="text-text-secondary">Status:</span> {isExpired ? <span className="text-red-400">Expired</span> : <span className="text-green-400">Active</span>}</div>
          </div>
          {data.repair.status === 'Completed — Under Warranty' && !isExpired && (
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setShowWarrantyReopenModal(true)}>
                Reopen for Warranty Claim
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Phase 3: Audit Log Section */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-text-primary">Status History</h2>
        </div>
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="flex items-start gap-3 text-sm">
              <StatusBadge status={h.status} />
              <div className="flex-1">
                {h.note && <div className="text-text-secondary">{h.note}</div>}
              </div>
              <div className="text-xs text-text-muted whitespace-nowrap">{h.changed_at}</div>
            </div>
          ))}
        </div>

        {auditLog.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-default">
            <button
              onClick={() => setShowAuditLog(!showAuditLog)}
              className="text-sm text-brand-purple hover:text-brand-purple/80 font-medium"
            >
              {showAuditLog ? 'Hide' : 'View'} field change history ({auditLog.length})
            </button>
            {showAuditLog && (
              <div className="mt-3 space-y-2">
                {auditLog.map((entry) => (
                  <div key={entry.id} className="text-xs bg-bg-elevated rounded-lg p-2">
                    <div className="text-text-secondary font-medium mb-1">{entry.field_name}</div>
                    <div className="flex items-start gap-2">
                      <span className="text-text-muted line-through flex-1">{entry.old_value || '(empty)'}</span>
                      <span className="text-text-muted">&rarr;</span>
                      <span className="text-text-primary flex-1">{entry.new_value || '(empty)'}</span>
                    </div>
                    <div className="text-text-muted mt-1">{entry.changed_at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal open={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Status">
        <div className="space-y-4">
          <Select
            label="New Status"
            options={transitions.map((t) => ({ value: t, label: STATUS_CONFIG[t]?.label || t }))}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          />
          <Textarea label="Note (optional)" value={statusNote} onChange={(e) => setStatusNote(e.target.value)} />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button onClick={updateStatus} disabled={!selectedStatus}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showApproveModal} onClose={() => setShowApproveModal(false)} title="Approve Quotation">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Approve this quotation? The repair status will change to Repairing.</p>
          <Textarea
            label="Response Note (optional)"
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            placeholder="e.g. Customer called to approve"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button onClick={handleApprove} loading={actionLoading}>Confirm Approve</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showDeclineModal} onClose={() => setShowDeclineModal(false)} title="Decline Quotation">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Decline this quotation? The repair will be closed.</p>
          <Textarea
            label="Response Note (optional)"
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            placeholder="e.g. Customer declined via WhatsApp"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowDeclineModal(false)}>Cancel</Button>
            <Button onClick={handleDecline} loading={actionLoading} variant="secondary">Confirm Decline</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showWarrantyReopenModal} onClose={() => setShowWarrantyReopenModal(false)} title="Reopen for Warranty Claim">
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Reopen this repair for a warranty claim? The status will change to Repairing and a new service entry will be created.
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowWarrantyReopenModal(false)}>Cancel</Button>
            <Button onClick={handleWarrantyReopen} loading={actionLoading}>Confirm Reopen</Button>
          </div>
        </div>
      </Modal>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        repairId={repairId}
        grandTotal={grandTotal}
        onSuccess={() => loadData()}
      />

      {/* Phase 4: AI Message Composer Modal */}
      <Modal open={showAiComposer} onClose={() => setShowAiComposer(false)} title={aiMode === 'template' ? 'Draft with AI' : 'Compose Message'}>
        <div className="space-y-4">
          {data && (
            <div className="text-xs text-text-muted bg-bg-elevated rounded-lg p-3 space-y-1">
              <div><span className="text-text-secondary">Customer:</span> {data.customer_name} ({displayPhone(data.customer_phone)})</div>
              <div><span className="text-text-secondary">Device:</span> {data.repair.brand} {data.repair.model || ''}</div>
              <div><span className="text-text-secondary">Status:</span> {data.repair.status}</div>
              <div><span className="text-text-secondary">Channel:</span> {messageChannel === 'email' ? 'Email' : 'WhatsApp'}</div>
            </div>
          )}

          {aiMode === 'freeform' && (
            <>
              <Textarea
                label="What do you want to tell the customer?"
                value={aiGoal}
                onChange={(e) => setAiGoal(e.target.value)}
                placeholder="e.g. tell him the part is delayed, available next Tuesday"
              />
              <Button onClick={handleAiDraftFreeform} loading={aiDrafting} disabled={!aiGoal.trim()}>
                Draft Message
              </Button>
            </>
          )}

          {aiMode === 'template' && aiDrafting && (
            <div className="text-sm text-text-muted text-center py-4">Drafting with AI...</div>
          )}

          {aiDraft && !aiDrafting && (
            <div className="space-y-3">
              {messageChannel === 'email' && (
                <Input
                  label="Subject"
                  value={aiSubject}
                  onChange={(e) => setAiSubject(e.target.value)}
                  placeholder={`Update on your repair — ${repairId}`}
                />
              )}
              <Textarea
                label="Drafted Message (editable)"
                value={aiDraft}
                onChange={(e) => setAiDraft(e.target.value)}
                rows={6}
              />
              <div className="flex gap-3">
                <Button onClick={handleAiSend} loading={aiSending}>Send</Button>
                <Button variant="secondary" onClick={aiMode === 'template' ? handleDraftWithAI : handleAiDraftFreeform}>
                  Regenerate
                </Button>
                <Button variant="secondary" onClick={() => setShowAiComposer(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <div className="relative max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={`file://${photos[lightboxIndex].file_path}`}
              alt={photos[lightboxIndex].filename}
              className="max-w-full max-h-[85vh] rounded-lg"
            />
            <div className="absolute top-2 right-2 flex gap-2">
<button
  className="w-8 h-8 bg-black/50 text-white rounded-full text-sm hover:bg-black/70"
  title="Delete photo"
  onClick={() => { const id = photos[lightboxIndex]?.id; if (id !== undefined && confirm('Delete this photo?')) handleDeletePhoto(id) }}
>&#x1F5D1;</button>
              <button
                className="w-8 h-8 bg-black/50 text-white rounded-full text-sm hover:bg-black/70"
                onClick={() => setLightboxIndex(null)}
              >&#x2715;</button>
            </div>
            {photos.length > 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  className="w-10 h-10 bg-black/50 text-white rounded-full text-lg hover:bg-black/70 disabled:opacity-30"
                  disabled={lightboxIndex === null || lightboxIndex <= 0}
                  onClick={() => setLightboxIndex(Math.max(0, lightboxIndex! - 1))}
                >&#x276E;</button>
                <button
                  className="w-10 h-10 bg-black/50 text-white rounded-full text-lg hover:bg-black/70 disabled:opacity-30"
                  disabled={lightboxIndex === null || lightboxIndex >= photos.length - 1}
                  onClick={() => setLightboxIndex(Math.min(photos.length - 1, lightboxIndex! + 1))}
                >&#x276F;</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
