export default function DocumentViewer({ doc, onClose }) {
  if (!doc?.fileData) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <p>No file data available for this document.</p>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }
  const isPdf = doc.mimeType === 'application/pdf';
  const isImage = doc.mimeType?.startsWith('image/');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{doc.name || doc.fileName || 'Document'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body doc-viewer">
          {isImage && <img src={doc.fileData} alt={doc.name} className="doc-viewer__img" />}
          {isPdf && <iframe title={doc.name} src={doc.fileData} className="doc-viewer__iframe" />}
          {!isImage && !isPdf && <p className="empty-text">Preview not available. <a href={doc.fileData} download={doc.name}>Download</a></p>}
        </div>
        <div className="modal-footer">
          <a href={doc.fileData} download={doc.name || 'document'} className="btn btn-secondary">Download</a>
          <button type="button" className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
