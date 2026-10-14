export const checkHealth = async () => {
  try {
    const response = await fetch('/api/v1/health');

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al verificar la salud de la API:', error);
    throw error;
  }
};