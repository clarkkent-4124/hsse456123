-- REGU sekarang disimpan sebagai teks manual.
-- Jalankan di database aplikasi HSSE jika kolom laporan_pengawasan.regu belum ada.

ALTER TABLE laporan_pengawasan
  ADD COLUMN IF NOT EXISTS regu VARCHAR(200) NULL AFTER id_ulp;

