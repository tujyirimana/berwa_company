import React, { useState } from 'react';
import axios from 'axios';

const Reports = () => {
  const [reportOptions, setReportOptions] = useState({
    reportType: 'all',
    includeAddress: true,
    includeNotes: false,
    sortBy: 'name',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generateReport = async (format) => {
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      // Convert options to query parameters
      const params = new URLSearchParams();
      params.append('type', reportOptions.reportType);
      params.append('address', reportOptions.includeAddress);
      params.append('notes', reportOptions.includeNotes);
      params.append('sort', reportOptions.sortBy);

      const url = `/reports/clients/${format}?${params.toString()}`;

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'blob',
        validateStatus: status => status < 500 // Accept 4xx for custom handling
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        setError('Session expired or unauthorized. Please log in again.');
        setIsGenerating(false);
        // Optionally redirect to login
        return;
      }

      // Check for valid file
      const contentType = response.headers['content-type'];
      if (
        (format === 'pdf' && !contentType.includes('pdf')) ||
        (format === 'excel' && !contentType.includes('spreadsheet'))
      ) {
        setError('Failed to generate report. Invalid file format received.');
        setIsGenerating(false);
        return;
      }

      // Create a download link
      const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = fileUrl;
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute(
        'download',
        `berwa-clients-${reportOptions.reportType}-${timestamp}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Report generated and downloaded successfully.');

      // Track report generation (optional)
      try {
        await axios.post('/reports/track', {
          reportType: format.toUpperCase(),
          details: `Generated ${reportOptions.reportType} clients report`
        });
      } catch (trackErr) {
        // Don't block UI, just log
        console.warn('Failed to track report:', trackErr);
      }

    } catch (err) {
      if (err.response && err.response.status === 401) {
        setError('Unauthorized. Please log in again.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(`Failed to generate report. ${err.response.data.message}`);
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your connection or try again later.');
      } else {
        setError('Failed to generate report. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="reports-container">
      <h2>Generate Reports</h2>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="report-options">
        <div className="report-config">
          <h3>Report Options</h3>

          <div className="form-group">
            <label>Report Type:</label>
            <select
              name="reportType"
              value={reportOptions.reportType}
              onChange={handleOptionChange}
            >
              <option value="all">All Clients</option>
              <option value="active">Active Clients</option>
              <option value="inactive">Inactive Clients</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sort By:</label>
            <select
              name="sortBy"
              value={reportOptions.sortBy}
              onChange={handleOptionChange}
            >
              <option value="name">Client Name</option>
              <option value="date">Creation Date</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="includeAddress"
                checked={reportOptions.includeAddress}
                onChange={handleOptionChange}
              />
              Include Address
            </label>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="includeNotes"
                checked={reportOptions.includeNotes}
                onChange={handleOptionChange}
              />
              Include Notes
            </label>
          </div>
        </div>

        <div className="report-actions">
          <div className="report-card">
            <h3>PDF Report</h3>
            <p>Generate a professional PDF document with client information</p>
            <button
              onClick={() => generateReport('pdf')}
              className="pdf-btn"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </button>
            <p className="file-info">File size: ~100-500KB</p>
          </div>

          <div className="report-card">
            <h3>Excel Report</h3>
            <p>Generate a spreadsheet with all client data for analysis</p>
            <button
              onClick={() => generateReport('excel')}
              className="excel-btn"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download Excel'}
            </button>
            <p className="file-info">Compatible with Excel and Google Sheets</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;