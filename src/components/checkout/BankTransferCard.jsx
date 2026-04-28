const BankTransferCard = ({ bank, selected = false, onSelect, onCopy }) => {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <button type="button" onClick={() => onSelect?.(bank.id)} className="w-full text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={bank.logo} alt={bank.bank} className="h-6 object-contain" />
            <div>
              <p className="text-sm font-semibold text-gray-900">{bank.bank}</p>
              <p className="text-xs text-gray-500">{bank.atasNama}</p>
            </div>
          </div>
          <div className={`w-4 h-4 rounded-full border ${selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`} />
        </div>
      </button>

      <div className="mt-4 rounded-lg bg-white border border-gray-200 px-3 py-2">
        <p className="text-xs text-gray-500">No. Rekening</p>
        <p className="text-sm font-bold text-gray-900">{bank.noRek}</p>
      </div>

      <button
        type="button"
        onClick={() => onCopy?.(bank.noRek, bank.id)}
        className="mt-3 w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
      >
        Salin No. Rek
      </button>
    </div>
  );
};

export default BankTransferCard;
