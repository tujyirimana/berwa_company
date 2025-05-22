import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    contactInfo: '',
    address: '',
    notes: ''
  });
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const fetchClient = async () => {
        try {
          const response = await axios.get(`/clients/${id}`);
          setFormData({
            name: response.data.name,
            contactInfo: response.data.contactInfo,
            address: response.data.address || '',
            notes: response.data.notes || ''
          });
        } catch (err) {
          setError('Failed to fetch client data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchClient();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        await axios.put(`/clients/${id}`, formData);
      } else {
        await axios.post('/clients', formData);
      }
      navigate('/clients');
    } catch (err) {
      setError(id ? 'Failed to update client' : 'Failed to create client');
      console.error(err);
    }
  };

  if (loading) return <div>Loading client data...</div>;

  return (
    <div className="form-container">
      <h2>{id ? 'Edit Client' : 'Add New Client'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Contact Info *</label>
          <input
            type="text"
            name="contactInfo"
            value={formData.contactInfo}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="4"
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {id ? 'Update Client' : 'Add Client'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/clients')} 
            className="cancel-btn"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;