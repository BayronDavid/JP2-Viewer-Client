export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('http://localhost:8000/upload/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error al subir la imagen:', error);
    }
};

export const getLowResolutionImage = async () => {
    try {
        const response = await axios.get(`http://localhost:8000/image`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener la imagen:', error);
    }
};

export const segmentImage = async (x, y, width, height, resolution) => {
    try {
        const response = await axios.get(`http://localhost:8000/image_segment/?x=${x}&y=${y}&width=${width}&height=${height}&resolution=${resolution}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error) {
        console.error('Error al segmentar la imagen:', error);
    }
};