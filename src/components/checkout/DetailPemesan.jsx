import { useState } from 'react';

const DEFAULT_FORM = {
  nama: '',
  email: '',
  noWA: '',
  password: '',
  kodeReferral: '',
};

const DetailPemesan = ({ initialData = DEFAULT_FORM, onLanjut }) => {
  const [form, setForm] = useState({ ...DEFAULT_FORM, ...initialData });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onLanjut?.(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Detail Pemesan</h2>
      <p className="text-sm text-gray-500 mb-6">
        Isi data yang akan kami gunakan untuk aktivasi order dan konfirmasi pembayaran.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
          <input
            type="text"
            required
            value={form.nama}
            onChange={(event) => handleChange('nama', event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Nama Anda"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(event) => handleChange('email', event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="email@anda.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. WhatsApp</label>
          <input
            type="tel"
            required
            value={form.noWA}
            onChange={(event) => handleChange('noWA', event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => handleChange('password', event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Buat password jika akun belum ada"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Referral</label>
          <input
            type="text"
            value={form.kodeReferral}
            onChange={(event) => handleChange('kodeReferral', event.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Opsional"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
      >
        Lanjut ke Pembayaran
      </button>
    </form>
  );
};

export default DetailPemesan;
