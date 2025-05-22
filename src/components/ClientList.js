import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get('/clients');
        setClients(response.data);
      } catch (err) {
        setError('Failed to fetch clients');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await axios.delete(`/clients/${id}`);
        setClients(clients.filter(client => client.clientId !== id));
      } catch (err) {
        setError('Failed to delete client');
        console.error(err);
      }
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading clients...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="client-list-container">
      <div className="list-header">
        <h2>Client Management</h2>
        <div className="actions">
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Link to="/clients/add" className="add-btn">
            Add New Client
          </Link>
        </div>
      </div>

      <table className="client-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Address</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredClients.map(client => (
            <tr key={client.clientId}>
              <td>{client.name}</td>
              <td>{client.contactInfo}</td>
              <td>{client.address || '-'}</td>
              <td className="actions">
                <Link to={`/clients/edit/${client.clientId}`} className="edit-btn">
                  Edit
                </Link>
                <button 
                  onClick={() => handleDelete(client.clientId)} 
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientList;