import CONFIG from '../config/config';

const ENDPOINTS = {
  USER_REGISTER: `${CONFIG.BASE_URL}/users`,
};

// Register User Function
export async function registerUser({ nama, email, password, confirmPassword, phone, gender }) {
  try {
    console.log('Attempting registration with:', { email, phone });

    // Transform data untuk API (nama → name)
    const apiData = {
      name: nama.trim(),
      email: email.trim().toLowerCase(),
      password,
      confirmPassword,
      phone: phone.trim(),
      gender
    };

    const response = await fetch(ENDPOINTS.USER_REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiData),
    });

    console.log('Register response status:', response.status);

    const data = await response.json();
    console.log('Register response data:', data);

    if (response.ok) {
      // Registrasi berhasil
      console.log('Registration successful!');
      
      return {
        success: true,
        user: data.user,
        message: data.msg || 'Registrasi berhasil!'
      };

    } else {
      // Registrasi gagal
      let errorMessage;
      
      if (response.status === 400) {
        errorMessage = data.msg || 'Data yang Anda masukkan tidak valid';
      } else if (response.status === 409) {
        errorMessage = 'Email atau nomor HP sudah terdaftar';
      } else {
        errorMessage = data.msg || 'Registrasi gagal';
      }

      return {
        success: false,
        message: errorMessage
      };
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle different types of errors
    let errorMessage;
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      errorMessage = 'Gagal terhubung ke server. Pastikan server berjalan di localhost:5000';
    } else {
      errorMessage = 'Terjadi kesalahan saat registrasi. Silakan coba lagi.';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
}