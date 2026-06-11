/**
 * Ambil pesan error yang tepat dari response Axios.
 * Backend format: { success: false, error: { code, message } }
 *
 * @param {unknown} err  - error dari catch block
 * @param {string} fallback - pesan default jika tidak ada message dari server
 */
export function getErrorMessage(err, fallback = 'Terjadi kesalahan, coba lagi') {
  // Ambil dari response body backend: { error: { message } }
  const serverMsg = err?.response?.data?.error?.message

  // Fallback ke format lama jika ada
  const legacyMsg = err?.response?.data?.message

  // HTTP status khusus tanpa body
  if (!serverMsg && !legacyMsg) {
    const status = err?.response?.status
    if (status === 401) return 'Email atau password salah'
    if (status === 403) return 'Akses ditolak'
    if (status === 404) return 'Data tidak ditemukan'
    if (status === 409) return 'Data sudah ada / konflik'
    if (status === 422) {
      // Ambil detail validasi jika ada
      const details = err?.response?.data?.error?.details
      if (details?.length) {
        return details.map((d) => d.message).join(', ')
      }
      return 'Data tidak valid'
    }
    if (status === 429) return 'Terlalu banyak permintaan, coba lagi nanti'
    if (status >= 500) return 'Server error, coba beberapa saat lagi'
  }

  return serverMsg || legacyMsg || fallback
}
