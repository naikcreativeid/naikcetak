import { validateVoucher } from '../../utils/voucherUtils';

export default function handler(req, res) {
  const { kode, productId } = req.body;
  const result = validateVoucher(kode, productId);
  res.status(200).json(result);
}
