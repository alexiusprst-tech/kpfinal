# RULES - Sistem Informasi Verifikasi Soal

1. Jangan membuat business logic besar di Controller.
2. Gunakan Form Request untuk validation kompleks.
3. Gunakan Service/Action untuk business logic.
4. Gunakan Policy untuk authorization.
5. Jangan mengandalkan frontend untuk security.
6. File soal harus private.
7. Jangan menghapus histori verifikasi.
8. Jangan menghapus histori penugasan.
9. Jangan menghapus histori revisi.
10. Semua perubahan status harus tervalidasi.
11. Import Excel menggunakan transaction.
12. Jangan menyimpan data parsial jika import gagal.
13. Jangan membuat duplicate pivot mapping.
14. Gunakan TypeScript strict.
15. Hindari penggunaan any.
16. Reuse component.
17. Jangan membuat duplicate component.
18. UI harus mengikuti DESIGN.md.
19. Schema harus mengikuti DATABASE.md.
20. Perubahan business rule harus memperbarui PRD.md dan RULES.md.
21. Perubahan database harus memperbarui DATABASE.md dan SCHEMA.md.
22. Perubahan architecture harus memperbarui ARCHITECTURE.md.
23. Jangan menghapus fitur existing tanpa alasan.
24. Jangan membuat asumsi bisnis tanpa dokumentasi.
25. Role system only: SuperAdmin, Dosen Koordinator Mata Kuliah, Dosen Verifikator.
26. Satu mata kuliah dapat memiliki banyak PLO dan banyak CLO.
27. Satu CLO dapat dipetakan ke banyak PLO.
28. Penugasan Koordinator dan Verifikator berdasarkan Mata Kuliah + Periode.
29. Hanya periode ACTIVE yang boleh digunakan untuk upload dan verifikasi.
30. Setiap penugasan/riwayat harus disimpan; gunakan soft delete jika perlu.
31. Validasi file upload meliputi extension, MIME type, size, periode, dan authorisasi.
32. Penugasan koordinator/verifikator dapat memiliki lebih dari satu verifikator per mata kuliah dan periode.
33. Dosen tidak boleh memverifikasi soal miliknya sendiri jika dia pengunggah.
34. Endpoints harus mendokumentasikan method, url, request, validation, response, dan business rules.
35. Dokumentasi harus dibuat sebelum implementasi fitur besar.
