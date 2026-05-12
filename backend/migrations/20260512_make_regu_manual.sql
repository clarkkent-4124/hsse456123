-- REGU sudah disimpan sebagai teks manual di laporan_pengawasan.regu.
-- Kolom lama id_regu tidak lagi dipakai aplikasi. Foreign key lama perlu
-- dilepas dulu agar id_regu bisa dibuat nullable dan tidak menghambat INSERT.

ALTER TABLE laporan_pengawasan
  DROP FOREIGN KEY fk_lp_regu;

ALTER TABLE laporan_pengawasan
  MODIFY COLUMN id_regu INT NULL;
