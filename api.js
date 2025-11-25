const API_BASE_URL = 'http://192.168.1.43:3000';

window.api = {
  async getCDs() {
    const res = await fetch(`${API_BASE_URL}/cds`);
    if (!res.ok) throw new Error('Failed to fetch CDs');
    return res.json();
  },

  async addCD(cd) {
    const res = await fetch(`${API_BASE_URL}/cds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cd),
    });
    if (!res.ok) throw new Error('Failed to add CD');
    return res.json();
  },

  async updateCD(cd) {
    const res = await fetch(`${API_BASE_URL}/cds/${cd.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cd),
    });
    if (!res.ok) throw new Error('Failed to update CD');
    return res.json();
  },

  async deleteCD(id) {
    const res = await fetch(`${API_BASE_URL}/cds/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete CD');
    return res.json();
  },

  async getLastfmKey() {
    const res = await fetch(`${API_BASE_URL}/config/lastfm-key`);
    if (!res.ok) throw new Error('Failed to get Last.fm key');
    return res.json();
  },
};
