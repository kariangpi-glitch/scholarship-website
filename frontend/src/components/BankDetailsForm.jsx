import { useState } from 'react';
import { detectBankFraud } from '../utils/bankHelpers';

export default function BankDetailsForm({ user, onSave }) {
  const [bank, setBank] = useState({
    accountHolder: user?.bankAccount?.accountHolder || user?.name || '',
    bankName: user?.bankAccount?.bankName || '',
    accountNumber: user?.bankAccount?.accountNumber || '',
    routingNumber: user?.bankAccount?.routingNumber || '',
  });
  const [saved, setSaved] = useState(false);
  const [warnings, setWarnings] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const fraudWarnings = detectBankFraud(user.id, bank);
    setWarnings(fraudWarnings);
    onSave({ bankAccount: bank, bankFraudFlags: fraudWarnings });
    setSaved(true);
  };

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h3 className="card-heading">Bank account for scholarship disbursement</h3>
      <p className="signup-section-desc">
        Required before any application can be approved. Funds will be sent to this account only.
      </p>
      {saved && <div className="alert alert-success">Bank details saved.</div>}
      {warnings.length > 0 && (
        <div className="alert alert-error">
          <strong>Fraud check flags:</strong>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="form-group">
        <label>Account holder name *</label>
        <input value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} required />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Bank name *</label>
          <input value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Account number *</label>
          <input value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} required />
        </div>
      </div>
      <div className="form-group">
        <label>Routing / SWIFT (optional)</label>
        <input value={bank.routingNumber} onChange={(e) => setBank({ ...bank, routingNumber: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-primary">Save bank details</button>
    </form>
  );
}
